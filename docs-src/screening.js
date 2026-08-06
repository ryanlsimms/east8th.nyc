import { t } from 'kensington';

const posterBaseUrl = 'https://image.tmdb.org/t/p/w500';

export default function screening(movie, index) {
  const tmdbUrl = `https://www.themoviedb.org/movie/${movie.tmdbId}?language=en-US`;
  const postponedLabel = movie.postponed ? ', postponed' : '';

  return t.article({ class: movie.postponed ? 'screening screening-postponed' : 'screening' }, [
    t.a({
      class: 'poster-link',
      href: tmdbUrl,
      target: '_blank',
      rel: 'noreferrer',
      ariaLabel: `View ${movie.title}${postponedLabel} on TMDB`,
    }, [
      t.img({
        class: 'poster',
        src: `${posterBaseUrl}/${movie.poster}`,
        alt: `${movie.title} poster`,
        width: 500,
        height: 750,
        loading: index < 4 ? 'eager' : 'lazy',
      }),
      ...(movie.postponed ? [
        t.span({ class: 'postponed-banner', ariaHidden: 'true' }, 'Postponed'),
      ] : []),
    ]),
    t.div({ class: 'screening-details' }, [
      t.time({ class: 'screening-date', datetime: movie.date }, [
        t.span({ class: 'date-weekday' }, movie.weekday),
        t.span({ class: 'date-month' }, movie.month),
        t.span({ class: 'date-day' }, movie.day),
      ]),
      t.div({ class: 'screening-title' }, [
        t.h3(movie.title),
        t.p(movie.year),
      ]),
    ]),
  ]);
}
