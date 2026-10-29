import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { incidentReportingMiddleware } from './server/incidentReportingServer.js';
import { defaultPublishingStorePath } from './server/publishingStorageConfig.js';
import { securityHeaders } from './server/securityHeaders.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Security response headers (CSP, HSTS, framing, referrer, etc.)
app.disable('x-powered-by');
app.use(securityHeaders());

// JSON and URL-encoded body parsers with conservative ceiling (256KB)
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: false, limit: '256kb' }));

// Return clean JSON 400 on malformed JSON payloads targeting /api/*
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    res.status(400).json({
      statusCode: 400,
      error: 'BadRequest',
      message: 'Malformed JSON request body.',
    });
    return;
  }
  next(err);
});

// Mount incident reporting intake middleware
app.use(incidentReportingMiddleware);

// Mount migrated Advisories API (Native Delivery Plane)
// Mount internal Advisory Publishing API (Control Plane)
process.env.TTCSIRT_PUBLISHING_STORE_PATH ||= defaultPublishingStorePath(__dirname, process.env.NODE_ENV);
const { advisoriesRouter } = await import('./server/advisoriesRouter.js');
const { publishingRouter } = await import('./services/publishing-api/src/router.ts');
const { isDevAuthEnabled } = await import('./services/publishing-api/src/auth/dev-auth-config.ts');
app.use('/api/advisories', advisoriesRouter);
app.use('/api/publishing', publishingRouter);

// Internal Publishing Control Plane static application
const publishingDist = path.join(__dirname, 'dist-publishing');
if (fs.existsSync(publishingDist)) {
  // Route-level kill switch: mechanically block /publishing/dev-login when dev auth is disabled
  app.use((req, res, next) => {
    if (req.path === '/publishing/dev-login' || req.path.startsWith('/publishing/dev-login/')) {
      if (!isDevAuthEnabled()) {
        res.status(404).send('Not Found');
        return;
      }
    }
    next();
  });

  app.use('/publishing', express.static(publishingDist));
  app.use('/publishing', (req, res) => {
    res.sendFile(path.join(publishingDist, 'index.html'));
  });
}

// Ensure unmatched /api/* routes return JSON 404 rather than HTML
app.use('/api', (req, res) => {
  res.status(404).json({
    statusCode: 404,
    error: 'NotFound',
    message: `API endpoint not found: ${req.method} ${req.originalUrl || req.url}`,
  });
});

// Public Delivery Plane static application
app.use(express.static(path.join(__dirname, 'dist')));

const publicPageRoutes = new Set([
  '/',
  '/services',
  '/services/incident-response',
  '/services/proactive-risk-management',
  '/services/proactive-risk',
  '/report-an-incident',
  '/report',
  '/advisories',
  '/guidance',
  '/news-events',
  '/news',
  '/events',
  '/workshops',
  '/training',
  '/statistics',
  '/about',
  '/national-cyber-security-strategy',
  '/about/national-cyber-security-strategy',
  '/about/strategy',
  '/strategy',
  '/contact',
  '/contact-us',
  '/accessibility-statement',
  '/accessibility',
  '/privacy-policy',
  '/privacy',
  '/search',
]);
const publicPagePrefixes = [
  '/services/',
  '/advisories/',
  '/guidance/',
  '/news/',
  '/events/',
  '/workshops/',
  '/training/',
];

app.use((req, res) => {
  const pathname = req.path.replace(/\/+$/, '') || '/';
  const isPublicPage = publicPageRoutes.has(pathname) ||
    publicPagePrefixes.some((prefix) => pathname.startsWith(prefix));
  res.status(isPublicPage ? 200 : 404).sendFile(path.join(__dirname, 'dist', 'index.html'));
});

import http from "http";
http.createServer(app).listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
