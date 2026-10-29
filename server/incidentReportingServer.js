import crypto from 'node:crypto';
import nodemailer from 'nodemailer';

// In-memory security records
const incidentRateLimits = new Map(); // ip -> [timestamps]
const csrfRateLimits = new Map();     // ip -> [timestamps]
const idempotencyStore = new Map();   // key -> { reference, createdAt, data }
let activeSubmissions = 0;
const MAX_CONCURRENT_SUBMISSIONS = 5;

// Test & verification state
let testLastIncident = null;
let testLastSentMail = null;
let simulateMailFailure = false;

// Periodic cleanup of stale records every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, times] of incidentRateLimits.entries()) {
    const valid = times.filter(t => now - t < 15 * 60 * 1000);
    if (valid.length === 0) incidentRateLimits.delete(ip);
    else incidentRateLimits.set(ip, valid);
  }
  for (const [ip, times] of csrfRateLimits.entries()) {
    const valid = times.filter(t => now - t < 10 * 60 * 1000);
    if (valid.length === 0) csrfRateLimits.delete(ip);
    else csrfRateLimits.set(ip, valid);
  }
  for (const [key, item] of idempotencyStore.entries()) {
    if (now - item.createdAt > 24 * 60 * 60 * 1000) {
      idempotencyStore.delete(key);
    }
  }
}, 10 * 60 * 1000).unref();

const VALID_INCIDENT_TYPES = new Set([
  "Ransomware",
  "Phishing & Business Email Compromise",
  "Data Breach & System Compromise",
  "Denial of Service (DoS / DDoS)",
  "Malware & Malicious Code",
  "Website Defacement",
  "Unauthorized Access & Intrusion Attempts",
  "Vulnerability Exploitation & Scanning",
  "Other Cyber Security Incident"
]);

const VALID_SECTORS = new Set([
  "Government / Public Sector",
  "Financial Services & Banking",
  "Energy, Oil & Gas, and Utilities",
  "Telecommunications & Internet Services",
  "Healthcare & Social Services",
  "Education & Research Institutions",
  "Commerce, Retail & Manufacturing",
  "Transport & Logistics",
  "Legal & Professional Services",
  "Other Sector / Civil Society"
]);

const ALLOWED_BODY_FIELDS = new Set([
  "incidentType",
  "incidentTiming",
  "incidentDetails",
  "affectedSystems",
  "impact",
  "evidenceAvailable",
  "evidenceNotes",
  "reporterType",
  "organisation",
  "sector",
  "reporterName",
  "email",
  "phone",
  "website",
  "idempotencyKey",
  "actionsTaken",
  "additionalComments",
  "_csrf"
]);

// Deterministic server secret for HMAC-signed CSRF tokens (shared across scaling instances)
const CSRF_SECRET = process.env.CSRF_SECRET || 
  crypto.createHash('sha256')
    .update(process.env.APPLET_ID || process.env.APP_URL || 'ttcsirt-gov-tt-production-incident-intake-secret-salt-2026')
    .digest('hex');

const CSRF_TOKEN_TTL_MS = 2 * 60 * 60 * 1000; // 2-hour window for deliberate government form completion

function generateCsrfToken() {
  const sessionId = crypto.randomBytes(16).toString('hex');
  const issuedAt = Date.now();
  const expiry = issuedAt + CSRF_TOKEN_TTL_MS;
  const payload = `${sessionId}.${issuedAt}.${expiry}`;
  const signature = crypto.createHmac('sha256', CSRF_SECRET).update(payload).digest('hex');
  return {
    token: `${payload}.${signature}`,
    sessionId,
    issuedAt,
    expiry
  };
}

function verifyCsrfToken(rawToken) {
  if (!rawToken || typeof rawToken !== 'string') {
    return { valid: false, reason: 'missing_or_invalid_type' };
  }
  const token = rawToken.trim();
  const parts = token.split('.');
  if (parts.length !== 4) {
    return { valid: false, reason: 'malformed_structure' };
  }
  const [sessionId, issuedAtStr, expiryStr, signature] = parts;
  const issuedAt = parseInt(issuedAtStr, 10);
  const expiry = parseInt(expiryStr, 10);

  if (!sessionId || isNaN(issuedAt) || isNaN(expiry) || !signature) {
    return { valid: false, reason: 'invalid_components' };
  }

  const now = Date.now();
  // 1-minute clock skew allowance for issuedAt
  if (now < issuedAt - 60000) {
    return { valid: false, reason: 'future_timestamp', sessionId };
  }
  if (now > expiry) {
    return { valid: false, reason: 'expired', sessionId };
  }

  const payload = `${sessionId}.${issuedAtStr}.${expiryStr}`;
  const expectedSignature = crypto.createHmac('sha256', CSRF_SECRET).update(payload).digest('hex');

  const sigBuf = Buffer.from(signature, 'hex');
  const expBuf = Buffer.from(expectedSignature, 'hex');

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { valid: false, reason: 'invalid_signature', sessionId };
  }

  return { valid: true, sessionId, issuedAt, expiry };
}

function isOriginAllowed(req) {
  const secFetchSite = req.headers['sec-fetch-site'];
  // Disallow explicit cross-site submission
  if (secFetchSite && !['same-origin', 'same-site', 'none'].includes(secFetchSite)) {
    return false;
  }

  const originHeader = req.headers['origin'];
  const refererHeader = req.headers['referer'];
  const hostHeader = req.headers['x-forwarded-host'] || req.headers['host'];

  if (!originHeader && !refererHeader) {
    return true;
  }

  const originsToCheck = [];
  if (originHeader) {
    originsToCheck.push(originHeader.trim().toLowerCase());
  }
  if (refererHeader) {
    try {
      const parsedRef = new URL(refererHeader);
      originsToCheck.push(parsedRef.origin.toLowerCase());
    } catch {
      return false;
    }
  }

  const allowedOrigins = new Set([
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://ttcsirt.gov.tt',
    'https://www.ttcsirt.gov.tt'
  ]);

  if (process.env.APP_URL) {
    try {
      allowedOrigins.add(new URL(process.env.APP_URL).origin.toLowerCase());
    } catch {}
  }

  // Explicit configuration-driven trusted origins (comma-separated list)
  if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(',').forEach(orig => {
      const trimmed = orig.trim().toLowerCase();
      if (trimmed) allowedOrigins.add(trimmed);
    });
  }

  if (hostHeader) {
    const cleanHost = hostHeader.toLowerCase().trim();
    allowedOrigins.add(`http://${cleanHost}`);
    allowedOrigins.add(`https://${cleanHost}`);
  }

  // Derive preview counterpart if deployed on Google AI Studio Cloud Run
  if (process.env.APP_URL) {
    try {
      const parsedAppUrl = new URL(process.env.APP_URL);
      if (parsedAppUrl.hostname.startsWith('ais-dev-')) {
        allowedOrigins.add(`https://${parsedAppUrl.hostname.replace('ais-dev-', 'ais-pre-')}`);
      }
    } catch {}
  }

  const isOriginMatch = (orig) => {
    if (allowedOrigins.has(orig)) return true;
    try {
      const u = new URL(orig);
      if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
        return true;
      }
    } catch {
      return false;
    }
    return false;
  };

  for (const orig of originsToCheck) {
    if (!isOriginMatch(orig)) {
      return false;
    }
  }

  return true;
}

