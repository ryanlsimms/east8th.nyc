import { t } from 'kensington';
import schedule from './schedule.js';
import screening from './screening.js';
import footer from './footer.js';

export default [
  t.main([
    t.section({ class: 'schedule', ariaLabelledby: 'schedule-heading' }, [
      t.div({ class: 'section-heading' }, [
        t.div({ class: 'showtime-note' }, [
          t.span({ class: 'sunset-icon', ariaHidden: 'true' }),
          t.p([
            t.strong('Showtime'),
            'Movies begin 15 minutes after sunset.',
          ]),
        ]),
      ]),
      t.div({ class: 'schedule-grid' }, schedule.map(screening)),
    ]),
  ]),
  footer
]
