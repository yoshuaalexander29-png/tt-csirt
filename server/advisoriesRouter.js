import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { publishingStorage } from '../services/publishing-api/src/storage/dev-storage.ts';
import { getPublishedAdvisoryPosts } from './publishedAdvisoryFeed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Load migrated advisories from persistent storage
let advisoriesCache = [];
const dataFilePath = path.join(__dirname, 'data', 'migratedAdvisories.json');
const fallbackPath = path.join(__dirname, '..', 'public', 'data', 'advisories.json');

try {
  if (fs.existsSync(dataFilePath)) {
    const raw = fs.readFileSync(dataFilePath, 'utf8');
    advisoriesCache = JSON.parse(raw);
  } else if (fs.existsSync(fallbackPath)) {
    const raw = fs.readFileSync(fallbackPath, 'utf8');
    advisoriesCache = JSON.parse(raw);
  }
} catch (err) {
  console.error('Failed to load migrated advisories cache:', err.message);
  advisoriesCache = [];
}

/**
 * Filter an advisory object to include only requested fields (WordPress _fields param)
 */
function filterFields(item, fieldsParam) {
  if (!fieldsParam || typeof fieldsParam !== 'string') return item;
  const fields = fieldsParam.split(',').map((f) => f.trim()).filter(Boolean);
  if (fields.length === 0) return item;

  const filtered = {};
  for (const field of fields) {
    if (field in item) {
      filtered[field] = item[field];
    }
  }
  if (item.ttcsirtPublishingRecord && item.referenceNumber) {
    filtered.referenceNumber = item.referenceNumber;
  }
  return filtered;
}

/**
 * Safe query extractor that works across Express and Connect/Vite
 */
function getQueryParams(req) {
  if (req.query && typeof req.query === 'object') return req.query;
  try {
    const parsedUrl = new URL(req.originalUrl || req.url, 'http://localhost');
    const params = {};
    for (const [key, value] of parsedUrl.searchParams.entries()) {
      params[key] = value;
    }
    return params;
  } catch {
    return {};
  }
}

/**
 * Common handler for listing advisories (matching WordPress REST API format)
 */
function handleList(req, res) {
  const query = getQueryParams(req);
  const { page = 1, per_page = 10, slug, categories, search, _fields } = query;

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedPerPage = Math.max(1, Math.min(100, parseInt(per_page, 10) || 10));

  const publishedPosts = getPublishedAdvisoryPosts(publishingStorage);
  const knownSlugs = new Set(advisoriesCache.map((item) => String(item.slug).toLowerCase()));
  let results = [
    ...advisoriesCache,
    ...publishedPosts.filter((item) => !knownSlugs.has(item.slug.toLowerCase())),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter by exact slug if provided
  if (slug && typeof slug === 'string') {
    const normSlug = slug.trim().toLowerCase();
    results = results.filter((item) => String(item.slug).toLowerCase() === normSlug);
  }

  // Filter by categories if provided (comma-separated category IDs)
  if (categories && typeof categories === 'string') {
    const catIds = categories.split(',').map((c) => parseInt(c.trim(), 10)).filter((n) => !isNaN(n));
    if (catIds.length > 0) {
      results = results.filter((item) => {
        if (!Array.isArray(item.categories)) return false;
        return catIds.some((cid) => item.categories.includes(cid));
      });
    }
  }

  // Filter by search keyword if provided
  if (search && typeof search === 'string') {
    const q = search.trim().toLowerCase();
    results = results.filter((item) => {
      const title = item.title?.rendered || item.title || '';
      const excerpt = item.excerpt?.rendered || item.excerpt || '';
      const content = item.content?.rendered || item.content || '';
      return (
        String(title).toLowerCase().includes(q) ||
        String(excerpt).toLowerCase().includes(q) ||
        String(content).toLowerCase().includes(q)
      );
    });
  }

  const total = results.length;
  const totalPages = Math.max(1, Math.ceil(total / parsedPerPage));

  // If requested page is beyond totalPages, return 400 with WordPress error code
  if (parsedPage > totalPages && total > 0) {
    res.setHeader('x-wp-total', String(total));
    res.setHeader('x-wp-totalpages', String(totalPages));
    res.setHeader('Access-Control-Expose-Headers', 'x-wp-total, x-wp-totalpages');
    return res.status(400).json({
      code: 'rest_post_invalid_page_number',
      message: 'The page number requested is larger than the maximum number of pages.',
      data: { status: 400 },
    });
  }

  const startIndex = (parsedPage - 1) * parsedPerPage;
  const paged = results.slice(startIndex, startIndex + parsedPerPage);

  const finalOutput = paged.map((item) => filterFields(item, _fields));

  res.setHeader('x-wp-total', String(total));
  res.setHeader('x-wp-totalpages', String(totalPages));
  res.setHeader('Access-Control-Expose-Headers', 'x-wp-total, x-wp-totalpages');
  res.setHeader('Content-Type', 'application/json');

  return res.json(finalOutput);
}

/**
 * Common handler for retrieving a single advisory by numeric ID
 */
function handleSingle(req, res) {
  const { id } = req.params;
  const query = getQueryParams(req);
  const { _fields } = query;

  const isNumeric = /^\d+$/.test(String(id).trim());
  let item = null;
  const publishedPosts = getPublishedAdvisoryPosts(publishingStorage);

  if (isNumeric) {
    const numId = parseInt(id, 10);
    item = advisoriesCache.find((a) => a.id === numId) || publishedPosts.find((a) => a.id === numId);
  } else {
    // If a slug was passed to the ID route
    const normSlug = String(id).toLowerCase().trim();
    item = advisoriesCache.find((a) => String(a.slug).toLowerCase() === normSlug) ||
      publishedPosts.find((a) => String(a.slug).toLowerCase() === normSlug);
  }

  if (!item) {
    return res.status(404).json({
      code: 'rest_post_invalid_id',
      message: 'Invalid post ID.',
      data: { status: 404 },
    });
  }

  res.setHeader('Content-Type', 'application/json');
  return res.json(filterFields(item, _fields));
}

// Routes supporting both /api/advisories/posts and direct /api/advisories
router.get('/posts', handleList);
router.get('/posts/:id', handleSingle);
router.get('/', handleList);
router.get('/:id', (req, res, next) => {
  // If id is "posts", let other routes match
  if (req.params.id === 'posts') return next();
  handleSingle(req, res);
});

export { router as advisoriesRouter };
