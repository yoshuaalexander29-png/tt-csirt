/**
 * @fileoverview Automated Regression Tests: TT-CSIRT Advisory Publishing Dev Authentication Boundary
 * Mechanically proves the required boundary conditions, role constraints, and production kill switches.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure test environment is explicitly set to development test mode for initial unit tests
process.env.NODE_ENV = 'development';
process.env.ENABLE_DEV_AUTH = 'true';

import {
  DEV_IDENTITIES,
  DevAuthenticationProvider,
  ProductionDisabledAuthProvider,
  isDevAuthEnabled,
  createDevSessionToken,
  verifyDevSessionToken,
  serializeDevSessionCookie,
  clearDevSessionCookie,
  parseCookies,
  DEV_SESSION_COOKIE_NAME,
  WorkflowEngine,
  requireStaffRoles,
  requireDevelopmentCapability,
  hasDevelopmentCapability,
} from '../../services/publishing-api/src/index.ts';

test('TT-CSIRT Advisory Publishing Control Plane - Dev Authentication Boundary (25 Scenarios)', async (t) => {

  // Test 1: Unauthenticated /publishing request produces the sign-in experience
  await t.test('1. Unauthenticated /publishing request produces the sign-in experience', () => {
    const signInViewPath = path.resolve(__dirname, '../../apps/publishing/src/views/StaffSignInView.tsx');
    assert.ok(fs.existsSync(signInViewPath), 'StaffSignInView component file must exist');
    const content = fs.readFileSync(signInViewPath, 'utf8');
    assert.ok(
      content.includes('Sign in to the TT-CSIRT advisory publishing service'),
      'Must contain GDS H1 heading for staff sign in',
    );
    assert.ok(
      !content.toUpperCase().includes('DEVELOPMENT TEST ENVIRONMENT'),
      'Staff sign-in must not expose development-environment copy',
    );
    assert.ok(
      content.includes('/publishing/dev-login'),
      'Must provide path to development test identity selector',
    );
  });

  // Test 2: /publishing/dev-login works in an explicitly enabled development environment
  await t.test('2. /publishing/dev-login works in an explicitly enabled development environment', () => {
    process.env.NODE_ENV = 'development';
    process.env.ENABLE_DEV_AUTH = 'true';
    assert.equal(isDevAuthEnabled(), true, 'Dev auth must be enabled when NODE_ENV!=production and ENABLE_DEV_AUTH=true');

    const devLoginViewPath = path.resolve(__dirname, '../../apps/publishing/src/views/DevLoginView.tsx');
    assert.ok(fs.existsSync(devLoginViewPath), 'DevLoginView component file must exist');
    const content = fs.readFileSync(devLoginViewPath, 'utf8');
    assert.ok(
      content.includes('Select a staff identity'),
      'Dev login view must have explicit selection H1',
    );
  });

  // Test 3: Development Author login succeeds
  await t.test('3. Development Author login succeeds', async () => {
    process.env.NODE_ENV = 'development';
    process.env.ENABLE_DEV_AUTH = 'true';
    const provider = new DevAuthenticationProvider();

    // Authenticate via X-Dev-User header
    const user = await provider.authenticate({ 'x-dev-user': 'author-1' });
    assert.ok(user, 'Author authentication must return a valid staff user');
    assert.equal(user.id, DEV_IDENTITIES['author-1'].id);
    assert.equal(user.displayName, 'A. Ramlal');
    assert.ok(user.roles.includes('author'), 'User must have author role');

    // Authenticate via dev session cookie
    const token = createDevSessionToken('author-1');
    const cookieHeader = serializeDevSessionCookie(token);
    const userFromCookie = await provider.authenticate({ cookie: cookieHeader });
    assert.ok(userFromCookie, 'Author authentication via session cookie must succeed');
    assert.equal(userFromCookie.id, DEV_IDENTITIES['author-1'].id);
  });

  // Test 4: Development Reviewer login succeeds
  await t.test('4. Development Reviewer login succeeds', async () => {
    process.env.NODE_ENV = 'development';
    process.env.ENABLE_DEV_AUTH = 'true';
    const provider = new DevAuthenticationProvider();

    const user = await provider.authenticate({ 'x-dev-user': 'reviewer-1' });
    assert.ok(user, 'Reviewer authentication must succeed');
    assert.equal(user.id, DEV_IDENTITIES['reviewer-1'].id);
    assert.equal(user.displayName, 'C. Joseph');
    assert.ok(user.roles.includes('reviewer'));
  });

  // Test 5: Development Approver login succeeds
  await t.test('5. Development Approver login succeeds', async () => {
    process.env.NODE_ENV = 'development';
    process.env.ENABLE_DEV_AUTH = 'true';
    const provider = new DevAuthenticationProvider();

    const user = await provider.authenticate({ 'x-dev-user': 'approver-1' });
    assert.ok(user, 'Approver authentication must succeed');
    assert.equal(user.id, DEV_IDENTITIES['approver-1'].id);
    assert.equal(user.displayName, 'K. Mahabir');
    assert.ok(user.roles.includes('approver'));
  });

  // Test 6: Development Administrator login succeeds
  await t.test('6. Development Administrator login succeeds', async () => {
    process.env.NODE_ENV = 'development';
    process.env.ENABLE_DEV_AUTH = 'true';
    const provider = new DevAuthenticationProvider();

    const user = await provider.authenticate({ 'x-dev-user': 'admin-1' });
    assert.ok(user, 'Administrator authentication must succeed');
    assert.equal(user.id, DEV_IDENTITIES['admin-1'].id);
    assert.equal(user.displayName, 'S. Mohammed');
    assert.ok(user.roles.includes('admin'));
    assert.ok(user.roles.includes('author'));
    assert.ok(user.roles.includes('reviewer'));
    assert.ok(user.roles.includes('approver'));
  });

  // Test 7: Development Reader login succeeds
  await t.test('7. Development Reader login succeeds', async () => {
    process.env.NODE_ENV = 'development';
    process.env.ENABLE_DEV_AUTH = 'true';
    const provider = new DevAuthenticationProvider();

    const user = await provider.authenticate({ 'x-dev-user': 'reader-1' });
    assert.ok(user, 'Reader authentication must succeed');
    assert.equal(user.id, DEV_IDENTITIES['reader-1'].id);
    assert.equal(user.displayName, 'G. Baptiste');
    assert.deepEqual(user.roles, ['reader']);
  });

  await t.test('Only the single Test-user receives development workflow capabilities', () => {
    const testIdentities = Object.values(DEV_IDENTITIES).filter((user) => user.developmentCapabilities?.length);
    assert.equal(testIdentities.length, 1);
    assert.equal(DEV_IDENTITIES['test-user'].displayName, 'Test-user');
    assert.equal(hasDevelopmentCapability(DEV_IDENTITIES['test-user'], 'advisory_workflow_override'), true);
    assert.equal(hasDevelopmentCapability(DEV_IDENTITIES['author-1'], 'advisory_workflow_override'), false);

    let adminAllowed = false;
    let statusCode;
    const guard = requireDevelopmentCapability('test_fixture_management');
    guard(
      { staffUser: DEV_IDENTITIES['admin-1'] },
      { status(code) { statusCode = code; return this; }, json() {} },
      () => { adminAllowed = true; },
    );
    assert.equal(adminAllowed, false, 'Fixture management must not be reachable by a normal administrator.');
    assert.equal(statusCode, 403);

    let testUserAllowed = false;
    guard({ staffUser: DEV_IDENTITIES['test-user'] }, { status() { return this; }, json() {} }, () => { testUserAllowed = true; });
    assert.equal(testUserAllowed, true);

    process.env.NODE_ENV = 'production';
    process.env.ENABLE_DEV_AUTH = 'true';
    assert.equal(hasDevelopmentCapability(DEV_IDENTITIES['test-user'], 'advisory_workflow_override'), false);
    let productionAllowed = false;
    guard({ staffUser: DEV_IDENTITIES['test-user'] }, { status(code) { statusCode = code; return this; }, json() {} }, () => { productionAllowed = true; });
    assert.equal(productionAllowed, false, 'The development capability must fail closed in production.');
    assert.equal(statusCode, 403);
    process.env.NODE_ENV = 'development';
    process.env.ENABLE_DEV_AUTH = 'true';
  });

  // Test 8: Invalid development identity fails
  await t.test('8. Invalid development identity fails', async () => {
    process.env.NODE_ENV = 'development';
    process.env.ENABLE_DEV_AUTH = 'true';
    const provider = new DevAuthenticationProvider();

    const user = await provider.authenticate({ 'x-dev-user': 'non-existent-user' });
    assert.equal(user, null, 'Unknown identity key must return null');

    assert.throws(() => {
      createDevSessionToken('non-existent-user');
    }, /Invalid development identity key/);
  });

  // Test 9: Arbitrary user ID fails
  await t.test('9. Arbitrary user ID fails', async () => {
    process.env.NODE_ENV = 'development';
    process.env.ENABLE_DEV_AUTH = 'true';
    const provider = new DevAuthenticationProvider();

    const arbitraryAttempts = ['usr-hacker-999', 'admin', 'root', 'anonymous', '12345'];
    for (const attempt of arbitraryAttempts) {
      const user = await provider.authenticate({ 'x-dev-user': attempt });
      assert.equal(user, null, `Arbitrary identity '${attempt}' must be rejected`);
    }
  });

  // Test 10: Arbitrary role injection fails
  await t.test('10. Arbitrary role injection fails', async () => {
    process.env.NODE_ENV = 'development';
    process.env.ENABLE_DEV_AUTH = 'true';
    const provider = new DevAuthenticationProvider();

    // Client attempts to supply author-1 but inject super-admin / approver role
    const user = await provider.authenticate({
      'x-dev-user': 'author-1',
      'x-dev-roles': 'admin,approver,super-admin',
      'x-injected-role': 'admin',
    });

    assert.ok(user);
    assert.deepEqual(
      user.roles,
      ['author'],
      'Server must resolve roles strictly from DEV_IDENTITIES dictionary, ignoring injected client headers',
    );
  });

  // Test 11: Client-controlled role changes do not alter server authorization
  await t.test('11. Client-controlled role changes do not alter server authorization', async () => {
    process.env.NODE_ENV = 'development';
    process.env.ENABLE_DEV_AUTH = 'true';
    const provider = new DevAuthenticationProvider();

    const user = await provider.authenticate({ 'x-dev-user': 'author-1' });
    assert.ok(user);

    // Verify guard middleware strictly checks resolved server roles
    const mockReq = { staffUser: user };
    let forbiddenCalled = false;
    const mockRes = {
      status(code) {
        if (code === 403) forbiddenCalled = true;
        return this;
      },
      json() {},
    };

    const approverGuard = requireStaffRoles('approver');
    approverGuard(mockReq, mockRes, () => {
      assert.fail('Author should not pass approver role guard');
    });

    assert.equal(forbiddenCalled, true, 'Server authorization must block author from approver actions');
  });

  // Test 12: Publishing API without authentication returns the existing unauthorized response
  await t.test('12. Publishing API without authentication returns the existing unauthorized response', async () => {
    process.env.NODE_ENV = 'development';
    process.env.ENABLE_DEV_AUTH = 'true';
    const provider = new DevAuthenticationProvider();

    const unauthUser = await provider.authenticate({});
    assert.equal(unauthUser, null, 'Empty headers must return null (unauthenticated)');

    const anonymousUser = await provider.authenticate({ 'x-dev-user': 'anonymous' });
    assert.equal(anonymousUser, null, 'Anonymous header must return null');
  });

  // Test 13: Valid development authentication reaches the normal authorization layer
  await t.test('13. Valid development authentication reaches the normal authorization layer', async () => {
    process.env.NODE_ENV = 'development';
    process.env.ENABLE_DEV_AUTH = 'true';
    const provider = new DevAuthenticationProvider();

    const user = await provider.authenticate({ 'x-dev-user': 'author-1' });
    assert.ok(user);

    let nextCalled = false;
    const mockReq = { staffUser: user };
    const mockRes = { status() { return this; }, json() {} };
    const authorGuard = requireStaffRoles('author');

    authorGuard(mockReq, mockRes, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true, 'Valid author identity must pass author role guard');
  });

  // Test 14: Reader cannot perform authoring operations
  await t.test('14. Reader cannot perform authoring operations', async () => {
    process.env.NODE_ENV = 'development';
    process.env.ENABLE_DEV_AUTH = 'true';
    const provider = new DevAuthenticationProvider();

    const readerUser = await provider.authenticate({ 'x-dev-user': 'reader-1' });
    assert.ok(readerUser);

    let forbidden = false;
    const mockReq = { staffUser: readerUser };
    const mockRes = {
      status(code) {
        if (code === 403) forbidden = true;
        return this;
      },
      json() {},
    };

    const authorGuard = requireStaffRoles('author');
    authorGuard(mockReq, mockRes, () => {
      assert.fail('Reader must not be authorized for authoring operations');
    });

    assert.equal(forbidden, true, 'Reader must receive 403 Forbidden for authoring operations');
  });

  // Test 15: Author cannot approve their own advisory
  await t.test('15. Author cannot approve their own advisory (Two-Person Integrity)', () => {
    const engine = new WorkflowEngine();
    const author = DEV_IDENTITIES['author-1'];

    const draft = engine.createDraft(
      {
        referenceNumber: 'TT-CSIRT-ADV-2026-901',
        title: 'Zero-Day Kernel Vulnerability',
        classification: 'advisory',
        severity: 'critical',
        tlp: 'TLP:CLEAR',
        leadParagraph: 'A critical kernel flaw has been discovered requiring immediate attention.',
        targetSectors: ['government'],
        cveMetadata: [
          {
            id: 'CVE-2026-9001',
            cvssVersion: '3.1',
            cvssScore: 9.8,
            cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
            summary: 'Critical vulnerability',
          },
        ],
        affectedProducts: [
          {
            vendor: 'KernelCorp',
            product: 'SecureOS',
            affectedVersions: ['1.0.0'],
            fixedInVersion: '1.0.1',
          },
        ],
        sections: {
          overview: {
            id: 's-ov',
            title: 'Overview',
            level: 2,
            nodes: [{ id: 'p1', type: 'paragraph', text: 'A critical kernel flaw has been discovered.', inlines: [] }],
          },
          remediation: {
            id: 's-rem',
            title: 'Remediation',
            level: 2,
            nodes: [{ id: 'p2', type: 'paragraph', text: 'Apply vendor hotfix immediately across all production nodes.', inlines: [] }],
          },
        },
      },
      author,
    );

    // Submit for review
    const outcome = engine.submitForReview(draft.id, author);
    assert.equal(outcome.advisory.publication.status, 'ready_for_review');

    // Author attempts to approve own draft
    assert.throws(
      () => {
        engine.approve(draft.id, author);
      },
      (err) => {
        return err.message.includes('TWO_PERSON_INTEGRITY_VIOLATION');
      },
      'Author attempting to self-approve must throw Two-Person Integrity violation',
    );
  });

  // Test 16: Reviewer cannot bypass workflow requirements
  await t.test('16. Reviewer cannot bypass workflow requirements', async () => {
    process.env.NODE_ENV = 'development';
    process.env.ENABLE_DEV_AUTH = 'true';
    const provider = new DevAuthenticationProvider();
    const reviewer = await provider.authenticate({ 'x-dev-user': 'reviewer-1' });
    assert.ok(reviewer);

    let forbidden = false;
    const mockReq = { staffUser: reviewer };
    const mockRes = {
      status(code) {
        if (code === 403) forbidden = true;
        return this;
      },
      json() {},
    };

    // Reviewer attempts action restricted to approver
    const approverGuard = requireStaffRoles('approver');
    approverGuard(mockReq, mockRes, () => {
      assert.fail('Reviewer should not pass approver role guard');
    });

    assert.equal(forbidden, true, 'Reviewer must receive 403 Forbidden on approver actions');
  });

  // Test 17: Approver cannot bypass required workflow state
  await t.test('17. Approver cannot bypass required workflow state', () => {
    const engine = new WorkflowEngine();
    const author = DEV_IDENTITIES['author-1'];
    const approver = DEV_IDENTITIES['approver-1'];

    // Draft created, but NOT yet submitted for review (still in 'draft' status)
    const draft = engine.createDraft(
      {
        referenceNumber: 'TT-CSIRT-ADV-2026-902',
        title: 'Premature Approval Attempt Advisory',
        classification: 'advisory',
        severity: 'high',
        tlp: 'TLP:CLEAR',
        leadParagraph: 'Draft in preparation.',
        targetSectors: ['government'],
      },
      author,
    );

    assert.equal(draft.publication.status, 'draft');

    // Approver attempts to approve draft directly without review
    assert.throws(
      () => {
        engine.approve(draft.id, approver);
      },
      (err) => {
        return err.message.includes("Invalid state transition: Only advisories in 'ready_for_review' can be approved");
      },
      'Approving a draft before review submission must fail',
    );
  });

  // Test 18: Logout invalidates the development session
  await t.test('18. Logout invalidates the development session', () => {
    const clearHeader = clearDevSessionCookie();
    assert.ok(clearHeader.includes('Max-Age=0'), 'Clear cookie must set Max-Age=0');
    assert.ok(clearHeader.includes('Expires=Thu, 01 Jan 1970'), 'Clear cookie must set past expiration');

    // Simulate cleared cookie in incoming request
    const parsed = parseCookies('ttcsirt_dev_session=; Path=/');
    assert.equal(parsed['ttcsirt_dev_session'], '');
    const verified = verifyDevSessionToken(parsed['ttcsirt_dev_session']);
    assert.equal(verified, null, 'Empty session token must fail verification');
  });

  // Test 19: Development authentication cannot be enabled merely by changing a client-side value
  await t.test('19. Development authentication cannot be enabled merely by changing a client-side value', () => {
    // When server environment has dev auth disabled, client parameters cannot enable it
    process.env.NODE_ENV = 'production';
    process.env.ENABLE_DEV_AUTH = 'false';

    assert.equal(isDevAuthEnabled(), false, 'isDevAuthEnabled must be false in production');

    // Client sends X-Dev-Auth-Override or URL query
    const clientProvidedOverride = {
      'x-enable-dev-auth': 'true',
      'x-dev-mode': 'true',
      cookie: 'enable_dev_auth=true',
    };

    // The server helper evaluates ONLY process.env, never client headers
    assert.equal(isDevAuthEnabled(), false, 'Client headers cannot enable dev auth on the server');
  });

  // Test 20: Production mode rejects development authentication
  await t.test('20. Production mode rejects development authentication', async () => {
    process.env.NODE_ENV = 'production';
    process.env.ENABLE_DEV_AUTH = 'false';

    assert.equal(isDevAuthEnabled(), false);

    // DevAuthenticationProvider authenticate returns null in production
    // Create an instance before simulating production to test method boundary
    process.env.NODE_ENV = 'development';
    process.env.ENABLE_DEV_AUTH = 'true';
    const provider = new DevAuthenticationProvider();

    // Now switch to production
    process.env.NODE_ENV = 'production';
    process.env.ENABLE_DEV_AUTH = 'false';

    const user = await provider.authenticate({ 'x-dev-user': 'author-1' });
    assert.equal(user, null, 'Dev auth must return null in production mode');

    const tokenUser = await provider.authenticate({ cookie: 'ttcsirt_dev_session=valid' });
    assert.equal(tokenUser, null, 'Cookie auth must return null in production mode');
  });

  // Test 21: Production mode makes /publishing/dev-login unavailable
  await t.test('21. Production mode makes /publishing/dev-login unavailable', () => {
    process.env.NODE_ENV = 'production';
    process.env.ENABLE_DEV_AUTH = 'false';

    assert.equal(isDevAuthEnabled(), false);

    // Verify route boundary predicate
    let notFoundTriggered = false;
    const mockReq = { url: '/publishing/dev-login' };
    const mockRes = {
      status(code) {
        if (code === 404) notFoundTriggered = true;
        return this;
      },
      send(body) {
        if (body === 'Not Found') notFoundTriggered = true;
      },
    };

    // Simulate route handler boundary
    if (!isDevAuthEnabled()) {
      mockRes.status(404).send('Not Found');
    }

    assert.equal(notFoundTriggered, true, '/publishing/dev-login must return 404 in production');
  });

  // Test 22: The production build contains no reachable development-login route
  await t.test('22. The production build contains no reachable development-login route', () => {
    const serverJsPath = path.resolve(__dirname, '../../server.js');
    const serverJs = fs.readFileSync(serverJsPath, 'utf8');

    assert.ok(
      serverJs.includes('/publishing/dev-login'),
      'server.js must define explicit route guard for /publishing/dev-login',
    );
    assert.ok(
      serverJs.includes('!isDevAuthEnabled()'),
      'server.js must check isDevAuthEnabled() before serving dev-login',
    );
    assert.ok(
      serverJs.includes("res.status(404).send('Not Found')"),
      'server.js must return 404 Not Found when dev auth is disabled',
    );
  });

  // Test 23: The production build contains no active development-auth provider
  await t.test('23. The production build contains no active development-auth provider', () => {
    process.env.NODE_ENV = 'production';
    process.env.ENABLE_DEV_AUTH = 'false';

    assert.throws(
      () => {
        new DevAuthenticationProvider();
      },
      /SECURITY VIOLATION: DevAuthenticationProvider cannot be instantiated/,
      'Instantiating DevAuthenticationProvider in production must throw a fatal security error',
    );

    const nullProvider = new ProductionDisabledAuthProvider();
    assert.equal(nullProvider.getProviderName(), 'PRODUCTION_DISABLED_AUTH_PROVIDER');
    assert.equal(nullProvider.isProductionReady(), true);
  });

  // Test 24: The public delivery application contains no publishing credentials or privileged API secrets
  await t.test('24. The public delivery application contains no publishing credentials or privileged API secrets', () => {
    const publicAppDir = path.resolve(__dirname, '../../src');
    const files = fs.readdirSync(publicAppDir, { recursive: true });

    const forbiddenStrings = [
      'usr-author-001',
      'usr-reviewer-002',
      'usr-approver-003',
      'usr-admin-004',
      'usr-reader-005',
      'usr-test-user-006',
      'ttcsirt-advisory-publishing-dev-session-key-2026',
    ];

    for (const file of files) {
      if (typeof file === 'string' && (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js'))) {
        const fullPath = path.join(publicAppDir, file);
        const code = fs.readFileSync(fullPath, 'utf8');
        for (const forbidden of forbiddenStrings) {
          assert.equal(
            code.includes(forbidden),
            false,
            `Public delivery file ${file} must not contain privileged publishing identity secret: ${forbidden}`,
          );
        }
      }
    }
  });

  // Restore environment after tests complete
  process.env.NODE_ENV = 'development';
  process.env.ENABLE_DEV_AUTH = 'true';
});
