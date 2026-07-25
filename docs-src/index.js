import { t } from 'kensington';

export function generateHtml() {
  return t.htmlWithDocType({ lang: 'en' }, [
    t.head([
      t.meta({ charset: 'utf-8' }),
      t.meta({ name: 'viewport', content: 'width=device-width, initial-scale=1' }),
      t.meta({ name: 'theme-color', content: '#f9f6ef' }),
      t.meta({
        name: 'description',
        content: 'Hello from east8th.nyc.',
      }),
      t.title('east8th.nyc'),
      t.link({ rel: 'stylesheet', href: '/styles.css' }),
    ]),
    t.body([
      t.header({ class: 'topbar' }, [
        t.span({ class: 'site-name' }, 'east8th.nyc'),
        t.span({ class: 'status' }, [
          t.span({ class: 'status-dot', ariaHidden: 'true' }),
          'Online',
        ]),
      ]),
      t.main([
        t.section({ class: 'hello-card', ariaLabelledby: 'hello-heading' }, [
          t.p({ class: 'eyebrow' }, 'East 8th Street · New York City'),
          t.h1({ id: 'hello-heading' }, 'Hello world'),
          t.p({ class: 'lede' }, 'The first page is up and running.'),
        ]),
      ]),
    ]),
  ]).toString();
}
