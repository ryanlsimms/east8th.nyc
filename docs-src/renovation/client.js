import { registerComponents } from 'kensington';
import { DEFAULT_GROUPING, scopeList } from './scope-list.js';
import { readGrouping, writeGrouping } from './grouping-url.js';
import { dimensions } from './dimensions.js';

// The page is built with the default grouping; the browser swaps in whatever
// grouping is in the URL and keeps the URL updated as it changes.
registerComponents({ scopeList }, {
  context: {
    grouping: readGrouping(dimensions, DEFAULT_GROUPING),
    onGroupingChange: grouping => writeGrouping(grouping, DEFAULT_GROUPING),
  },
});

// Group headings stick just below the sticky list options, whose height
// changes as the options wrap.
const listOptions = document.querySelector('.list-options');
if (listOptions) {
  new ResizeObserver(() => {
    document.documentElement.style.setProperty('--options-height', `${listOptions.offsetHeight}px`);
  }).observe(listOptions);
}
