import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeAllMarkup } from '../src/services/safeHtmlFallback.ts';

test('fallback strips script blocks and tags, then escapes what is left', () => {
  const out = escapeAllMarkup('<p>Hi</p><script>alert(1)</script><img src=x onerror=alert(2)>');
  assert.equal(out, 'Hi');
});

test('fallback escapes stray angle brackets and quotes', () => {
  assert.equal(escapeAllMarkup('a < b & "c"'), 'a &lt; b &amp; &quot;c&quot;');
});

test('fallback handles empty input', () => {
  assert.equal(escapeAllMarkup(''), '');
});
