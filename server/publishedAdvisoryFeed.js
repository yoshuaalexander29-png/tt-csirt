import crypto from 'node:crypto';
import {
  LEGACY_DEVELOPMENT_SEED_IDS,
  publishingStorage,
} from '../services/publishing-api/src/storage/dev-storage.ts';

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));
const safeExternalUrl = (value) => /^https?:\/\//i.test(value || '') ? escapeHtml(value) : '';

function renderInline(nodes = []) {
  return nodes.map((node) => {
    const text = escapeHtml(node.text || '');
    if (node.type === 'strong') return `<strong>${text}</strong>`;
    if (node.type === 'emphasis') return `<em>${text}</em>`;
    if (node.type === 'code') return `<code>${text}</code>`;
    if (node.type === 'link' && safeExternalUrl(node.href)) {
      return `<a href="${safeExternalUrl(node.href)}">${text}</a>`;
    }
    return text;
  }).join('');
}

function renderNode(node, references) {
  switch (node.type) {
    case 'paragraph':
      return `<p>${renderInline(node.inlines?.length ? node.inlines : [{ type: 'text', text: node.text }])}</p>`;
    case 'subheading':
      return `<h${node.level}>${escapeHtml(node.text)}</h${node.level}>`;
    case 'list': {
      const tag = node.ordered ? 'ol' : 'ul';
      return `<${tag}>${node.items.map((item) => `<li>${renderInline(item.inlines?.length ? item.inlines : [{ type: 'text', text: item.text }])}</li>`).join('')}</${tag}>`;
    }
    case 'table':
      return `<table>${node.caption ? `<caption>${escapeHtml(node.caption)}</caption>` : ''}` +
        `<thead><tr>${node.headers.map((header) => `<th scope="col">${escapeHtml(header)}</th>`).join('')}</tr></thead>` +
        `<tbody>${node.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    case 'callout':
      return `<aside>${node.title ? `<h3>${escapeHtml(node.title)}</h3>` : ''}<p>${renderInline(node.inlines?.length ? node.inlines : [{ type: 'text', text: node.text }])}</p></aside>`;
    case 'code':
      return `<pre><code>${escapeHtml(node.code)}</code></pre>`;
    case 'references': {
      const items = node.referenceIds.map((id) => references.find((reference) => reference.id === id)).filter(Boolean);
      return items.length ? `<ul>${items.map((reference) => `<li>${safeExternalUrl(reference.url) ? `<a href="${safeExternalUrl(reference.url)}">${escapeHtml(reference.title)}</a>` : escapeHtml(reference.title)}</li>`).join('')}</ul>` : '';
    }
    default:
      return '';
  }
}

function renderPublishedContent(advisory) {
  const cves = advisory.cveMetadata.map((cve) =>
    `<li><strong>${escapeHtml(cve.id)}</strong>${cve.summary ? `: ${escapeHtml(cve.summary)}` : ''}</li>`,
  ).join('');
  const products = advisory.affectedProducts.map((product) =>
    `<li><strong>${escapeHtml(product.vendor)} ${escapeHtml(product.product)}</strong>: affected ${escapeHtml(product.affectedVersions.join(', '))}; fixed ${escapeHtml(product.fixedVersions?.join(', ') || 'not specified')}</li>`,
  ).join('');
  const sections = Object.values(advisory.sections).flatMap((section) => Array.isArray(section) ? section : [section]);
  const sectionHtml = sections.filter((section) => section?.nodes).map((section) =>
    `<section><h2>${escapeHtml(section.title)}</h2>${section.nodes.map((node) => renderNode(node, advisory.references)).join('')}</section>`,
  ).join('');
  const media = advisory.mediaAssets.filter((asset) => asset.mimeType.startsWith('image/') && /^\/(?:assets|media)\/advisories\/[\w/-]+\.[\w]+$/.test(asset.publicUrl)).map((asset) =>
    `<figure><img src="${escapeHtml(asset.publicUrl)}" alt="${escapeHtml(asset.altText)}">${asset.caption ? `<figcaption>${escapeHtml(asset.caption)}</figcaption>` : ''}</figure>`,
  ).join('');
  const references = advisory.references.map((reference) =>
    `<li>${safeExternalUrl(reference.url) ? `<a href="${safeExternalUrl(reference.url)}">${escapeHtml(reference.title)}</a>` : escapeHtml(reference.title)}</li>`,
  ).join('');

  return [
    `<p>${escapeHtml(advisory.leadParagraph)}</p>`,
    cves ? `<section><h2>Vulnerabilities</h2><ul>${cves}</ul></section>` : '',
    products ? `<section><h2>Affected products</h2><ul>${products}</ul></section>` : '',
    sectionHtml,
    media,
    references ? `<section><h2>References</h2><ul>${references}</ul></section>` : '',
  ].join('');
}

function stablePublicId(id) {
  return Number.parseInt(crypto.createHash('sha256').update(id).digest('hex').slice(0, 12), 16);
}

export function getPublishedAdvisoryPosts(storage = publishingStorage) {
  return storage.listPublishedAdvisories()
    .filter((advisory) => !LEGACY_DEVELOPMENT_SEED_IDS.has(advisory.id))
    .filter((advisory) => advisory.publication.status === 'published' && advisory.isPublicDeliveryReady)
    .map((advisory) => ({
      id: stablePublicId(advisory.id),
      date: advisory.publication.publishedAt,
      modified: advisory.publication.updatedAt || advisory.publication.publishedAt,
      slug: advisory.slug,
      title: { rendered: advisory.title },
      excerpt: { rendered: advisory.leadParagraph },
      content: { rendered: renderPublishedContent(advisory) },
      categories: [advisory.classification === 'alert' ? 7 : 5],
      tags: [],
      link: `https://ttcsirt.gov.tt/advisories/${encodeURIComponent(advisory.slug)}/`,
      referenceNumber: advisory.referenceNumber,
      ttcsirtPublishingRecord: true,
    }));
}