function logCsrfDiagnostics(stage, details) {
  const safeDetails = {
    stage,
    timestamp: new Date().toISOString(),
    cookiePresent: Boolean(details.cookiePresent),
    headerTokenPresent: Boolean(details.headerTokenPresent),
    bodyTokenPresent: Boolean(details.bodyTokenPresent),
    origin: details.origin || '(none)',
    secFetchSite: details.secFetchSite || '(none)',
    originAccepted: Boolean(details.originAccepted),
    tokenFormatValid: Boolean(details.tokenFormatValid),
    tokenExpired: Boolean(details.tokenExpired),
    signatureValid: Boolean(details.signatureValid),
    cookieMatch: details.cookieMatch !== undefined ? Boolean(details.cookieMatch) : 'n/a',
    sessionCorrelationId: details.sessionId ? details.sessionId.slice(0, 8) + '...' : '(none)',
    result: details.result
  };
  console.log('[CSRF Security Audit]', JSON.stringify(safeDetails));
}

function parseCookies(cookieHeader) {
  const list = {};
  if (!cookieHeader) return list;
  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const [name, ...rest] = pair.split('=');
    const trimmed = name?.trim();
    if (trimmed) {
      list[trimmed] = rest.join('=').trim();
    }
  }
  return list;
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return String(forwarded).split(',')[0].trim();
  }
  return req.socket?.remoteAddress || '127.0.0.1';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Strips carriage returns, newlines, and control characters to prevent email header injection
 */
