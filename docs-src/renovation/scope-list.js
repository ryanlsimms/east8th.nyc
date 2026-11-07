// Shared between the build (server render), the browser (client takeover) and
// the local editor, so it may only import 'kensington'.
import { t, signal, computed, effect } from 'kensington';

const NONE = 'none';

export const DEFAULT_GROUPING = { groupBy: 'phase', thenBy: 'location' };

// Groups `items` by one dimension. `prefix` keeps subgroup keys (and so their
// element ids) unique across parent groups.
function groupItems(items, dimension, prefix = '') {
  if (!dimension) {
    return [{ key: `${prefix}${NONE}`, label: 'All items', valueKey: null, items }];
  }
  const groups = dimension.values.map(value => ({
    key: `${prefix}${dimension.key}-${value.key}`,
    label: value.label,
    valueKey: value.key,
    items: items.filter(item => item.tags[dimension.key]?.includes(value.key)),
  }));
  // Only happens in the editor, for items that are still being tagged.
  const untagged = items.filter(item => !item.tags[dimension.key]?.length);
  if (untagged.length > 0) {
    groups.unshift({
      key: `${prefix}${dimension.key}-untagged`,
      label: `No ${dimension.label.toLowerCase()} yet`,
      valueKey: null,
      items: untagged,
    });
  }
  return groups.filter(group => group.items.length > 0);
}

// Two-level grouping: each group gets `subgroups` when a second dimension is
// chosen.
function groupTree(items, dimension, subDimension) {
  return groupItems(items, dimension).map(group => ({
    ...group,
    subgroups: subDimension ? groupItems(group.items, subDimension, `${group.key}--`) : null,
  }));
}

function tagList(item, dimensions, hiddenKeys) {
  return t.ul({ class: 'tags' }, dimensions
    .filter(dimension => !hiddenKeys.includes(dimension.key))
    .flatMap(dimension => (item.tags[dimension.key] ?? []).map(valueKey => {
      const value = dimension.values.find(v => v.key === valueKey);
      return value.quiet ? null : t.li({ class: `tag tag-${dimension.key}`, title: dimension.label }, value.label);
    })));
}

// Other values the item has in the grouped dimensions, i.e. the other groups
// it also appears in.
function alsoIn(item, groupings) {
  const others = groupings.flatMap(({ dimension, valueKey }) => (valueKey
    ? (item.tags[dimension.key] ?? [])
      .filter(key => key !== valueKey)
      .map(key => dimension.values.find(v => v.key === key).label)
    : []));
  return others.length > 0
    ? t.p({ class: 'also-in' }, `Also listed under ${others.join(', ')}`)
    : null;
}

// A drawn × rather than the text character, which sits off-centre in most fonts.
const CLOSE_ICON = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
const DOCUMENT_ICON = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/></svg>';
const IMAGE_ICON = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></svg>';

// An image-icon button (labelled for screen readers) and the <dialog> it opens.
// The dialog closes from its Close button, Escape, or a click on the backdrop.
function photoViewer(item) {
  const count = item.photos.length;
  const plans = item.photos.every(photo => photo.src.endsWith('.svg'));
  const label = plans ? `View plans (${count})` : count === 1 ? 'View photo' : `View photos (${count})`;
  return [
    t.button({
      type: 'button',
      class: 'photos-button',
      title: label,
      ariaLabel: label,
      onclick: event => event.currentTarget.nextElementSibling.showModal(),
    }, [t.literal(IMAGE_ICON), count > 1 && t.span({ class: 'photos-count', ariaHidden: 'true' }, `${count}`)]),
    t.dialog({
      class: 'photo-dialog',
      'data-item': item.id,
      ariaLabel: item.text,
      onclick: event => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      },
    }, [
      t.div({ class: 'photo-dialog-bar' }, [
        t.p({ class: 'photo-dialog-title' }, item.text),
        t.form({ method: 'dialog' }, t.button({ class: 'photo-dialog-close', ariaLabel: 'Close' }, t.literal(CLOSE_ICON))),
      ]),
      t.div({ class: 'photo-grid' }, item.photos.map(photo => t.figure([
        t.img({
          src: `/renovation/photos/${photo.src}`,
          alt: photo.caption || item.text,
          // SVGs have no pixel size of their own; photos use their file's.
          width: photo.src.endsWith('.svg') ? 790 : undefined,
          height: photo.src.endsWith('.svg') ? 1130 : undefined,
          loading: 'lazy',
        }),
        photo.caption && t.figcaption(photo.caption),
      ]))),
    ]),
  ];
}

