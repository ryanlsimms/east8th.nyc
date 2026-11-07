// Shared between the build (server render) and the browser (client takeover),
// so it may only import 'kensington'.
import { t, signal } from 'kensington';

const NONE = 'none';

function groupItems(items, dimension) {
  if (!dimension) {
    return [{ key: NONE, label: 'All items', items }];
  }
  return dimension.values
    .map(value => ({
      key: `${dimension.key}-${value.key}`,
      label: value.label,
      items: items.filter(item => item.tags[dimension.key]?.includes(value.key)),
    }))
    .filter(group => group.items.length > 0);
}

function tagList(item, dimensions, groupKey) {
  return t.ul({ class: 'tags' }, dimensions
    .filter(dimension => dimension.key !== groupKey)
    .flatMap(dimension => (item.tags[dimension.key] ?? []).map(valueKey => {
      const value = dimension.values.find(v => v.key === valueKey);
      return value.quiet ? null : t.li({ class: `tag tag-${dimension.key}`, title: dimension.label }, value.label);
    })));
}

function alsoIn(item, dimension, currentValueKey) {
  if (!dimension) {
    return null;
  }
  const others = (item.tags[dimension.key] ?? [])
    .filter(key => key !== currentValueKey)
    .map(key => dimension.values.find(v => v.key === key).label);
  return others.length > 0
    ? t.p({ class: 'also-in' }, `Also listed under ${others.join(', ')}`)
    : null;
}

function scopeItem(item, dimensions, dimension, valueKey) {
  return t.li({ class: 'scope-item' }, [
    t.p({ class: 'scope-text' }, item.text),
    item.note && t.p({ class: 'scope-note' }, item.note),
    item.link && t.p({ class: 'scope-link' },
      t.a({ href: item.link.href, target: '_blank', rel: 'noreferrer' }, `${item.link.label} ↗`)),
    alsoIn(item, dimension, valueKey),
    tagList(item, dimensions, dimension?.key),
  ]);
}

function groupList(items, dimensions, groupBy) {
  const dimension = dimensions.find(d => d.key === groupBy);
  const groups = groupItems(items, dimension);
  return t.div({ class: 'groups' }, groups.map(group => {
    const valueKey = dimension ? group.key.slice(dimension.key.length + 1) : null;
    return t.section({ class: 'group', ariaLabel: group.label }, [
      t.h2({ class: 'group-heading' }, [
        t.span(group.label),
        t.span({ class: 'group-count' }, `${group.items.length}`),
      ]),
      t.ol({ class: 'scope-items' },
        group.items.map(item => scopeItem(item, dimensions, dimension, valueKey))),
    ]);
  }));
}

export function scopeList({ items, dimensions, groupBy: initialGroupBy = 'location' }) {
  const groupBy = signal(initialGroupBy);

  const options = [...dimensions.map(d => ({ key: d.key, label: d.label })), { key: NONE, label: 'None' }];
  return t.div({ class: 'scope' }, [
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
            onchange: () => groupBy.set(option.key),
          }),
          t.span(option.label),
        ]))),
      ]),
    ]),
    t.p({ class: 'item-total' }, `${items.length} items`),
    groupBy.transform(key => groupList(items, dimensions, key), 'group-list'),
  ]);
}
