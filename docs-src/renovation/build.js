import { copyFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

import { renderForHydration, t } from 'kensington';

import { dimensions } from './dimensions.js';
import { items } from './items.js';
import { scopeList } from './scope-list.js';

const require = createRequire(import.meta.url);

function validate() {
  for (const item of items) {
    for (const dimension of dimensions) {
      const values = item.tags[dimension.key];
      if (!values || values.length === 0) {
        throw new Error(`${item.id} ("${item.text}") has no ${dimension.key}`);
      }
      for (const value of values) {
        if (!dimension.values.some(v => v.key === value)) {
          throw new Error(`${item.id} ("${item.text}") has unknown ${dimension.key} "${value}"`);
        }
      }
    }
  }
}

function generateHtml() {
  return t.htmlWithDocType({ lang: 'en' }, [
    t.head([
      t.meta({ charset: 'utf-8' }),
      t.meta({ name: 'viewport', content: 'width=device-width, initial-scale=1' }),
      t.meta({ name: 'robots', content: 'noindex, nofollow' }),
      t.meta({ name: 'description', content: 'Scope of work for the East 8th St basement renovation, for contractor estimates.' }),
      t.title('Basement Renovation Scope · East 8th St'),
      t.link({ rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }),
      t.link({ rel: 'stylesheet', href: '/renovation/renovation.css' }),
      t.script({ type: 'importmap' }, JSON.stringify({
        imports: { kensington: '/renovation/vendor/kensington.js' },
      })),
    ]),
    t.body([
      t.main({ class: 'page-main' }, [
        renderForHydration(scopeList, { items, dimensions, groupBy: 'location' }, 'scopeList'),
      ]),
      t.script({ type: 'module', src: '/renovation/client.js' }),
    ]),
  ]).toString();
}

export function buildRenovation(sourceDirectory, outputDirectory) {
  validate();

  const basementSource = join(sourceDirectory, 'renovation');
  const basementOutput = join(outputDirectory, 'renovation');

  rmSync(basementOutput, { recursive: true, force: true });
  mkdirSync(join(basementOutput, 'vendor'), { recursive: true });

  writeFileSync(join(basementOutput, 'index.html'), generateHtml());
  for (const file of ['renovation.css', 'client.js', 'scope-list.js']) {
    copyFileSync(join(basementSource, file), join(basementOutput, file));
  }
  copyFileSync(
    require.resolve('kensington/dist/slim/min'),
    join(basementOutput, 'vendor', 'kensington.js'),
  );
}