// `context` is { dimensions, groupings, groupItems }: `groupings` lists the
// { dimension, valueKey } of each level the item is shown under, and
// `groupItems` the items of its innermost group. `extra` is appended to the
// card (the editor's pencil button).
export function scopeItem(item, { dimensions, groupings }, extra = null) {
  return t.li({ class: 'scope-item' }, [
    t.p({ class: 'scope-text' }, item.text),
    item.note && t.p({ class: 'scope-note' }, item.note),
    item.link && t.p({ class: 'scope-link' },
      t.a({ href: item.link.href, target: '_blank', rel: 'noreferrer' }, `${item.link.label} ↗`)),
    (item.documents?.length > 0 || item.photos?.length > 0) && t.div({ class: 'scope-attachments' }, [
      (item.documents ?? []).map(document => t.a({
        class: 'document-button',
        href: `/renovation/${document.src}`,
        target: '_blank',
        rel: 'noreferrer',
        title: document.label,
        ariaLabel: document.label,
      }, [t.literal(DOCUMENT_ICON), t.span({ ariaHidden: 'true' }, 'PDF')])),
      item.photos?.length > 0 && photoViewer(item),
    ]),
    alsoIn(item, groupings),
    tagList(item, dimensions, groupings.map(g => g.dimension.key)),
    extra,
  ]);
}

const groupId = group => `group-${group.key}`;

function itemList(items, context, renderItem) {
  return t.ol({ class: 'scope-items' }, items.map(item => renderItem(item, { ...context, groupItems: items })));
}

function groupList({ dimension, subDimension, groups }, dimensions, renderItem) {
  return t.div({ class: 'groups' }, groups.map(group => {
    const groupings = dimension ? [{ dimension, valueKey: group.valueKey }] : [];
    return t.section({ class: 'group', id: groupId(group), ariaLabel: group.label }, [
      t.h2({ class: 'group-heading' }, [
        t.span({ class: 'group-label' }, group.label),
        t.span({ class: 'group-count' }, `${group.items.length}`),
      ]),
      group.subgroups
        ? group.subgroups.map(subgroup => t.section(
          { class: 'subgroup', id: groupId(subgroup), ariaLabel: `${group.label}: ${subgroup.label}` },
          [
            t.h3({ class: 'subgroup-heading' }, [
              t.span({ class: 'group-label' }, subgroup.label),
              t.span({ class: 'group-count' }, `${subgroup.items.length}`),
            ]),
            itemList(subgroup.items, {
              dimensions,
              groupings: [...groupings, { dimension: subDimension, valueKey: subgroup.valueKey }],
            }, renderItem),
          ],
        ))
        : itemList(group.items, { dimensions, groupings }, renderItem),
    ]);
  }));
}

const navLink = group => t.a({ href: `#${groupId(group)}` }, [
  t.span(group.label),
  t.span({ class: 'group-nav-count' }, `${group.items.length}`),
]);

// Sidebar links to each group (and subgroup); scroll-margin-top on .group and
// .subgroup keeps the headings clear of the sticky bar and parent heading.
function groupNav({ groups }) {
  return t.ol({ class: 'group-nav-list' }, groups.map(group => t.li([
    navLink(group),
    group.subgroups && t.ol({ class: 'group-nav-sublist' }, group.subgroups.map(subgroup => t.li(navLink(subgroup)))),
  ])));
}

const DOWNLOAD_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>';

