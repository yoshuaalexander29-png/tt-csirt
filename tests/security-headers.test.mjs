import test from 'node:test';
import assert from 'node:assert/strict';
import { securityHeaders, CONTENT_SECURITY_POLICY } from '../server/securityHeaders.js';

function run(req = {}, options) {
  const headers = {};
  const res = { setHeader: (k, v) => { headers[k] = v; } };
  let called = false;
  securityHeaders(options)({ headers: {}, ...req }, res, () => { called = true; });
  return { headers, called };
}

test('sets an enforcing CSP that locks down scripts, plug-ins, framing and base tags', () => {
  const { headers, called } = run();
  assert.equal(called, true);
  const csp = headers['Content-Security-Policy'];
  assert.equal(csp, CONTENT_SECURITY_POLICY);
  for (const part of ["script-src 'self'", "object-src 'none'", "frame-ancestors 'none'", "base-uri 'self'", "script-src-attr 'none'"]) {
    assert.ok(csp.includes(part), `missing ${part}`);
  }
  assert.ok(!/script-src[^;]*'unsafe-inline'/.test(csp), 'scripts must never allow unsafe-inline');
  assert.ok(!/script-src[^;]*'unsafe-eval'/.test(csp), 'scripts must never allow unsafe-eval');
});

test('report-only mode swaps the header name and nothing else', () => {
  const { headers } = run({}, { reportOnly: true });
  assert.ok(headers['Content-Security-Policy-Report-Only']);
  assert.equal(headers['Content-Security-Policy'], undefined);
});

test('HSTS is only sent for HTTPS requests', () => {
  assert.equal(run().headers['Strict-Transport-Security'], undefined);
  assert.match(run({ headers: { 'x-forwarded-proto': 'https' } }).headers['Strict-Transport-Security'], /max-age=31536000/);
  assert.match(run({ secure: true }).headers['Strict-Transport-Security'], /includeSubDomains/);
});

test('clickjacking and sniffing protections are always on', () => {
  const { headers } = run();
  assert.equal(headers['X-Frame-Options'], 'DENY');
  assert.equal(headers['X-Content-Type-Options'], 'nosniff');
});
