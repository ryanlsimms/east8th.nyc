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
