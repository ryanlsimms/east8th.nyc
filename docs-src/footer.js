import { t } from 'kensington';

export default t.footer([
  t.p({ class: 'tmdb-credit' }, [
    'Poster artwork provided by ',
    t.a({
      href: 'https://www.themoviedb.org/',
      target: '_blank',
      rel: 'noreferrer',
    }, 'TMDB'),
    '. This product uses the TMDB API but is not endorsed or certified by TMDB.',
  ]),
]);
