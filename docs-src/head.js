import { t } from 'kensington';

const siteUrl = 'https://east8th.nyc/';
const previewImageUrl = `${siteUrl}social-preview.png`;
const previewTitle = 'East 8th Street';
const previewDescription = 'The 2026 East 8th St backyard movie schedule.';
const previewImageAlt = 'East 8th St Backyard Movies 2026';

export default t.head([
  t.meta({ charset: 'utf-8' }),
  t.meta({ name: 'viewport', content: 'width=device-width, initial-scale=1' }),
  t.meta({ name: 'theme-color', content: '#fbf5e8', media: '(prefers-color-scheme: light)' }),
  t.meta({ name: 'theme-color', content: '#071b24', media: '(prefers-color-scheme: dark)' }),
  t.meta({ name: 'description', content: previewDescription }),
  t.meta({ property: 'og:title', content: previewTitle }),
  t.meta({ property: 'og:description', content: previewDescription }),
  t.meta({ property: 'og:type', content: 'website' }),
  t.meta({ property: 'og:url', content: siteUrl }),
  t.meta({ property: 'og:site_name', content: 'East 8th Backyard Movies' }),
  t.meta({ property: 'og:locale', content: 'en_US' }),
  t.meta({ property: 'og:image', content: previewImageUrl }),
  t.meta({ property: 'og:image:secure_url', content: previewImageUrl }),
  t.meta({ property: 'og:image:type', content: 'image/png' }),
  t.meta({ property: 'og:image:width', content: '1200' }),
  t.meta({ property: 'og:image:height', content: '630' }),
  t.meta({ property: 'og:image:alt', content: previewImageAlt }),
  t.meta({ name: 'twitter:card', content: 'summary_large_image' }),
  t.meta({ name: 'twitter:title', content: previewTitle }),
  t.meta({ name: 'twitter:description', content: previewDescription }),
  t.meta({ name: 'twitter:image', content: previewImageUrl }),
  t.meta({ name: 'twitter:image:alt', content: previewImageAlt }),
  t.title('East 8th St'),
  t.link({ rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }),
  t.link({ rel: 'canonical', href: siteUrl }),
  t.link({ rel: 'preconnect', href: 'https://image.tmdb.org' }),
  t.link({ rel: 'stylesheet', href: '/styles.css' }),
])
