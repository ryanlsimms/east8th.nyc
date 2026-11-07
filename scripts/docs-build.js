import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import generateHtml from '../docs-src/index.js';
import { buildRenovation } from '../docs-src/renovation/build.js';

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = join(scriptsDirectory, '..');
const sourceDirectory = join(projectDirectory, 'docs-src');
const outputDirectory = join(projectDirectory, 'docs');

export function buildSite() {
  mkdirSync(outputDirectory, { recursive: true });
  writeFileSync(join(outputDirectory, 'index.html'), generateHtml());
  copyFileSync(join(sourceDirectory, 'favicon.svg'), join(outputDirectory, 'favicon.svg'));
  copyFileSync(join(sourceDirectory, 'social-preview.png'), join(outputDirectory, 'social-preview.png'));
  copyFileSync(join(sourceDirectory, 'styles.css'), join(outputDirectory, 'styles.css'));

  buildRenovation(sourceDirectory, outputDirectory);

  console.log(`Built static site in ${outputDirectory}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildSite();
}
