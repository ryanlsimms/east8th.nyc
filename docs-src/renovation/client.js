import { registerComponents } from 'kensington';
import { scopeList } from './scope-list.js';

registerComponents({ scopeList });

// Group headings stick just below the sticky list options, whose height
// changes as the options wrap.
const listOptions = document.querySelector('.list-options');
if (listOptions) {
  new ResizeObserver(() => {
    document.documentElement.style.setProperty('--options-height', `${listOptions.offsetHeight}px`);
  }).observe(listOptions);
}
