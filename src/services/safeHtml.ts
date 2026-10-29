import DOMPurify from "dompurify";
import { escapeAllMarkup } from "@/services/safeHtmlFallback";

/**
 * The one place where untrusted advisory HTML becomes safe HTML.
 *
 * Approach follows the OWASP XSS Prevention Cheat Sheet ("OWASP recommends
 * DOMPurify for HTML Sanitization") and the DOMPurify project's own README
 * recipes: allow-list tags and URL schemes, then use an
 * `afterSanitizeAttributes` hook so every link that opens a new tab also
 * carries rel="noopener noreferrer".
 *
 * Keep DOMPurify patched. It is a security dependency, not a convenience one.
 */

const ALLOWED_TAGS = [
  "a", "abbr", "b", "blockquote", "br", "caption", "cite", "code", "dd", "del",
  "div", "dl", "dt", "em", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i", "img",
  "ins", "kbd", "li", "mark", "ol", "p", "pre", "q", "s", "samp", "small", "span",
  "strong", "sub", "sup", "table", "tbody", "td", "tfoot", "th", "thead", "time",
  "tr", "u", "ul",
];

const ALLOWED_ATTR = [
  "href", "src", "alt", "title", "class", "id", "target", "rel", "colspan",
  "rowspan", "scope", "headers", "width", "height", "datetime", "lang", "dir",
];

// Only web links, email, phone and in-page / relative links may survive.
// This blocks javascript:, data:, vbscript: and friends.
const ALLOWED_URI_REGEXP = /^(?:https?:|mailto:|tel:|\/|#|\.\.?\/)/i;

// Images that point at private network addresses can never load for the public.
const PRIVATE_HOST = /^https?:\/\/(?:localhost|127\.|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/i;

let hooksInstalled = false;

function installHooks(): void {
  if (hooksInstalled || !DOMPurify.isSupported) return;
  hooksInstalled = true;

  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (!(node instanceof Element)) return;

    // External web links open in a new tab and can never reach back into our page.
    // Set in the hook (DOMPurify README pattern) because DOMPurify drops `target` on its own.
    if (node.tagName === "A") {
      const href = node.getAttribute("href") || "";
      if (/^https?:/i.test(href) && !/^https?:\/\/(?:[\w-]+\.)*ttcsirt\.gov\.tt(?:[/?#]|$)/i.test(href)) {
        node.setAttribute("target", "_blank");
        node.setAttribute("rel", "noopener noreferrer");
      } else {
        node.removeAttribute("target");
        node.removeAttribute("rel");
      }
    }

    // Drop images that can only point at an internal network.
    if (node.tagName === "IMG") {
      const src = node.getAttribute("src") || "";
      if (!src || PRIVATE_HOST.test(src)) node.remove();
    }
  });
}

export function sanitizeAdvisoryHtml(dirty: string): string {
  if (!dirty) return "";
  if (!DOMPurify.isSupported) return escapeAllMarkup(dirty);

  installHooks();
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP,
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: true,
    KEEP_CONTENT: true,
    RETURN_TRUSTED_TYPE: false,
  }) as string;
}
