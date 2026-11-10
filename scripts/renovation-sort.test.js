import assert from 'node:assert/strict';
import test from 'node:test';
import { t } from 'kensington';
import { dimensions } from '../docs-src/renovation/dimensions.js';
import { createItemComparator, scopeView } from '../docs-src/renovation/scope-list.js';

const compare = createItemComparator(dimensions);
const priorities = [
  ['phase', 'demo', 'finish'],
  ['area', 'basement', 'upstairs'],
  ['setting', 'interior', 'exterior'],
  // Label order differs from both key order and dimension order.
  ['location', 'halfBath', 'bedroom'],
  ['trade', 'carpentry', 'demolition'],
  ['supply', 'contractor', 'owner'],
];
const item = (id, overrides = {}) => ({
  id, text: id,
  tags: { ...Object.fromEntries(priorities.map(([key, first]) => [key, [first]])), ...overrides },
});

test('each criterion takes precedence over every later criterion', () => {
  priorities.forEach(([key, first, last], index) => {
    const later = priorities.slice(index + 1);
    const a = item('first', { [key]: [first], ...Object.fromEntries(later.map(([k, , v]) => [k, [v]])) });
    const b = item('last', { [key]: [last] });
    assert.ok(compare(a, b) < 0, key);
    assert.ok(compare(b, a) > 0, key);
  });
});

test('multiple tags use the earliest rank regardless of tag order; missing tags sort last', () => {
  assert.equal(compare(item('a', { phase: ['finish', 'demo'] }), item('b')), 0);
  assert.equal(compare(item('a', { location: ['bedroom', 'halfBath'] }), item('b')), 0);
  assert.ok(compare(item('a'), item('b', { phase: [] })) < 0);
  const tied = [item('b'), item('a')];
  assert.deepEqual([...tied].sort(compare).map(i => i.id), ['b', 'a']);
});

test('rendered groups, subgroups, and ungrouped lists all receive sorted items without mutating source', () => {
  for (const [groupBy, thenBy] of [['none', 'none'], ['area', 'none'], ['area', 'location']]) {
    const source = [item('late', { phase: ['finish'] }), item('early')];
    const rendered = [];
    scopeView({
      dimensions, initialGroupBy: groupBy, initialThenBy: thenBy,
      getItems: () => source,
      renderItem: (entry, context) => {
        rendered.push(entry.id);
        assert.deepEqual(context.groupItems.map(i => i.id), ['early', 'late']);
        return t.li(entry.text);
      },
    }).toString();
    assert.deepEqual(rendered, ['early', 'late']);
    assert.deepEqual(source.map(i => i.id), ['late', 'early']);
  }
});
