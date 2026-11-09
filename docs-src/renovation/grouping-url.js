// Browser-only: keeps the Group by / Subgroup by choice in the URL
// (?group=trade&subgroup=location) so it survives a reload and can be shared.
// The hash is left alone; the sidebar uses it for scrolling.

const NONE = 'none';

// Returns { groupBy, thenBy } from the URL, falling back to the defaults for
// anything missing or unknown.
export function readGrouping(dimensions, defaults) {
  const params = new URLSearchParams(window.location.search);
  const keys = new Set(dimensions.map(d => d.key));
  const group = params.get('group');
  const subgroup = params.get('subgroup');
  const groupBy = group === NONE || keys.has(group) ? group : defaults.groupBy;
  let thenBy = subgroup === NONE || keys.has(subgroup) ? subgroup : defaults.thenBy;
  if (!params.has('group') && !params.has('subgroup')) return defaults;
  if (!params.has('subgroup')) thenBy = NONE;
  if (groupBy === NONE || thenBy === groupBy) thenBy = NONE;
  return { groupBy, thenBy };
}

export function writeGrouping({ groupBy, thenBy }, defaults) {
  const url = new URL(window.location.href);
  if (groupBy === defaults.groupBy && thenBy === defaults.thenBy) {
    url.searchParams.delete('group');
    url.searchParams.delete('subgroup');
  } else {
    url.searchParams.set('group', groupBy);
    if (thenBy === NONE) url.searchParams.delete('subgroup');
    else url.searchParams.set('subgroup', thenBy);
  }
  if (url.href !== window.location.href) window.history.replaceState(window.history.state, '', url);
}

// Run after the grouped list is mounted (including the editor's async load).
// Native fragment scrolling can run before the URL-selected groups exist.
export async function initializeScopeNavigation() {
  if (document.readyState === 'loading') {
    await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
  }
  const listOptions = document.querySelector('.list-options');
  const updateOffset = () => {
    if (listOptions) {
      document.documentElement.style.setProperty('--options-height', `${listOptions.offsetHeight}px`);
    }
  };
  updateOffset();
  if (listOptions) new ResizeObserver(updateOffset).observe(listOptions);

  const hash = window.location.hash;
  if (!hash) return;
  let id;
  try {
    id = decodeURIComponent(hash.slice(1));
  } catch {
    return;
  }
  // Finish loading and font layout before overriding the browser's restored
  // scroll position. scroll-margin-top accounts for the sticky headings.
  await Promise.all([
    document.fonts.ready,
    document.readyState === 'complete' ? Promise.resolve()
      : new Promise(resolve => window.addEventListener('load', resolve, { once: true })),
  ]);
  requestAnimationFrame(() => {
    if (window.location.hash !== hash) return;
    updateOffset();
    document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'instant' });
  });
}