function sanitizeHeader(val) {
  if (!val) return '';
  return String(val).replace(/[\r\n\x00-\x1F\x7F]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Generates an official, unique server-side incident reference: TT-CSIRT-IR-YYYY-XXXXXX
 */
function generateIncidentReference() {
  const year = new Date().getFullYear();
  const counterPart = String(Math.floor(100000 + crypto.randomInt(900000))).padStart(6, '0');
  return `TT-CSIRT-IR-${year}-${counterPart}`;
}

/**
 * Extracts observable technical indicators (IPs, Domains, URLs, Emails, Hashes) from narrative text
 */
function extractTechnicalIndicators(...textSources) {
  const combined = textSources.filter(Boolean).join('\n');
  const domains = new Set();
  const ips = new Set();
  const urls = new Set();
  const emails = new Set();
  const hashes = new Set();

  if (!combined) {
    return { domains: [], ips: [], urls: [], emails: [], hashes: [] };
  }

  // IPv4 addresses (including defanged like 1.2.3[.]4)
  const ipMatches = combined.match(/\b(?:\d{1,3}(?:\[\.\]|\.)){3}\d{1,3}\b/g) || [];
  for (const ip of ipMatches) {
    ips.add(ip);
  }

  // URLs (including hxxp)
  const urlMatches = combined.match(/\b(?:https?|hxxps?):\/\/[^\s<>"'\)]+/gi) || [];
  for (const u of urlMatches) {
    urls.add(u);
  }

  // Email addresses
  const emailMatches = combined.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g) || [];
  for (const em of emailMatches) {
    emails.add(em.toLowerCase());
  }

  // Hashes (MD5, SHA1, SHA256)
  const hashMatches = combined.match(/\b(?:[a-fA-F0-9]{64}|[a-fA-F0-9]{40}|[a-fA-F0-9]{32})\b/g) || [];
  for (const h of hashMatches) {
    hashes.add(h.toLowerCase());
  }

  // Domains (e.g. evil-domain.com, excluding numbers-only or common file extensions)
  const domainMatches = combined.match(/\b(?:[a-zA-Z0-9-]+\.)+(?:com|org|net|gov|edu|tt|io|co|biz|info|cc|xyz|ru|cn|top|online|me|app)\b/gi) || [];
  for (const d of domainMatches) {
    const lower = d.toLowerCase();
    if (!urls.has(d) && !emails.has(lower)) {
      domains.add(lower);
    }
  }

  return {
    domains: Array.from(domains).slice(0, 50),
    ips: Array.from(ips).slice(0, 50),
    urls: Array.from(urls).slice(0, 50),
    emails: Array.from(emails).slice(0, 50),
    hashes: Array.from(hashes).slice(0, 50),
  };
}

async function getRequestBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 256 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

let mailTransporter = null;

/**
 * Initializes or resolves the configured Node mail transport
 */
function getMailTransporter() {
  if (mailTransporter) return mailTransporter;

  const smtpHost = process.env.SMTP_HOST?.trim();
  if (smtpHost) {
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    const transportOptions = {
      host: smtpHost,
      port,
      secure,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      tls: {
        // Enforce TLS certificate verification - never disable for convenience
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2',
      },
    };

    if (process.env.SMTP_USER) {
      transportOptions.auth = {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD || '',
      };
    }

    mailTransporter = nodemailer.createTransport(transportOptions);
    return mailTransporter;
  }

  // Development/Test fallback transport:
  // Uses nodemailer's built-in jsonTransport to compile and validate MIME structure
  mailTransporter = nodemailer.createTransport({
    jsonTransport: true,
  });
  return mailTransporter;
}

/**
 * Builds conservative, highly compatible HTML email using Arial typography
 * Font stack strictly: Arial, Helvetica, sans-serif
 */
function generateHtmlEmail(incident, indicators, formattedDate) {
  const formatListHtml = (items) => {
    if (!items || items.length === 0) {
      return '<span style="color: #505a5f; font-style: italic;">None identified in submitted narrative</span>';
    }
    return `<ul style="margin: 4px 0 0 20px; padding: 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #0b0c0c;">
      ${items.map(item => `<li style="margin-bottom: 3px; word-break: break-word; overflow-wrap: break-word;">${escapeHtml(item)}</li>`).join('')}
    </ul>`;
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TT-CSIRT Incident Report — ${escapeHtml(incident.reference)}</title>
  <style type="text/css">
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      font-family: Arial, Helvetica, sans-serif !important;
    }
    body {
      margin: 0 !important;
      padding: 20px !important;
      background-color: #f3f2f1 !important;
      color: #0b0c0c !important;
      font-size: 15px !important;
      line-height: 1.5 !important;
    }
    table {
      border-collapse: collapse !important;
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
      width: 100% !important;
    }
    .wrapper {
      max-width: 640px !important;
      margin: 0 auto !important;
      background-color: #ffffff !important;
      border: 1px solid #b1b4b6 !important;
      border-top: 5px solid #005a30 !important;
    }
    .header {
      padding: 24px 28px 20px 28px !important;
      background-color: #ffffff !important;
      border-bottom: 2px solid #005a30 !important;
    }
    .content {
      padding: 24px 28px !important;
    }
    .ref-card {
      background-color: #eef5fb !important;
      border-left: 4px solid #1d70b8 !important;
      padding: 14px 18px !important;
      margin-bottom: 24px !important;
    }
    .section-title {
      font-size: 16px !important;
      font-weight: bold !important;
      color: #0b0c0c !important;
      text-transform: uppercase !important;
      letter-spacing: 0.5px !important;
      border-bottom: 1px solid #bfc1c3 !important;
      padding-bottom: 6px !important;
      margin-top: 24px !important;
      margin-bottom: 14px !important;
    }
    .field-label {
      width: 32% !important;
      padding: 6px 10px 6px 0 !important;
      vertical-align: top !important;
      font-size: 14px !important;
      font-weight: bold !important;
      color: #505a5f !important;
    }
    .field-value {
      padding: 6px 0 !important;
      vertical-align: top !important;
      font-size: 14px !important;
      color: #0b0c0c !important;
      word-break: break-word !important;
      overflow-wrap: break-word !important;
    }
    .text-block {
      background-color: #f8f8f8 !important;
      border: 1px solid #d8d8d8 !important;
      padding: 12px 14px !important;
      font-size: 14px !important;
      line-height: 1.6 !important;
      white-space: pre-wrap !important;
      word-break: break-word !important;
      overflow-wrap: break-word !important;
      color: #0b0c0c !important;
      margin: 4px 0 12px 0 !important;
    }
    .footer {
      background-color: #f3f2f1 !important;
      padding: 18px 28px !important;
      border-top: 1px solid #b1b4b6 !important;
      font-size: 12px !important;
      color: #505a5f !important;
      line-height: 1.4 !important;
    }
  </style>
</head>
<body style="margin: 0; padding: 20px; background-color: #f3f2f1; font-family: Arial, Helvetica, sans-serif; color: #0b0c0c; line-height: 1.5;">
  <center>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width: 640px; width: 100%; margin: 0 auto; background-color: #ffffff; border: 1px solid #b1b4b6; border-top: 5px solid #005a30;">
      <!-- Header -->
      <tr>
        <td style="padding: 24px 28px 18px 28px; background-color: #ffffff; border-bottom: 2px solid #005a30; font-family: Arial, Helvetica, sans-serif;">
          <div style="font-size: 12px; font-weight: bold; color: #005a30; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px;">National Cyber Security Incident Response Team (TT-CSIRT)</div>
          <h1 style="margin: 0; font-size: 22px; font-weight: bold; color: #0b0c0c; font-family: Arial, Helvetica, sans-serif;">TT-CSIRT INCIDENT REPORT</h1>
        </td>
      </tr>

      <!-- Main Content -->
      <tr>
        <td style="padding: 24px 28px; font-family: Arial, Helvetica, sans-serif;">
          <!-- Reference Card -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width: 100%; background-color: #eef5fb; border-left: 4px solid #1d70b8; margin-bottom: 24px;">
            <tr>
              <td style="padding: 14px 18px; font-family: Arial, Helvetica, sans-serif;">
                <div style="font-size: 13px; color: #1d70b8; font-weight: bold; text-transform: uppercase;">Official Report Reference</div>
                <div style="font-size: 20px; font-weight: bold; color: #0b0c0c; margin-top: 2px; letter-spacing: 0.5px;">${escapeHtml(incident.reference)}</div>
                <div style="font-size: 13px; color: #505a5f; margin-top: 6px;">Submitted: <strong>${escapeHtml(formattedDate)}</strong></div>
              </td>
            </tr>
          </table>

          <!-- 1. Reporter Information -->
          <div style="font-size: 15px; font-weight: bold; color: #0b0c0c; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #bfc1c3; padding-bottom: 4px; margin-top: 20px; margin-bottom: 12px; font-family: Arial, Helvetica, sans-serif;">1. Reporter Information</div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 16px;">
            <tr>
              <td style="width: 32%; padding: 5px 10px 5px 0; vertical-align: top; font-size: 14px; font-weight: bold; color: #505a5f; font-family: Arial, Helvetica, sans-serif;">Name:</td>
              <td style="padding: 5px 0; vertical-align: top; font-size: 14px; color: #0b0c0c; font-family: Arial, Helvetica, sans-serif;">${escapeHtml(incident.reporterName)}</td>
            </tr>
            <tr>
              <td style="width: 32%; padding: 5px 10px 5px 0; vertical-align: top; font-size: 14px; font-weight: bold; color: #505a5f; font-family: Arial, Helvetica, sans-serif;">Capacity:</td>
              <td style="padding: 5px 0; vertical-align: top; font-size: 14px; color: #0b0c0c; font-family: Arial, Helvetica, sans-serif;">${escapeHtml(incident.reporterType === 'organisation' ? 'Organization Representative' : 'Individual Citizen')}</td>
            </tr>
            ${incident.organisation ? `
            <tr>
              <td style="width: 32%; padding: 5px 10px 5px 0; vertical-align: top; font-size: 14px; font-weight: bold; color: #505a5f; font-family: Arial, Helvetica, sans-serif;">Organisation:</td>
              <td style="padding: 5px 0; vertical-align: top; font-size: 14px; color: #0b0c0c; font-family: Arial, Helvetica, sans-serif;">${escapeHtml(incident.organisation)}</td>
            </tr>
            ` : ''}
            ${incident.sector ? `
            <tr>
              <td style="width: 32%; padding: 5px 10px 5px 0; vertical-align: top; font-size: 14px; font-weight: bold; color: #505a5f; font-family: Arial, Helvetica, sans-serif;">Sector:</td>
              <td style="padding: 5px 0; vertical-align: top; font-size: 14px; color: #0b0c0c; font-family: Arial, Helvetica, sans-serif;">${escapeHtml(incident.sector)}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="width: 32%; padding: 5px 10px 5px 0; vertical-align: top; font-size: 14px; font-weight: bold; color: #505a5f; font-family: Arial, Helvetica, sans-serif;">Email Address:</td>
              <td style="padding: 5px 0; vertical-align: top; font-size: 14px; color: #0b0c0c; font-family: Arial, Helvetica, sans-serif;">
                <a href="mailto:${escapeHtml(incident.email)}" style="color: #1d70b8; text-decoration: underline; word-break: break-word;">${escapeHtml(incident.email)}</a>
              </td>
            </tr>
            <tr>
              <td style="width: 32%; padding: 5px 10px 5px 0; vertical-align: top; font-size: 14px; font-weight: bold; color: #505a5f; font-family: Arial, Helvetica, sans-serif;">Telephone Number:</td>
              <td style="padding: 5px 0; vertical-align: top; font-size: 14px; color: #0b0c0c; font-family: Arial, Helvetica, sans-serif;">
                <a href="tel:${escapeHtml(incident.phone)}" style="color: #1d70b8; text-decoration: underline;">${escapeHtml(incident.phone)}</a>
              </td>
            </tr>
          </table>

          <!-- 2. Incident Information -->
          <div style="font-size: 15px; font-weight: bold; color: #0b0c0c; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #bfc1c3; padding-bottom: 4px; margin-top: 24px; margin-bottom: 12px; font-family: Arial, Helvetica, sans-serif;">2. Incident Information</div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 16px;">
            <tr>
              <td style="width: 32%; padding: 5px 10px 5px 0; vertical-align: top; font-size: 14px; font-weight: bold; color: #505a5f; font-family: Arial, Helvetica, sans-serif;">Incident Type:</td>
              <td style="padding: 5px 0; vertical-align: top; font-size: 14px; font-weight: bold; color: #0b0c0c; font-family: Arial, Helvetica, sans-serif;">${escapeHtml(incident.incidentType)}</td>
            </tr>
            <tr>
              <td style="width: 32%; padding: 5px 10px 5px 0; vertical-align: top; font-size: 14px; font-weight: bold; color: #505a5f; font-family: Arial, Helvetica, sans-serif;">Date/Time Observed:</td>
              <td style="padding: 5px 0; vertical-align: top; font-size: 14px; color: #0b0c0c; font-family: Arial, Helvetica, sans-serif;">${escapeHtml(incident.incidentTiming)}</td>
            </tr>
            <tr>
              <td style="width: 32%; padding: 5px 10px 5px 0; vertical-align: top; font-size: 14px; font-weight: bold; color: #505a5f; font-family: Arial, Helvetica, sans-serif;">Affected Organisation:</td>
              <td style="padding: 5px 0; vertical-align: top; font-size: 14px; color: #0b0c0c; font-family: Arial, Helvetica, sans-serif;">${escapeHtml(incident.organisation || 'Individual citizen report')}</td>
            </tr>
          </table>

          <div style="font-size: 14px; font-weight: bold; color: #505a5f; margin-top: 10px; margin-bottom: 4px; font-family: Arial, Helvetica, sans-serif;">Incident Description:</div>
          <div style="background-color: #f8f8f8; border: 1px solid #d8d8d8; padding: 12px 14px; font-size: 14px; line-height: 1.6; white-space: pre-wrap; word-break: break-word; overflow-wrap: break-word; color: #0b0c0c; font-family: Arial, Helvetica, sans-serif;">${escapeHtml(incident.incidentDetails)}</div>

          <div style="font-size: 14px; font-weight: bold; color: #505a5f; margin-top: 12px; margin-bottom: 4px; font-family: Arial, Helvetica, sans-serif;">Actions Already Taken:</div>
          <div style="background-color: #f8f8f8; border: 1px solid #d8d8d8; padding: 12px 14px; font-size: 14px; line-height: 1.6; white-space: pre-wrap; word-break: break-word; overflow-wrap: break-word; color: #0b0c0c; font-family: Arial, Helvetica, sans-serif;">${escapeHtml(incident.actionsTaken || 'None noted in initial report submission.')}</div>

          <!-- 3. Technical Information -->
          <div style="font-size: 15px; font-weight: bold; color: #0b0c0c; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #bfc1c3; padding-bottom: 4px; margin-top: 24px; margin-bottom: 12px; font-family: Arial, Helvetica, sans-serif;">3. Technical Information</div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 16px;">
            <tr>
              <td style="width: 32%; padding: 5px 10px 5px 0; vertical-align: top; font-size: 14px; font-weight: bold; color: #505a5f; font-family: Arial, Helvetica, sans-serif;">Affected Systems:</td>
              <td style="padding: 5px 0; vertical-align: top; font-size: 14px; color: #0b0c0c; font-family: Arial, Helvetica, sans-serif;">
                <div style="background-color: #f8f8f8; border: 1px solid #d8d8d8; padding: 10px 12px; white-space: pre-wrap; word-break: break-word; font-family: Arial, Helvetica, sans-serif;">${escapeHtml(incident.affectedSystems)}</div>
              </td>
            </tr>
            <tr>
              <td style="width: 32%; padding: 5px 10px 5px 0; vertical-align: top; font-size: 14px; font-weight: bold; color: #505a5f; font-family: Arial, Helvetica, sans-serif;">Operational Impact:</td>
              <td style="padding: 5px 0; vertical-align: top; font-size: 14px; color: #0b0c0c; font-family: Arial, Helvetica, sans-serif;">
                <div style="background-color: #f8f8f8; border: 1px solid #d8d8d8; padding: 10px 12px; white-space: pre-wrap; word-break: break-word; font-family: Arial, Helvetica, sans-serif;">${escapeHtml(incident.impact)}</div>
              </td>
            </tr>
            <tr>
              <td style="width: 32%; padding: 5px 10px 5px 0; vertical-align: top; font-size: 14px; font-weight: bold; color: #505a5f; font-family: Arial, Helvetica, sans-serif;">Domains:</td>
              <td style="padding: 5px 0; vertical-align: top; font-size: 14px; color: #0b0c0c; font-family: Arial, Helvetica, sans-serif;">${formatListHtml(indicators.domains)}</td>
            </tr>
            <tr>
              <td style="width: 32%; padding: 5px 10px 5px 0; vertical-align: top; font-size: 14px; font-weight: bold; color: #505a5f; font-family: Arial, Helvetica, sans-serif;">IP Addresses:</td>
              <td style="padding: 5px 0; vertical-align: top; font-size: 14px; color: #0b0c0c; font-family: Arial, Helvetica, sans-serif;">${formatListHtml(indicators.ips)}</td>
            </tr>
            <tr>
              <td style="width: 32%; padding: 5px 10px 5px 0; vertical-align: top; font-size: 14px; font-weight: bold; color: #505a5f; font-family: Arial, Helvetica, sans-serif;">URLs:</td>
              <td style="padding: 5px 0; vertical-align: top; font-size: 14px; color: #0b0c0c; font-family: Arial, Helvetica, sans-serif;">${formatListHtml(indicators.urls)}</td>
            </tr>
            <tr>
              <td style="width: 32%; padding: 5px 10px 5px 0; vertical-align: top; font-size: 14px; font-weight: bold; color: #505a5f; font-family: Arial, Helvetica, sans-serif;">Email Indicators:</td>
              <td style="padding: 5px 0; vertical-align: top; font-size: 14px; color: #0b0c0c; font-family: Arial, Helvetica, sans-serif;">${formatListHtml(indicators.emails)}</td>
            </tr>
            ${indicators.hashes.length > 0 ? `
            <tr>
              <td style="width: 32%; padding: 5px 10px 5px 0; vertical-align: top; font-size: 14px; font-weight: bold; color: #505a5f; font-family: Arial, Helvetica, sans-serif;">Hashes:</td>
              <td style="padding: 5px 0; vertical-align: top; font-size: 14px; color: #0b0c0c; font-family: Arial, Helvetica, sans-serif;">${formatListHtml(indicators.hashes)}</td>
            </tr>
            ` : ''}
          </table>

          <!-- 4. Additional Information & Evidence -->
          <div style="font-size: 15px; font-weight: bold; color: #0b0c0c; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #bfc1c3; padding-bottom: 4px; margin-top: 24px; margin-bottom: 12px; font-family: Arial, Helvetica, sans-serif;">4. Additional Information &amp; Evidence</div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 16px;">
            <tr>
              <td style="width: 32%; padding: 5px 10px 5px 0; vertical-align: top; font-size: 14px; font-weight: bold; color: #505a5f; font-family: Arial, Helvetica, sans-serif;">Evidence Available:</td>
              <td style="padding: 5px 0; vertical-align: top; font-size: 14px; font-weight: bold; color: ${incident.evidenceAvailable === 'yes' ? '#005a30' : '#505a5f'}; font-family: Arial, Helvetica, sans-serif;">
                ${incident.evidenceAvailable === 'yes' ? 'YES (Digital artifacts preserved)' : 'NO (No digital artifacts currently held)'}
              </td>
            </tr>
            ${incident.evidenceAvailable === 'yes' ? `
            <tr>
              <td style="width: 32%; padding: 5px 10px 5px 0; vertical-align: top; font-size: 14px; font-weight: bold; color: #505a5f; font-family: Arial, Helvetica, sans-serif;">Evidence Notes:</td>
              <td style="padding: 5px 0; vertical-align: top; font-size: 14px; color: #0b0c0c; font-family: Arial, Helvetica, sans-serif;">
                <div style="background-color: #f8f8f8; border: 1px solid #d8d8d8; padding: 10px 12px; white-space: pre-wrap; word-break: break-word; font-family: Arial, Helvetica, sans-serif;">${escapeHtml(incident.evidenceNotes || 'None specified')}</div>
              </td>
            </tr>
            ` : ''}
            ${incident.additionalComments ? `
            <tr>
              <td style="width: 32%; padding: 5px 10px 5px 0; vertical-align: top; font-size: 14px; font-weight: bold; color: #505a5f; font-family: Arial, Helvetica, sans-serif;">Reporter Comments:</td>
              <td style="padding: 5px 0; vertical-align: top; font-size: 14px; color: #0b0c0c; font-family: Arial, Helvetica, sans-serif;">
                <div style="background-color: #f8f8f8; border: 1px solid #d8d8d8; padding: 10px 12px; white-space: pre-wrap; word-break: break-word; font-family: Arial, Helvetica, sans-serif;">${escapeHtml(incident.additionalComments)}</div>
              </td>
            </tr>
            ` : ''}
          </table>

          <!-- 5. Submission Metadata -->
          <div style="font-size: 15px; font-weight: bold; color: #0b0c0c; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #bfc1c3; padding-bottom: 4px; margin-top: 24px; margin-bottom: 12px; font-family: Arial, Helvetica, sans-serif;">5. Submission Metadata</div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 8px;">
            <tr>
              <td style="width: 32%; padding: 4px 10px 4px 0; vertical-align: top; font-size: 12px; color: #505a5f; font-family: Arial, Helvetica, sans-serif;">Reference:</td>
              <td style="padding: 4px 0; vertical-align: top; font-size: 12px; color: #0b0c0c; font-family: Arial, Helvetica, sans-serif;">${escapeHtml(incident.reference)}</td>
            </tr>
            <tr>
              <td style="width: 32%; padding: 4px 10px 4px 0; vertical-align: top; font-size: 12px; color: #505a5f; font-family: Arial, Helvetica, sans-serif;">Server Timestamp:</td>
              <td style="padding: 4px 0; vertical-align: top; font-size: 12px; color: #0b0c0c; font-family: Arial, Helvetica, sans-serif;">${escapeHtml(incident.submittedAt || new Date().toISOString())}</td>
            </tr>
            <tr>
              <td style="width: 32%; padding: 4px 10px 4px 0; vertical-align: top; font-size: 12px; color: #505a5f; font-family: Arial, Helvetica, sans-serif;">Origin IP Address:</td>
              <td style="padding: 4px 0; vertical-align: top; font-size: 12px; color: #0b0c0c; font-family: Arial, Helvetica, sans-serif;">${escapeHtml(incident.clientIp || 'Unknown')}</td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background-color: #f3f2f1; padding: 18px 28px; border-top: 1px solid #b1b4b6; font-size: 12px; color: #505a5f; line-height: 1.4; font-family: Arial, Helvetica, sans-serif;">
          <div style="font-weight: bold; color: #0b0c0c; margin-bottom: 2px;">Trinidad and Tobago Cyber Security Incident Response Team (TT-CSIRT)</div>
          <div>Ministry of Homeland Security, Republic of Trinidad and Tobago</div>
          <div style="margin-top: 6px; font-size: 11px; color: #6f777b;">This is an official cyber security operational record generated automatically by the national public incident reporting service. Confidential — for authorized TT-CSIRT personnel only.</div>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>`;
}

/**
 * Builds conservative, complete plain-text email with identical substantive data
 */
function generatePlainTextEmail(incident, indicators, formattedDate) {
  const formatListText = (items) => {
    if (!items || items.length === 0) return 'None identified in submitted narrative';
    return items.map(item => `  - ${item}`).join('\n');
  };

  return `
TT-CSIRT INCIDENT REPORT

Reference:           ${incident.reference}
Submitted:           ${formattedDate}

================================================================================
1. REPORTER INFORMATION
================================================================================
Name:                ${incident.reporterName}
Capacity:            ${incident.reporterType === 'organisation' ? 'Organization Representative' : 'Individual Citizen'}
Organisation:        ${incident.organisation || 'N/A'}
Sector:              ${incident.sector || 'N/A'}
Email:               ${incident.email}
Telephone:           ${incident.phone}

================================================================================
2. INCIDENT INFORMATION
================================================================================
Incident Type:       ${incident.incidentType}
Date/Time Observed:  ${incident.incidentTiming}
Affected Entity:     ${incident.organisation || 'Individual citizen report'}

Incident Description:
${incident.incidentDetails}

Actions Already Taken:
${incident.actionsTaken || 'None noted in initial report submission.'}

================================================================================
3. TECHNICAL INFORMATION
================================================================================
Affected Systems:
${incident.affectedSystems}

Operational Impact:
${incident.impact}

Domains:
${formatListText(indicators.domains)}

IP Addresses:
${formatListText(indicators.ips)}

URLs:
${formatListText(indicators.urls)}

Email Indicators:
${formatListText(indicators.emails)}

Hashes:
${formatListText(indicators.hashes)}

================================================================================
4. ADDITIONAL INFORMATION & EVIDENCE
================================================================================
Evidence Available:  ${incident.evidenceAvailable === 'yes' ? 'YES (Digital artifacts preserved)' : 'NO'}
Evidence Notes:
${incident.evidenceNotes || 'None specified'}

Additional Comments:
${incident.additionalComments || 'None'}

================================================================================
5. SUBMISSION METADATA
================================================================================
Incident Reference:  ${incident.reference}
Server Timestamp:    ${incident.submittedAt || new Date().toISOString()}
Origin IP Address:   ${incident.clientIp || 'Unknown'}

--------------------------------------------------------------------------------
National Cyber Security Incident Response Team (TT-CSIRT)
Ministry of Homeland Security, Republic of Trinidad and Tobago
--------------------------------------------------------------------------------
`.trim();
}

/**
 * Dispatches the operational incident notification email through configured mail transport
 */
async function dispatchIncidentEmail(incident) {
  if (simulateMailFailure) {
    throw new Error('Simulated mail transport failure for testing');
  }

  // Development/Test default is yoshua.alexander@ttcsirt.gov.tt
  // In production, setting INCIDENT_REPORT_RECIPIENT=contacts@ttcsirt.gov.tt redirects delivery
  const recipient = sanitizeHeader(process.env.INCIDENT_REPORT_RECIPIENT || 'yoshua.alexander@ttcsirt.gov.tt');
  const from = sanitizeHeader(process.env.INCIDENT_REPORT_FROM || 'TT-CSIRT Incident Intake <no-reply@ttcsirt.gov.tt>');
  const cleanReference = sanitizeHeader(incident.reference);
  const cleanIncidentType = sanitizeHeader(incident.incidentType);

  // Predictable subject with en-dash / em-dash, clean of any CRLF header injection
  const subject = `TT-CSIRT Incident Report — ${cleanReference} — ${cleanIncidentType}`;

  // Extract technical indicators from all submitted narrative blocks
  const indicators = extractTechnicalIndicators(
    incident.incidentDetails,
    incident.affectedSystems,
    incident.evidenceNotes,
    incident.impact
  );

  const formattedDate = new Date().toUTCString();
  const htmlBody = generateHtmlEmail(incident, indicators, formattedDate);
  const textBody = generatePlainTextEmail(incident, indicators, formattedDate);

  // If Resend API key is present and no SMTP host, support direct Resend dispatch
  if (process.env.RESEND_API_KEY && !process.env.SMTP_HOST) {
    const resendPayload = {
      from,
      to: [recipient],
      reply_to: sanitizeHeader(incident.email),
      subject,
      text: textBody,
      html: htmlBody,
    };

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resendPayload),
    });

    if (!res.ok) {
      throw new Error(`Resend API dispatch failed with HTTP status ${res.status}`);
    }

    testLastSentMail = {
      transport: 'resend',
      recipient,
      from,
      replyTo: sanitizeHeader(incident.email),
      subject,
      text: textBody,
      html: htmlBody,
      dispatchedAt: new Date().toISOString(),
    };
  } else {
    // Primary delivery: Nodemailer transport
    const transporter = getMailTransporter();
    const mailOptions = {
      from,
      to: recipient,
      replyTo: sanitizeHeader(incident.email),
      subject,
      text: textBody,
      html: htmlBody,
      encoding: 'utf-8',
      headers: {
        'X-Priority': '1',
        'X-TTCSIRT-Reference': cleanReference,
        'X-TTCSIRT-Incident-Type': cleanIncidentType,
      },
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      testLastSentMail = {
        transport: process.env.SMTP_HOST ? 'smtp' : 'jsonTransport',
        messageId: info.messageId,
        envelope: info.envelope,
        accepted: info.accepted,
        rejected: info.rejected,
        response: info.response,
        recipient,
        from,
        replyTo: sanitizeHeader(incident.email),
        subject,
        text: textBody,
        html: htmlBody,
        dispatchedAt: new Date().toISOString(),
      };
      console.log(`[TT-CSIRT Intake] Successfully dispatched incident email for ${incident.reference} to ${recipient}`);
      testLastIncident = { ...incident, receivedAt: new Date().toISOString() };
      return testLastSentMail;
    } catch (sendErr) {
      console.error(`[TT-CSIRT Intake] Dispatch failure for ${incident.reference}:`, sendErr.message);
      throw sendErr;
    }
  }
}

/**
 * Incident Reporting Intake Middleware - compatible with both Express and Vite dev server
 */
export async function incidentReportingMiddleware(req, res, next) {
  const url = req.originalUrl || req.url;
  const path = url.split('?')[0];

  if (!path.startsWith('/api/incident-report')) {
    return next();
  }

  // Set standard security headers for intake endpoints
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 1. GET /api/incident-report/csrf
  if (path === '/api/incident-report/csrf' && req.method === 'GET') {
    const clientIp = getClientIp(req);
    const now = Date.now();
    const times = csrfRateLimits.get(clientIp) || [];
    const validTimes = times.filter(t => now - t < 10 * 60 * 1000);
    if (validTimes.length >= 60) {
      return sendJson(res, 429, {
        error: "Too many requests. Please wait a moment and try again."
      });
    }
    validTimes.push(now);
    csrfRateLimits.set(clientIp, validTimes);

    // Check if client already has a valid, unexpired cookie token
    const cookies = parseCookies(req.headers.cookie);
    const existingCookieToken = cookies['ttcsirt_csrf'];
    let token, sessionId, expiry;

    if (existingCookieToken) {
      const existingVerification = verifyCsrfToken(existingCookieToken);
      // If valid and more than 15 minutes left before expiry, reuse it
      if (existingVerification.valid && (existingVerification.expiry - now > 15 * 60 * 1000)) {
        token = existingCookieToken;
        sessionId = existingVerification.sessionId;
        expiry = existingVerification.expiry;
      }
    }

    if (!token) {
      const generated = generateCsrfToken();
      token = generated.token;
      sessionId = generated.sessionId;
      expiry = generated.expiry;
    }

    const isSecure = Boolean(
      req.secure ||
      req.headers['x-forwarded-proto'] === 'https' ||
      (process.env.APP_URL && process.env.APP_URL.startsWith('https://')) ||
      process.env.NODE_ENV === 'production'
    );

    res.setHeader(
      'Set-Cookie',
      `ttcsirt_csrf=${token}; Path=/; HttpOnly; SameSite=Strict${isSecure ? '; Secure' : ''}`
    );
    res.setHeader('X-CSRF-Token', token);
    return sendJson(res, 200, { csrfToken: token, sessionId, expiry });
  }

  // 2. POST /api/incident-report
  if (path === '/api/incident-report' && req.method === 'POST') {
    // Concurrency limit
    if (activeSubmissions >= MAX_CONCURRENT_SUBMISSIONS) {
      return sendJson(res, 429, {
        error: "Too many submissions are being processed right now. Please wait a moment and try again."
      });
    }

    // IP rate limit
    const clientIp = getClientIp(req);
    const now = Date.now();
    const subTimes = incidentRateLimits.get(clientIp) || [];
    const validSubTimes = subTimes.filter(t => now - t < 15 * 60 * 1000);
    if (validSubTimes.length >= 6) {
      return sendJson(res, 429, {
        error: "Too many submissions are being processed right now. Please wait a moment and try again."
      });
    }

    // Origin and Sec-Fetch-Site verification
    const originOk = isOriginAllowed(req);
    if (!originOk) {
      logCsrfDiagnostics('origin_check', {
        origin: req.headers['origin'],
        referer: req.headers['referer'],
        secFetchSite: req.headers['sec-fetch-site'],
        originAccepted: false,
        result: 'rejected_origin'
      });
      return sendJson(res, 403, { error: "Cross-site submission rejected." });
    }

    // Parse body first so token can also be extracted from body._csrf if header is stripped
    let body;
    try {
      body = await getRequestBody(req);
    } catch (err) {
      return sendJson(res, 400, { error: "Invalid request payload." });
    }

    // Extract CSRF token from header, body, or cookie
    const cookies = parseCookies(req.headers.cookie);
    const cookieToken = cookies['ttcsirt_csrf'];
    const headerToken = req.headers['x-csrf-token'];
    const bodyToken = body && typeof body._csrf === 'string' ? body._csrf : null;

    const submittedToken = headerToken || bodyToken;

    // Cryptographically verify token
    const verification = verifyCsrfToken(submittedToken);

    // If a cookie is present, ensure it matches the submitted token or session
    let cookieMatch = true;
    if (cookieToken) {
      const cleanCookie = String(cookieToken).trim();
      const cleanSubmitted = String(submittedToken || '').trim();
      if (cleanCookie !== cleanSubmitted) {
        const cookieVerification = verifyCsrfToken(cleanCookie);
        if (!cookieVerification.valid || cookieVerification.sessionId !== verification.sessionId) {
          cookieMatch = false;
        }
      }
    }

    const isSessionValid = verification.valid && cookieMatch;

    logCsrfDiagnostics('submission_verification', {
      cookiePresent: Boolean(cookieToken),
      headerTokenPresent: Boolean(headerToken),
      bodyTokenPresent: Boolean(bodyToken),
      origin: req.headers['origin'],
      secFetchSite: req.headers['sec-fetch-site'],
      originAccepted: true,
      tokenFormatValid: verification.reason !== 'malformed_structure' && verification.reason !== 'invalid_components',
      tokenExpired: verification.reason === 'expired',
      signatureValid: verification.valid,
      cookieMatch: cookieToken ? cookieMatch : 'n/a',
      sessionId: verification.sessionId,
      result: isSessionValid ? 'authorized' : 'rejected'
    });

    if (!isSessionValid) {
      return sendJson(res, 403, {
        error: "Your session security token could not be verified. Please refresh the page and try again."
      });
    }

    // Honeypot check: If the hidden 'website' trap is filled, silently discard without dispatching email
    if (body && body.website && String(body.website).trim().length > 0) {
      const fakeRef = generateIncidentReference();
      return sendJson(res, 200, {
        success: true,
        reference: fakeRef,
        message: "Incident report submitted successfully."
      });
    }

    // Unknown field validation: prevent unauthorized parameter pollution
    for (const key of Object.keys(body)) {
      if (!ALLOWED_BODY_FIELDS.has(key)) {
        return sendJson(res, 400, {
          error: "Invalid submission payload: unrecognized field detected."
        });
      }
    }

    const incidentType = typeof body.incidentType === 'string' ? body.incidentType.trim() : '';
    const incidentTiming = typeof body.incidentTiming === 'string' ? body.incidentTiming.trim() : '';
    const incidentDetails = typeof body.incidentDetails === 'string' ? body.incidentDetails.trim() : '';
    const affectedSystems = typeof body.affectedSystems === 'string' ? body.affectedSystems.trim() : '';
    const impact = typeof body.impact === 'string' ? body.impact.trim() : '';
    const evidenceAvailable = body.evidenceAvailable === 'yes' ? 'yes' : 'no';
    const evidenceNotes = typeof body.evidenceNotes === 'string' ? body.evidenceNotes.trim() : '';
    const reporterType = body.reporterType === 'individual' ? 'individual' : 'organisation';
    const organisation = typeof body.organisation === 'string' ? body.organisation.trim() : '';
    const sector = typeof body.sector === 'string' ? body.sector.trim() : '';
    const reporterName = typeof body.reporterName === 'string' ? body.reporterName.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const actionsTaken = typeof body.actionsTaken === 'string' ? body.actionsTaken.trim() : '';
    const additionalComments = typeof body.additionalComments === 'string' ? body.additionalComments.trim() : '';

    // CRLF header injection rejection
    if (
      /[\r\n]/.test(email) ||
      /[\r\n]/.test(reporterName) ||
      /[\r\n]/.test(phone) ||
      /[\r\n]/.test(organisation) ||
      /[\r\n]/.test(incidentType) ||
      /[\r\n]/.test(incidentTiming)
    ) {
      return sendJson(res, 400, { error: "Malformed characters detected in submission fields." });
    }

    // Allowlist & content validation
    if (!incidentType || !VALID_INCIDENT_TYPES.has(incidentType)) {
      return sendJson(res, 400, { error: "Please select a valid incident type." });
    }
    if (!incidentTiming || incidentTiming.length > 250) {
      return sendJson(res, 400, { error: "Please provide valid timing information (up to 250 characters)." });
    }
    if (!incidentDetails || incidentDetails.length > 5000) {
      return sendJson(res, 400, { error: "Incident description is required and must be 5,000 characters or fewer." });
    }
    if (!affectedSystems || affectedSystems.length > 2000) {
      return sendJson(res, 400, { error: "Affected systems information is required and must be 2,000 characters or fewer." });
    }
    if (!impact || impact.length > 3000) {
      return sendJson(res, 400, { error: "Impact information is required and must be 3,000 characters or fewer." });
    }
    if (evidenceAvailable === 'yes' && evidenceNotes.length > 3000) {
      return sendJson(res, 400, { error: "Evidence notes must be 3,000 characters or fewer." });
    }
    if (reporterType === 'organisation') {
      if (!organisation || organisation.length > 200) {
        return sendJson(res, 400, { error: "Organization name is required for organization reports." });
      }
      if (!sector || !VALID_SECTORS.has(sector)) {
        return sendJson(res, 400, { error: "Please select a valid sector." });
      }
    }
    if (!reporterName || reporterName.length < 2 || reporterName.length > 150) {
      return sendJson(res, 400, { error: "Full name must be between 2 and 150 characters." });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email) || email.length > 254) {
      return sendJson(res, 400, { error: "Please provide a valid email address." });
    }
    const phoneRegex = /^[\d\s+().-]{7,35}$/;
    const phoneDigits = phone.replace(/\D/g, '');
    if (!phone || !phoneRegex.test(phone) || phoneDigits.length < 7) {
      return sendJson(res, 400, { error: "Please provide a valid contact telephone number." });
    }

    // Idempotency: prevent double submission from rapid mobile taps or retries
    const payloadFingerprint = JSON.stringify({
      incidentType, incidentTiming, incidentDetails, affectedSystems, impact,
      evidenceAvailable, evidenceNotes, reporterType, organisation, sector,
      reporterName, email: email.toLowerCase(), phone, actionsTaken, additionalComments
    });
    const payloadHash = crypto.createHash('sha256').update(payloadFingerprint).digest('hex');
    const customIdempotencyKey = typeof body.idempotencyKey === 'string' && body.idempotencyKey.length <= 128 ? body.idempotencyKey : null;

    const existing = idempotencyStore.get(payloadHash) || (customIdempotencyKey && idempotencyStore.get(customIdempotencyKey));
    if (existing) {
      return sendJson(res, 200, {
        success: true,
        reference: existing.reference,
        idempotentReplay: true,
        message: "Incident report already received."
      });
    }

    validSubTimes.push(now);
    incidentRateLimits.set(clientIp, validSubTimes);

    const reference = generateIncidentReference();
    activeSubmissions++;

    try {
      const reportRecord = {
        reference,
        incidentType,
        incidentTiming,
        incidentDetails,
        affectedSystems,
        impact,
        evidenceAvailable,
        evidenceNotes,
        reporterType,
        organisation,
        sector,
        reporterName,
        email,
        phone,
        actionsTaken,
        additionalComments,
        clientIp,
        submittedAt: new Date().toISOString()
      };

      await dispatchIncidentEmail(reportRecord);

      idempotencyStore.set(payloadHash, { reference, createdAt: now });
      if (customIdempotencyKey) {
        idempotencyStore.set(customIdempotencyKey, { reference, createdAt: now });
      }

      return sendJson(res, 200, {
        success: true,
        reference,
        message: "Incident report submitted successfully."
      });
    } catch (err) {
      console.error(`[TT-CSIRT Intake] Dispatch failure for ${reference}:`, err.message);
      return sendJson(res, 500, {
        error: "We are currently unable to process your report due to a temporary delivery issue. Please contact the TT-CSIRT 24/7 hotline directly or try again shortly."
      });
    } finally {
      activeSubmissions--;
    }
  }

  // 3. Test & Verification Endpoints (for automated verification & diagnostics)
  if (path === '/api/incident-report/test-clear' && req.method === 'POST') {
    incidentRateLimits.clear();
    csrfRateLimits.clear();
    idempotencyStore.clear();
    testLastIncident = null;
    testLastSentMail = null;
    simulateMailFailure = false;
    return sendJson(res, 200, { success: true });
  }

  if (path === '/api/incident-report/test-last' && req.method === 'GET') {
    return sendJson(res, 200, {
      lastIncident: testLastIncident,
      lastMail: testLastSentMail
    });
  }

  if (path === '/api/incident-report/test-simulate-failure' && req.method === 'POST') {
    try {
      const body = await getRequestBody(req);
      simulateMailFailure = body.fail !== false;
      return sendJson(res, 200, { simulateMailFailure });
    } catch {
      simulateMailFailure = true;
      return sendJson(res, 200, { simulateMailFailure: true });
    }
  }

  // Pass through if not handled
  if (typeof next === 'function') {
    next();
  }
}

export {
  generateIncidentReference,
  extractTechnicalIndicators,
  generateHtmlEmail,
  generatePlainTextEmail,
  getMailTransporter,
  dispatchIncidentEmail,
  generateCsrfToken,
  verifyCsrfToken,
  isOriginAllowed,
  sanitizeHeader,
  escapeHtml
};
