import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import { defaultPublishingStorePath } from '../../server/publishingStorageConfig.js';

const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'ttcsirt-publishing-'));
const storePath = path.join(tempDirectory, 'published-advisories.json');
process.env.TTCSIRT_PUBLISHING_STORE_PATH = storePath;
process.env.NODE_ENV = 'development';
process.env.ENABLE_DEV_AUTH = 'true';

const [{ publishingRouter }, { advisoriesRouter }, { getPublishedAdvisoryPosts }, auth, publishing, publicAdvisories] = await Promise.all([
  import('../../services/publishing-api/src/router.ts'),
  import('../../server/advisoriesRouter.js'),
  import('../../server/publishedAdvisoryFeed.js'),
  import('../../services/publishing-api/src/auth/auth-middleware.ts'),
  import('../../services/publishing-api/src/index.ts'),
  import('../../src/services/advisories.ts'),
]);

const users = {
  authorA: {
    id: 'author-a', email: 'author.a@ttcsirt.gov.tt', displayName: 'Author A',
    roles: ['author'], department: 'TT-CSIRT', lastLoginAt: new Date().toISOString(),
  },
  authorB: {
    id: 'author-b', email: 'author.b@ttcsirt.gov.tt', displayName: 'Author B',
    roles: ['author'], department: 'TT-CSIRT', lastLoginAt: new Date().toISOString(),
  },
  reviewer: {
    id: 'reviewer', email: 'reviewer@ttcsirt.gov.tt', displayName: 'Reviewer',
    roles: ['reviewer'], department: 'TT-CSIRT', lastLoginAt: new Date().toISOString(),
  },
  approver: {
    id: 'approver', email: 'approver@ttcsirt.gov.tt', displayName: 'Approver',
    roles: ['approver'], department: 'TT-CSIRT', lastLoginAt: new Date().toISOString(),
  },
};

auth.setAuthenticationProvider({
  getProviderName: () => 'publishing integration test',
  isProductionReady: () => false,
  async authenticate(headers) {
    return users[headers['x-test-user']] || null;
  },
});

const app = express();
app.use(express.json());
app.use('/api/publishing', publishingRouter);
app.use('/api/advisories', advisoriesRouter);
const server = await new Promise((resolve) => {
  const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
});
const baseUrl = `http://127.0.0.1:${server.address().port}`;

test('production publishing storage is isolated from seeded development advisories', (t) => {
  const originalNodeEnv = process.env.NODE_ENV;
  const productionStoreDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'ttcsirt-production-store-'));
  const productionStorePath = path.join(productionStoreDirectory, 'production-advisories.json');
  t.after(() => {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    fs.rmSync(productionStoreDirectory, { recursive: true, force: true });
  });

  const legacySeed = publishing.devStorage.getAdvisory('adv-seed-published-003');
  const corpusSeed = publishing.devStorage.getAdvisory('adv-seed-published-460');
  assert.ok(legacySeed, 'development fixtures remain available in non-production');
  assert.ok(corpusSeed, 'canonical corpus fixture remains available in non-production');
  const developmentFeed = getPublishedAdvisoryPosts(publishing.devStorage);
  assert.ok(
    !developmentFeed.some((post) => [legacySeed.referenceNumber, corpusSeed.referenceNumber].includes(post.referenceNumber)),
    'development fixtures must not be delivered as public advisories',
  );
  fs.writeFileSync(productionStorePath, JSON.stringify([legacySeed]), { encoding: 'utf8', mode: 0o600 });
  process.env.NODE_ENV = 'production';
  const productionStorage = new publishing.PublishingStorage(productionStorePath);

  assert.equal(publishing.isDevAuthEnabled(), false);
  assert.deepEqual(productionStorage.listAdvisories(), []);
  assert.deepEqual(getPublishedAdvisoryPosts(productionStorage), []);
  assert.notEqual(
    defaultPublishingStorePath('/srv/ttcsirt', 'production'),
    defaultPublishingStorePath('/srv/ttcsirt', 'development'),
    'production and non-production use different default persistence files',
  );
});

