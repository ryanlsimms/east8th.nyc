import { createHash } from 'node:crypto';
import { copyFileSync, cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

import { renderForHydration, t } from 'kensington';

import { dimensions } from './dimensions.js';
import { items as savedItems } from './items.js';
import { validateItems } from './items-file.js';
import { downloadLinks } from './downloads.js';
import { PLANS_PDF, planFigure } from './plan-figure.js';
import { DEFAULT_GROUPING, scopeList } from './scope-list.js';

const require = createRequire(import.meta.url);

function generateHtml(items, stylesheet) {
  return t.htmlWithDocType({ lang: 'en' }, [
    t.head([
      t.meta({ charset: 'utf-8' }),
      t.meta({ name: 'viewport', content: 'width=device-width, initial-scale=1' }),
      t.meta({ name: 'robots', content: 'noindex, nofollow' }),
      t.meta({ name: 'description', content: 'Scope of work for the East 8th St basement renovation, for contractor estimates.' }),
      t.title('Basement Renovation Scope · East 8th St'),
      t.link({ rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }),
      t.link({ rel: 'stylesheet', href: `/renovation/${stylesheet}` }),
      t.script({ type: 'importmap' }, JSON.stringify({
        imports: { kensington: '/renovation/vendor/kensington.js' },
      })),
    ]),
    t.body([
      t.main({ class: 'page-main' }, [
        planFigure(),
        renderForHydration(scopeList, {
          items, dimensions, downloads: downloadLinks(items), ...DEFAULT_GROUPING,
        }, 'scopeList'),
      ]),
      t.script({ type: 'module', src: '/renovation/client.js' }),
    ]),
  ]).toString();
}

// `items` lets the local editor rebuild with what it just saved, since the
// imported module is cached for the life of the process.
export function buildRenovation(sourceDirectory, outputDirectory, items = savedItems) {
  const errors = validateItems(items);
  if (errors.length > 0) {
    throw new Error(`Invalid renovation items:\n${errors.join('\n')}`);
  }

  const basementSource = join(sourceDirectory, 'renovation');
  const basementOutput = join(outputDirectory, 'renovation');

  rmSync(basementOutput, { recursive: true, force: true });
  mkdirSync(join(basementOutput, 'vendor'), { recursive: true });

  // The CDN can retain the previous CSS across deploys and ignore query
  // strings. Change the path whenever its contents change.
  const css = readFileSync(join(basementSource, 'renovation.css'));
  const cssHash = createHash('sha256').update(css).digest('hex').slice(0, 16);
  const stylesheet = `renovation.${cssHash}.css`;
  writeFileSync(join(basementOutput, stylesheet), css);
  writeFileSync(join(basementOutput, 'index.html'), generateHtml(items, stylesheet));
  cpSync(join(basementSource, 'photos'), join(basementOutput, 'photos'), { recursive: true });
  // Documents attached to items (PDFs in docs-src/renovation).
  for (const src of new Set(items.flatMap(item => (item.documents ?? []).map(d => d.src)))) {
    copyFileSync(join(basementSource, src), join(basementOutput, src));
  }
  for (const file of ['renovation.css', 'client.js', 'scope-list.js', 'grouping-url.js', 'dimensions.js', PLANS_PDF]) {
    copyFileSync(join(basementSource, file), join(basementOutput, file));
  }
  // The bundle ends with `sourceMappingURL=kensington.slim.min.js.map`, so the
  // map keeps its original name next to the renamed bundle.
  const kensingtonBundle = require.resolve('kensington/dist/slim/min');
  copyFileSync(kensingtonBundle, join(basementOutput, 'vendor', 'kensington.js'));
  copyFileSync(`${kensingtonBundle}.map`, join(basementOutput, 'vendor', 'kensington.slim.min.js.map'));
}
