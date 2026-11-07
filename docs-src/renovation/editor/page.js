import { t } from 'kensington';

import { planFigure } from '../plan-figure.js';

// Served only by the local dev server (scripts/docs-server.js).
export function generateEditorHtml() {
  return t.htmlWithDocType({ lang: 'en' }, [
    t.head([
      t.meta({ charset: 'utf-8' }),
      t.meta({ name: 'viewport', content: 'width=device-width, initial-scale=1' }),
      t.meta({ name: 'robots', content: 'noindex, nofollow' }),
      t.title('Edit renovation items'),
      t.link({ rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }),
      t.link({ rel: 'stylesheet', href: '/renovation/renovation.css' }),
      t.link({ rel: 'stylesheet', href: '/renovation/edit/editor.css' }),
      t.script({ type: 'importmap' }, JSON.stringify({
        imports: { kensington: '/renovation/vendor/kensington.js' },
      })),
    ]),
    t.body([
      t.main({ class: 'page-main' }, [
        planFigure(),
        t.div({ id: 'editor' }, t.p({ class: 'editor-loading' }, 'Loading items…')),
      ]),
      t.script({ type: 'module', src: '/renovation/edit/editor.js' }),
    ]),
  ]).toString();
}
