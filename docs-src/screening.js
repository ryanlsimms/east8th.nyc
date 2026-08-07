import { t } from 'kensington';

const posterBaseUrl = 'https://image.tmdb.org/t/p/w500';
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  day: '2-digit',
  month: 'short',
  timeZone: 'UTC',
  weekday: 'long',
  year: 'numeric',
});

export default function screening(movie, index) {
  const tmdbUrl = `https://www.themoviedb.org/movie/${movie.tmdbId}?language=en-US`;
  const postponedLabel = movie.postponed ? ', postponed' : '';
  const date = new Date(`${movie.date}T00:00:00Z`);
  const dateParts = Object.fromEntries(
    dateFormatter.formatToParts(date).map(({ type, value }) => [type, value]),
  );

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
        t.span({ class: 'date-weekday' }, dateParts.weekday),
        t.span({ class: 'date-month' }, dateParts.month),
        t.span({ class: 'date-day' }, dateParts.day),
      ]),
      t.div({ class: 'screening-title' }, [
        t.h3(movie.title),
        t.p(dateParts.year),
      ]),
    ]),
  ]);
}
