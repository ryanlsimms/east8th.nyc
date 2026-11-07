// Server-only: the PDF downloads listed in the page's "Images and downloads"
// section — the full plans, then any document attached to an item. Sizes are
// read from the files so the labels stay accurate.
import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { PLANS_PDF } from './plan-figure.js';

const fileSize = src => {
  const bytes = statSync(fileURLToPath(new URL(src, import.meta.url))).size;
  return bytes >= 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1000))} KB`;
};

export function downloadLinks(items) {
  const documents = new Map();
  for (const item of items) {
    for (const document of item.documents ?? []) documents.set(document.src, document);
  }
  return [
    {
      href: `/renovation/${PLANS_PDF}`,
      label: `Download the full plans (PDF, 6 pages, ${fileSize(PLANS_PDF)})`,
      filename: '139 E 8th St basement plans 2026-10-29.pdf',
    },
    ...[...documents.values()].map(document => ({
      href: `/renovation/${document.src}`,
      label: `${document.label.replace(/\s*\(PDF\)$/, '')} (PDF, ${fileSize(document.src)})`,
      filename: document.src,
    })),
  ];
}
