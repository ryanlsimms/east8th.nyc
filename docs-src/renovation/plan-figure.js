import { t } from 'kensington';

import { planSvg } from './plan.js';

// Copied into the built site by build.js.
export const PLANS_PDF = 'basement-plans-2026-10-29.pdf';

// The floor plan at the top of the page. The wrapper scrolls sideways on
// narrow screens so room labels stay readable.
export function planFigure() {
  return t.figure({ class: 'plan' }, [
    t.div({ class: 'plan-scroll' }, t.unsafeLiteral(planSvg)),
    // The full plans download is in the "Images and downloads" section.
    t.figcaption('Simplified from the architect’s proposed basement plan (29 Oct 2026). Not to scale; not for construction.'),
  ]);
}