const csvCell = value => (/[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

// One row per item as currently shown: group, subgroup (if any), item. Items
// that appear in several groups get a row in each, like the list.
function toCsv({ dimension, subDimension, groups }) {
  const header = [dimension?.label, subDimension?.label, 'Item'].filter(Boolean);
  const rows = groups.flatMap(group => (group.subgroups
    ? group.subgroups.flatMap(subgroup => subgroup.items.map(item => [group.label, subgroup.label, item.text]))
    : group.items.map(item => (dimension ? [group.label, item.text] : [item.text]))));
  return [header, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
}

// Browser-only: called from a click handler.
function downloadCsv(currentView) {
  const { dimension, subDimension } = currentView;
  const name = ['renovation-scope', dimension?.key, subDimension?.key].filter(Boolean).join('-');
  // The BOM makes Excel read the file as UTF-8 (′ ″ — ’).
  const blob = new Blob(['﻿', toCsv(currentView), '\r\n'], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${name}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

// Text links to every PDF download and every item's photo/plan pop-up.
// `downloads` is [{ href, label, filename }]. A pop-up link opens the first
// copy of that item's dialog in the list (an item can appear in several groups).
function resourcesSection(items, downloads) {
  const withPhotos = items.filter(item => item.photos?.length > 0);
  if (downloads.length === 0 && withPhotos.length === 0) return null;
  return t.section({ class: 'resources', ariaLabelledby: 'resources-heading' }, [
    t.h2({ class: 'resources-heading', id: 'resources-heading' }, 'Images and downloads'),
    t.ul({ class: 'resources-list' }, [
      ...downloads.map(download => t.li(t.a({
        class: 'resource-link',
        href: download.href,
        download: download.filename,
      }, download.label))),
      ...withPhotos.map(item => {
        const plans = item.photos.every(photo => photo.src.endsWith('.svg'));
        return t.li(t.button({
          type: 'button',
          class: 'resource-link',
          onclick: () => document.querySelector(`dialog[data-item="${item.id}"]`)?.showModal(),
        }, `${item.text} (${item.photos.length} ${plans ? 'plans' : 'photos'})`));
      }),
    ]),
  ]);
}

// The grouped list with its Group by / Then by options. The public page passes
// plain items; the editor passes `getItems`, a `version` signal that
// re-renders the list, its own `renderItem`, and `actions` for the options bar.
export function scopeView({
  dimensions,
  initialGroupBy = DEFAULT_GROUPING.groupBy,
  initialThenBy = DEFAULT_GROUPING.thenBy,
  getItems,
  version = null,
  renderItem = scopeItem,
  actions = null,
  onGroupingChange = null,
  downloads = [],
}) {
  const groupBy = signal(initialGroupBy);
  const thenBy = signal(initialThenBy);
  const options = [...dimensions.map(d => ({ key: d.key, label: d.label })), { key: NONE, label: 'None' }];

  // Browser only: lets the page remember the grouping (see grouping-url.js).
  if (onGroupingChange) {
    effect(() => onGroupingChange({ groupBy: groupBy.get(), thenBy: thenBy.get() }));
  }

  const setGroupBy = key => {
    groupBy.set(key);
    if (key === NONE || key === thenBy.get()) thenBy.set(NONE);
  };

  const view = computed(() => {
    version?.get();
    const dimension = dimensions.find(d => d.key === groupBy.get());
    const subDimension = dimension ? dimensions.find(d => d.key === thenBy.get()) : undefined;
    return { dimension, subDimension, groups: groupTree(getItems(), dimension, subDimension) };
  });
  const total = computed(() => {
    version?.get();
    return `${getItems().length} items`;
  });

  const resources = computed(() => {
    version?.get();
    return resourcesSection(getItems(), downloads);
  });

  return t.div({ class: 'scope' }, [
    resources,
    t.form({ class: 'list-options', onsubmit: event => event.preventDefault() }, [
      t.fieldset({ class: 'group-by' }, [
        t.legend('Group by'),
        t.div({ class: 'segmented' }, options.map(option => t.label({ class: 'segment' }, [
          t.input({
            type: 'radio',
            name: 'group-by',
            value: option.key,
            checked: option.key === initialGroupBy,
            prop: { checked: groupBy.transform(v => v === option.key, `checked-${option.key}`) },
            onchange: () => setGroupBy(option.key),
          }),
          t.span(option.label),
        ]))),
      ]),
      t.label({ class: 'then-by' }, [
        t.span({ class: 'then-by-label' }, 'Subgroup by'),
        t.select({
          name: 'then-by',
          disabled: groupBy.transform(v => v === NONE, 'then-by-disabled'),
          prop: { value: thenBy },
          onchange: event => thenBy.set(event.target.value),
        }, [
          t.option({ value: NONE, selected: initialThenBy === NONE }, 'None'),
          ...dimensions.map(d => t.option({
            value: d.key,
            selected: d.key === initialThenBy,
            disabled: groupBy.transform(v => v === d.key, `then-by-${d.key}-disabled`),
          }, d.label)),
        ]),
      ]),
      t.button({
        type: 'button',
        class: 'download-csv',
        title: 'Download this view as CSV',
        ariaLabel: 'Download this view as CSV',
        onclick: () => downloadCsv(view.get()),
      }, t.literal(DOWNLOAD_ICON)),
      actions,
    ]),
    t.div({ class: 'scope-body' }, [
      t.nav({ class: 'group-nav', ariaLabel: 'Groups' }, view.transform(groupNav, 'group-nav')),
      t.div({ class: 'scope-main' }, [
        t.p({ class: 'item-total' }, total),
        view.transform(v => groupList(v, dimensions, renderItem), 'group-list'),
      ]),
    ]),
  ]);
}

// `context` comes from registerComponents in the browser: the grouping read
// from the URL, and a callback to write it back.
export function scopeList(
  { items, dimensions, downloads = [], groupBy = DEFAULT_GROUPING.groupBy, thenBy = DEFAULT_GROUPING.thenBy },
  context = {},
) {
  const initial = context.grouping ?? { groupBy, thenBy };
  return scopeView({
    dimensions,
    initialGroupBy: initial.groupBy,
    initialThenBy: initial.thenBy,
    getItems: () => items,
    onGroupingChange: context.onGroupingChange ?? null,
    downloads,
  });
}
