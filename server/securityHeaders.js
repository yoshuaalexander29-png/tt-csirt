/**
 * Security response headers for the TT-CSIRT portal.
 *
 * The Content-Security-Policy below mirrors the defaults documented by the
 * Helmet project (helmetjs/helmet) and MDN's CSP guide, tightened for this
 * site: scripts may only come from our own origin, plug-ins are off, the page
 * cannot be framed, and forms can only post back to us. Written by hand so the
 * server needs no extra dependency.
 *
 * Rollout switch: set TTCSIRT_CSP_REPORT_ONLY=1 to log violations in the
 * browser console without blocking anything, then remove it to enforce.
 */

export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "connect-src 'self'",
  "font-src 'self' data:",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // Advisory bodies reference images hosted on the legacy site and newsletter CDN.
  "img-src 'self' data: https://ttcsirt.gov.tt https://*.mcusercontent.com",
  "manifest-src 'self'",
  "media-src 'self'",
  "object-src 'none'",
  "script-src 'self'",
  "script-src-attr 'none'",
  // React and the GC Design System components set inline style attributes.
  "style-src 'self' 'unsafe-inline'",
  "worker-src 'self'",
  "upgrade-insecure-requests",
].join('; ');

export function isHttps(req) {
  return Boolean(req.secure) || String(req.headers?.['x-forwarded-proto'] || '').split(',')[0].trim() === 'https';
}

export function securityHeaders(options = {}) {
  const reportOnly = options.reportOnly ?? process.env.TTCSIRT_CSP_REPORT_ONLY === '1';
  const cspHeader = reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';

  return function securityHeadersMiddleware(req, res, next) {
    res.setHeader(cspHeader, CONTENT_SECURITY_POLICY);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    // Only tell browsers to insist on HTTPS when this request actually arrived over it.
    if (isHttps(req)) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  };
}
