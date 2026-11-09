import { registerComponents } from 'kensington';
import { DEFAULT_GROUPING, scopeList } from './scope-list.js';
import { initializeScopeNavigation, readGrouping, writeGrouping } from './grouping-url.js';
import { dimensions } from './dimensions.js';

// The page is built with the default grouping; the browser swaps in whatever
// grouping is in the URL and keeps the URL updated as it changes.
registerComponents({ scopeList }, {
  context: {
    grouping: readGrouping(dimensions, DEFAULT_GROUPING),
    onGroupingChange: grouping => writeGrouping(grouping, DEFAULT_GROUPING),
  },
});

initializeScopeNavigation();
