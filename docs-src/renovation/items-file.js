// Reads, validates and writes items.js. Used by the build and by the local
// editor (scripts/docs-server.js → /renovation/edit).
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { dimensions } from './dimensions.js';

const itemsUrl = new URL('./items.js', import.meta.url);
const photosUrl = new URL('./photos/', import.meta.url);
// Documents (PDFs) sit directly in docs-src/renovation, next to this file.
const documentsUrl = new URL('./', import.meta.url);

export async function readItems() {
  // Cache-bust so the editor always sees what is on disk.
  const module = await import(`${itemsUrl.href}?t=${Date.now()}`);
  return module.items;
}

// Fingerprint of items.js as it is on disk. The editor sends back the one it
// loaded, so a save can't silently overwrite edits made elsewhere.
export function itemsRevision() {
  return createHash('sha1').update(readFileSync(fileURLToPath(itemsUrl))).digest('hex');
}

export function validateItems(items) {
  const errors = [];
  const ids = new Set();
  items.forEach((item, index) => {
    const name = `#${index + 1} ("${item.text || 'untitled'}")`;
    if (typeof item.id !== 'string' || !item.id) errors.push(`${name} has no id`);
    else if (ids.has(item.id)) errors.push(`${name} has duplicate id ${item.id}`);
    ids.add(item.id);
    if (typeof item.text !== 'string' || !item.text.trim()) errors.push(`${name} has no text`);
    if (item.links != null && !Array.isArray(item.links)) {
      errors.push(`${name} links must be an array`);
    } else {
      for (const [index, link] of (item.links ?? []).entries()) {
        if (!(typeof link?.href === 'string' && /^https?:\/\//.test(link.href))) {
          errors.push(`${name} link #${index + 1} needs an http(s) URL`);
        }
      }
    }
    for (const photo of item.photos ?? []) {
      if (typeof photo.src !== 'string' || !/^[\w.-]+$/.test(photo.src)
        || !existsSync(fileURLToPath(new URL(photo.src, photosUrl)))) {
        errors.push(`${name} has a photo that isn't in docs-src/renovation/photos: ${photo.src}`);
      }
    }
    for (const document of item.documents ?? []) {
      if (typeof document.src !== 'string' || !/^[\w.-]+\.pdf$/.test(document.src)
        || !existsSync(fileURLToPath(new URL(document.src, documentsUrl)))) {
        errors.push(`${name} has a document that isn't a PDF in docs-src/renovation: ${document.src}`);
      }
    }
    for (const dimension of dimensions) {
      const values = item.tags?.[dimension.key];
      if (!Array.isArray(values) || values.length === 0) {
        errors.push(`${name} has no ${dimension.label.toLowerCase()} selected`);
        continue;
      }
      if (dimension.exclusive && values.length !== 1) {
        errors.push(`${name} must have exactly one ${dimension.label.toLowerCase()} selected`);
      }
      for (const value of values) {
        if (!dimension.values.some(v => v.key === value)) {
          errors.push(`${name} has unknown ${dimension.label.toLowerCase()} "${value}"`);
        }
      }
    }
  });
  return errors;
}

// Keep only known fields, drop empties, and order tags like the dimensions.
export function normalizeItem(item) {
  const text = String(item.text ?? '').trim();
  const note = String(item.note ?? '').trim() || null;
  const links = (item.links ?? []).map(link => {
    const href = String(link?.href ?? '').trim();
    return { href, label: String(link?.label ?? '').trim() || href };
  }).filter(link => link.href || link.label);
  const tags = Object.fromEntries(dimensions.map(dimension => [
    dimension.key,
    dimension.values.map(v => v.key).filter(key => (item.tags?.[dimension.key] ?? []).includes(key)),
  ]));
  const photos = (item.photos ?? []).map(photo => ({ src: photo.src, caption: String(photo.caption ?? '').trim() }));
  const documents = (item.documents ?? []).map(document => ({
    src: document.src,
    label: String(document.label ?? '').trim() || document.src,
  }));
  return {
    id: item.id,
    text,
    note,
    links: links.length > 0 ? links : null,
    documents: documents.length > 0 ? documents : null,
    photos: photos.length > 0 ? photos : null,
    tags,
  };
}

const str = value => JSON.stringify(value);

function serializeItem(item) {
  const lines = [
    `    id: ${str(item.id)},`,
    `    text: ${str(item.text)},`,
  ];
  if (item.note) lines.push(`    note: ${str(item.note)},`);
  if (item.links?.length) {
    lines.push('    links: [');
    for (const link of item.links) lines.push(`      { href: ${str(link.href)}, label: ${str(link.label)} },`);
    lines.push('    ],');
  }
  if (item.documents) {
    lines.push('    documents: [');
    for (const document of item.documents) lines.push(`      { src: ${str(document.src)}, label: ${str(document.label)} },`);
    lines.push('    ],');
  }
  if (item.photos) {
    lines.push('    photos: [');
    for (const photo of item.photos) lines.push(`      { src: ${str(photo.src)}, caption: ${str(photo.caption)} },`);
    lines.push('    ],');
  }
  lines.push('    tags: {');
  for (const dimension of dimensions) {
    lines.push(`      ${dimension.key}: [${item.tags[dimension.key].map(str).join(', ')}],`);
  }
  lines.push('    },');
  return `  {\n${lines.join('\n')}\n  },`;
}

export function writeItems(items) {
  const normalized = items.map(normalizeItem);
  const errors = validateItems(normalized);
  if (errors.length > 0) {
    const error = new Error(errors.join('\n'));
    error.errors = errors;
    throw error;
  }
  const source = [
    '// Scope items for /renovation; file order breaks ties in the tag sort. Edit with the local editor',
    '// (npm run docs, then /renovation/edit) or by hand; tag keys come from',
    '// dimensions.js. An item with several values for a dimension appears in each',
    '// of those groups. Photo files live in docs-src/renovation/photos; document',
    '// PDFs live in docs-src/renovation. Links use links: [{ href, label }, ...].',
    '',
    'export const items = [',
    ...normalized.map(serializeItem),
    '];',
    '',
  ].join('\n');
  writeFileSync(fileURLToPath(itemsUrl), source);
  return normalized;
}
