// Local editor for docs-src/renovation/items.js: the public grouped list, with
// a pencil on each card that turns it into a form. Loads and saves through the
// dev server's /renovation/api/items endpoint.
import { t, signal, computed } from 'kensington';
import { DEFAULT_GROUPING, scopeItem, scopeView } from '../scope-list.js';
import { initializeScopeNavigation, readGrouping, writeGrouping } from '../grouping-url.js';

const API = '/renovation/api/items';
const NEW_ITEM_TAGS = { supply: ['contractor'], area: ['basement'], setting: ['interior'] };
const PENCIL = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';

const root = document.getElementById('editor');

async function load() {
  const response = await fetch(API);
  if (!response.ok) throw new Error(`Could not load items (${response.status})`);
  return response.json();
}

function nextId(items) {
  const max = Math.max(0, ...items.map(item => Number(/(\d+)$/.exec(item.id)?.[1] ?? 0)));
  return `item-${max + 1}`;
}

function focusEditor(id) {
  // Wait for the list to re-render before focusing.
  setTimeout(() => {
    const field = root.querySelector(`.edit-item[data-id="${id}"] .item-text`);
    field?.scrollIntoView({ block: 'center' });
    field?.focus();
  });
}

function editor({ items: initialItems, dimensions, downloads, revision: initialRevision }) {
  // Items are edited in place. `version` re-renders the list only when its
  // structure changes (close a card, add, delete, move, save), so typing never
  // loses focus. Open cards survive re-renders because `editing` and the item
  // objects hold their state.
  let items = initialItems;
  let revision = initialRevision;
  const editing = new Set();
  const version = signal(0);
  const dirty = signal(false);
  const saving = signal(false);
  const status = signal('');
  const errors = signal([]);

  const rerender = () => version.set(v => v + 1);
  const markDirty = () => {
    dirty.set(true);
    status.set('Unsaved changes');
  };

  const openItem = (item, context, event) => {
    editing.add(item.id);
    event.currentTarget.closest('li').replaceWith(editCard(item, context).toElement());
    focusEditor(item.id);
  };

  const closeItem = item => {
    editing.delete(item.id);
    rerender();
  };

  // Moves within the current group by swapping places with the neighbour.
  const moveItem = (item, groupItems, offset) => {
    const neighbour = groupItems[groupItems.indexOf(item) + offset];
    if (!neighbour) return;
    const next = [...items];
    const a = next.indexOf(item);
    const b = next.indexOf(neighbour);
    [next[a], next[b]] = [next[b], next[a]];
    items = next;
    markDirty();
    rerender();
    focusEditor(item.id);
  };

  const deleteItem = item => {
    if (!confirm(`Delete "${item.text || 'untitled item'}"?`)) return;
    items = items.filter(i => i !== item);
    editing.delete(item.id);
    markDirty();
    rerender();
  };

  const addItem = () => {
    const tags = Object.fromEntries(dimensions.map(d => [d.key, [...(NEW_ITEM_TAGS[d.key] ?? [])]]));
    const item = { id: nextId(items), text: '', note: null, links: [], tags };
    items = [...items, item];
    editing.add(item.id);
    markDirty();
    rerender();
    focusEditor(item.id);
  };

  const save = async () => {
    if (saving.get()) return;
    saving.set(true);
    status.set('Saving…');
    errors.set([]);
    try {
      const response = await fetch(API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, revision }),
      });
      const body = await response.json();
      if (!response.ok) {
        errors.set(body.errors ?? ['Save failed']);
        status.set('Not saved');
        return;
      }
      items = body.items;
      revision = body.revision;
      editing.clear();
      dirty.set(false);
      status.set('Saved to items.js. Commit and push to deploy.');
      rerender();
    } catch (error) {
      errors.set([error.message]);
      status.set('Not saved');
    } finally {
      saving.set(false);
    }
  };

  const textField = (label, value, onInput, options = {}) => t.label({ class: 'field' }, [
    t.span({ class: 'field-label' }, label),
    options.multiline
      ? t.textarea({ rows: 2, oninput: e => onInput(e.target.value) }, value ?? '')
      : t.input({
        type: options.type ?? 'text',
        class: options.class,
        value: value ?? '',
        placeholder: options.placeholder ?? '',
        oninput: e => onInput(e.target.value),
      }),
  ]);

  let tagFieldId = 0;
  const tagField = (item, dimension) => {
    const name = `tag-field-${++tagFieldId}`;
    const selected = item.tags[dimension.key];
    return t.fieldset({ class: selected.length === 0 ? 'tag-field missing' : 'tag-field' }, [
      t.legend(dimension.label),
      t.div({ class: 'chips' }, dimension.values.map(value => t.label({ class: 'chip' }, [
        t.input({
          type: dimension.exclusive ? 'radio' : 'checkbox',
          name: dimension.exclusive ? name : undefined,
          checked: selected.includes(value.key),
          onchange: event => {
            const list = item.tags[dimension.key];
            item.tags[dimension.key] = dimension.exclusive
              ? [value.key]
              : event.target.checked
                ? [...list, value.key]
                : list.filter(key => key !== value.key);
            event.target.closest('fieldset')
              .classList.toggle('missing', item.tags[dimension.key].length === 0);
            markDirty();
          },
        }),
        t.span(value.label),
      ]))),
    ]);
  };

  const editCard = (item, context) => {
    const index = context.groupItems.indexOf(item);
    const setLink = (link, field, value) => {
      link[field] = value;
      markDirty();
    };
    return t.li({ class: 'scope-item edit-item', 'data-id': item.id }, [
      t.div({ class: 'edit-item-bar' }, [
        t.span({ class: 'edit-item-id' }, item.id),
        t.div({ class: 'edit-item-actions' }, [
          t.button({ type: 'button', title: 'Move up in this group', disabled: index <= 0, onclick: () => moveItem(item, context.groupItems, -1) }, '↑'),
          t.button({ type: 'button', title: 'Move down in this group', disabled: index === context.groupItems.length - 1, onclick: () => moveItem(item, context.groupItems, 1) }, '↓'),
          t.button({ type: 'button', class: 'danger', onclick: () => deleteItem(item) }, 'Delete'),
          t.button({ type: 'button', onclick: () => closeItem(item) }, 'Done'),
        ]),
      ]),
      textField('Item', item.text, value => { item.text = value; markDirty(); }, { class: 'item-text' }),
      textField('Note', item.note, value => { item.note = value; markDirty(); }, { multiline: true }),
      (item.links ?? []).map((link, linkIndex) => t.div({ class: 'link-fields' }, [
        t.div({ class: 'field-row' }, [
          textField(`Link ${linkIndex + 1} URL`, link.href, value => setLink(link, 'href', value), { type: 'url', placeholder: 'https://' }),
          textField(`Link ${linkIndex + 1} label`, link.label, value => setLink(link, 'label', value)),
        ]),
        t.button({ type: 'button', onclick: () => {
          item.links.splice(linkIndex, 1);
          markDirty();
          rerender();
        } }, 'Remove link'),
      ])),
      t.div(t.button({ type: 'button', onclick: () => {
        item.links = [...(item.links ?? []), { href: '', label: '' }];
        markDirty();
        rerender();
      } }, 'Add link')),
      t.div({ class: 'tag-fields' }, dimensions.map(dimension => tagField(item, dimension))),
    ]);
  };

  const renderItem = (item, context) => (editing.has(item.id)
    ? editCard(item, context)
    : scopeItem(item, context, t.button({
      type: 'button',
      class: 'edit-button',
      title: 'Edit item',
      ariaLabel: `Edit "${item.text}"`,
      onclick: event => openItem(item, context, event),
    }, t.literal(PENCIL))));

  window.addEventListener('beforeunload', event => {
    if (dirty.get()) event.preventDefault();
  });
  window.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key === 's') {
      event.preventDefault();
      save();
    }
  });

  const actions = [
    t.div({ class: 'editor-actions' }, [
      t.span({ class: 'editor-status', role: 'status' }, status),
      t.a({ href: '/renovation/', target: '_blank' }, 'View page ↗'),
      t.button({ type: 'button', onclick: addItem }, 'Add item'),
      t.button({
        type: 'button',
        class: 'primary',
        disabled: computed(() => !dirty.get() || saving.get()),
        onclick: save,
      }, computed(() => (saving.get() ? 'Saving…' : dirty.get() ? 'Save' : 'Saved'))),
    ]),
    errors.transform(list => (list.length === 0 ? null : t.div({ class: 'editor-errors', role: 'alert' }, [
      t.strong('Fix these before saving:'),
      t.ul(list.map(message => t.li(message))),
    ])), 'errors'),
  ];

  const grouping = readGrouping(dimensions, DEFAULT_GROUPING);
  return t.div({ class: 'editor' }, scopeView({
    dimensions,
    initialGroupBy: grouping.groupBy,
    initialThenBy: grouping.thenBy,
    onGroupingChange: next => writeGrouping(next, DEFAULT_GROUPING),
    getItems: () => items,
    version,
    renderItem,
    actions,
    downloads,
  }));
}

try {
  const data = await load();
  root.replaceChildren(editor(data).toElement());
  initializeScopeNavigation();
} catch (error) {
  root.replaceChildren(t.p({ class: 'editor-errors' }, error.message).toElement());
}