async function api(route, actor, method = 'GET', body) {
  const response = await fetch(`${baseUrl}${route}`, {
    method,
    headers: {
      ...(actor ? { 'x-test-user': actor } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { response, data: await response.json() };
}

test('legitimate publication persists and appears through the public advisories API', async (t) => {
  t.after(async () => {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    auth.resetAuthenticationProvider();
    fs.rmSync(tempDirectory, { recursive: true, force: true });
  });

  const seed = publishing.devStorage.getAdvisory('adv-seed-review-002');
  assert.ok(seed, 'Expected a complete seeded advisory to use as valid content');

  const createResult = await api('/api/publishing/advisories', 'authorA', 'POST', {
    ...seed,
    id: `adv-integration-${Date.now()}`,
    referenceNumber: 'TT-CSIRT-ADV-2026-991',
    title: 'Integration publication pipeline regression advisory',
    slug: `integration-publication-${Date.now()}`,
  });
  assert.equal(createResult.response.status, 201, createResult.data.message);
  const advisoryId = createResult.data.advisory.id;
  const slug = createResult.data.advisory.slug;

  const draftPublicList = await api('/api/advisories/posts?categories=5,7,23&per_page=100&page=1');
  assert.equal(draftPublicList.response.status, 200);
  assert.ok(!draftPublicList.data.some((post) => post.slug === slug), 'Draft advisory is not exposed through the public list');
  const draftPublicDetail = await api(`/api/advisories/posts/${slug}?_fields=id,date,modified,slug,title,excerpt,content,categories,tags,link`);
  assert.equal(draftPublicDetail.response.status, 404, 'Draft advisory is not exposed through the public detail route');

  const authorBList = await api('/api/publishing/advisories?status=draft', 'authorB');
  assert.ok(!authorBList.data.advisories.some((item) => item.id === advisoryId));
  const authorBDetail = await api(`/api/publishing/advisories/${advisoryId}`, 'authorB');
  assert.equal(authorBDetail.response.status, 404);
  const authorBPreview = await api(`/api/publishing/advisories/${advisoryId}/preview-token`, 'authorB', 'POST', {});
  assert.equal(authorBPreview.response.status, 404);
  const authorBUpdate = await api(`/api/publishing/advisories/${advisoryId}`, 'authorB', 'PUT', {
    expectedVersion: 1,
    title: 'Unauthorised change',
  });
  assert.equal(authorBUpdate.response.status, 400);
  const authorAList = await api('/api/publishing/advisories?status=draft', 'authorA');
  assert.ok(authorAList.data.advisories.some((item) => item.id === advisoryId));
  const authorBAudit = await api('/api/publishing/audit', 'authorB');
  assert.ok(!authorBAudit.data.events.some((event) => event.advisoryId === advisoryId));
  const authorBValidation = await api(`/api/publishing/advisories/${advisoryId}/validate`, 'authorB', 'POST', {});
  assert.equal(authorBValidation.response.status, 404);

  const deniedSubmit = await api(`/api/publishing/advisories/${advisoryId}/submit-review`, 'authorB', 'POST', {});
  assert.equal(deniedSubmit.response.status, 400);
  assert.match(deniedSubmit.data.message, /only the advisory author/i);

  const submitted = await api(`/api/publishing/advisories/${advisoryId}/submit-review`, 'authorA', 'POST', {});
  assert.equal(submitted.response.status, 200, submitted.data.message);
  const reviewerDetail = await api(`/api/publishing/advisories/${advisoryId}`, 'reviewer');
  assert.equal(reviewerDetail.response.status, 200);
  const otherAuthorReviewList = await api('/api/publishing/advisories?status=ready_for_review', 'authorB');
  assert.ok(!otherAuthorReviewList.data.advisories.some((item) => item.id === advisoryId));

  const approved = await api(`/api/publishing/advisories/${advisoryId}/approve`, 'approver', 'POST', {});
  assert.equal(approved.response.status, 200, approved.data.message);
  const published = await api(`/api/publishing/advisories/${advisoryId}/publish`, 'approver', 'POST', {});
  assert.equal(published.response.status, 200, published.data.message);
  assert.equal(published.data.advisory.publication.status, 'published');
  assert.equal(published.data.isPubliclyAvailable, true);

  const publicList = await api('/api/advisories/posts?categories=5,7,23&per_page=100&page=1');
  assert.equal(publicList.response.status, 200);
  const publicPost = publicList.data.find((post) => post.slug === slug);
  assert.ok(publicPost, 'Published advisory is present in the same feed consumed by /advisories');
  const normalized = publicAdvisories.normalizeWordPressPost(publicPost);
  assert.equal(normalized?.referenceNumber, 'TT-CSIRT-ADV-2026-991');
  assert.equal(normalized?.categoryName, 'Advisory');
  const publicServiceResult = await publicAdvisories.fetchLiveAdvisories({
    perPage: 100,
    endpoint: `${baseUrl}/api/advisories/posts?categories=5,7,23&per_page=100&page=1`,
  });
  assert.equal(publicServiceResult.status, 'success');
  assert.ok(publicServiceResult.advisories.some((item) => item.slug === slug));

  const detail = await api(`/api/advisories/posts/${slug}?_fields=id,date,modified,slug,title,excerpt,content,categories,tags,link`);
  assert.equal(detail.response.status, 200);
  const normalizedDetail = publicAdvisories.normalizeWordPressPostDetail(detail.data);
  assert.ok(normalizedDetail?.contentHtml.includes('<h2>Overview</h2>'));

  const audit = await api(`/api/publishing/advisories/${advisoryId}/audit`, 'authorA');
  assert.ok(audit.data.events.some((event) => event.action === 'PUBLISHED'));
  const reopenedAudit = new publishing.AuditService(`${storePath}.audit.json`);
  const publishedEvent = reopenedAudit.getEventsForAdvisory(advisoryId).find((event) => event.action === 'PUBLISHED');
  assert.equal(publishedEvent?.actor.userId, 'approver');
  const reopenedStore = new publishing.DevStorage(storePath);
  assert.equal(reopenedStore.getAdvisory(advisoryId)?.publication.status, 'published');
  assert.ok(reopenedStore.getPublishedAdvisory(advisoryId)?.isPublicDeliveryReady);
  assert.ok(getPublishedAdvisoryPosts(reopenedStore).some((item) => item.slug === slug));
  const reopenedVersions = new publishing.VersionService(`${storePath}.versions.json`);
  assert.equal(reopenedVersions.getVersionHistory(advisoryId)[0]?.publishedByUserId, 'approver');
  reopenedStore.saveAdvisory(reopenedStore.getAdvisory(advisoryId));

  const invalidParent = path.join(tempDirectory, 'not-a-directory');
  fs.writeFileSync(invalidParent, 'block directory creation');
  const failingStore = new publishing.DevStorage(path.join(invalidParent, 'published.json'));
  assert.throws(() => failingStore.saveAdvisory(reopenedStore.getAdvisory(advisoryId)));
  assert.equal(failingStore.getAdvisory(advisoryId), null);
  assert.equal(failingStore.getPublishedAdvisory(advisoryId), null);
});
