/**
 * Fail-closed fallback used when no browser DOM is available (for example in a
 * Node test run or during server-side rendering). DOMPurify needs a real DOM to
 * do its job, so when it cannot run we refuse to pass any markup through at all
 * and return plain, escaped text instead.
 */
export function escapeAllMarkup(html: string): string {
  if (!html) return "";
  return String(html)
    .replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
