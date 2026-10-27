import { h, clear, emptyState, announce } from '../lib/dom.js';
import { CATEGORIES, KINDS, SORTS, filterListings, sortListings, paginate } from '../domain/listings.js';
import { parseMinor } from '../lib/money.js';
import { listingCard } from './cards.js';

const SORT_LABELS = { newest: 'Newest first', 'price-asc': 'Price: low to high', 'price-desc': 'Price: high to low' };

export function renderBrowse(root, { listings, saved, onSavedChange }) {
  const state = { query: '', category: '', kind: '', maxPrice: '', sort: 'newest', page: 1 };

  const field = (label, control) => h('label', { class: 'field' }, h('span', {}, label), control);
  const select = (name, options, labelFor) =>
    h(
      'select',
      {
        name,
        onChange: (event) => {
          state[name] = event.target.value;
          state.page = 1;
          draw();
        },
      },
      options.map((value) => h('option', { value }, labelFor(value))),
    );

  const form = h(
    'form',
    {
      class: 'filters',
      role: 'search',
      'aria-label': 'Search and filter listings',
      onSubmit: (event) => event.preventDefault(),
    },
    field(
      'Search',
      h('input', {
        type: 'search',
        name: 'query',
        placeholder: 'e.g. bicycle',
        onInput: (event) => {
          state.query = event.target.value;
          state.page = 1;
          draw();
        },
      }),
    ),
    field('Category', select('category', ['', ...CATEGORIES], (value) => value || 'All categories')),
    field('Kind', select('kind', ['', ...KINDS], (value) => (value ? value[0].toUpperCase() + value.slice(1) : 'All kinds'))),
    field(
      'Max price (EUR)',
      h('input', {
        type: 'text',
        inputmode: 'decimal',
        name: 'maxPrice',
        placeholder: 'Any',
        onInput: (event) => {
          state.maxPrice = event.target.value;
          state.page = 1;
          draw();
        },
      }),
    ),
    field('Sort', select('sort', SORTS, (value) => SORT_LABELS[value])),
  );

  const summary = h('p', { class: 'results-summary', 'aria-live': 'polite' });
  // Focus target after paging. Only Next and Previous move focus here, never filter or search input.
  const results = h('div', { class: 'results', role: 'region', 'aria-label': 'Listing results', tabindex: '-1' });
  const pager = h('nav', { class: 'pager', 'aria-label': 'Pagination' });

  root.replaceChildren(
    h('header', { class: 'page-head' }, h('h1', {}, 'Browse listings'), h('p', { class: 'muted' }, 'Synthetic demo data. Exact addresses are never shown.')),
    form,
    summary,
    results,
    pager,
  );

  function draw() {
    const maxMinor = state.maxPrice.trim() === '' ? null : parseMinor(state.maxPrice);
    const invalidPrice = state.maxPrice.trim() !== '' && maxMinor === null;

    const filtered = invalidPrice
      ? []
      : filterListings(listings, {
          query: state.query,
          category: state.category,
          kind: state.kind,
          maxPriceMinor: maxMinor,
        });
    const page = paginate(sortListings(filtered, state.sort), state.page);
    state.page = page.page;

    summary.textContent = invalidPrice
      ? 'Enter a max price such as 50 or 49.90.'
      : `${page.total} listing${page.total === 1 ? '' : 's'} found`;

    clear(results);
    if (invalidPrice) {
      results.append(emptyState('Max price is not a valid amount, so no results are shown.'));
    } else if (page.total === 0) {
      results.append(
        emptyState(
          'No listings match these filters.',
          h('button', { type: 'button', class: 'btn', onClick: resetFilters }, 'Clear filters'),
        ),
      );
    } else {
      results.append(
        h(
          'ul',
          { class: 'card-grid' },
          page.items.map((item) =>
            h('li', {}, listingCard(item, { isSaved: saved.has(item.id), onToggleSave: toggleSave })),
          ),
        ),
      );
    }

    clear(pager);
    if (page.pageCount > 1) {
      pager.append(
        h('button', { type: 'button', class: 'btn', disabled: page.page === 1, onClick: () => goTo(page.page - 1) }, 'Previous'),
        h('span', { class: 'muted', 'aria-current': 'page' }, `Page ${page.page} of ${page.pageCount}`),
        h('button', { type: 'button', class: 'btn', disabled: page.page === page.pageCount, onClick: () => goTo(page.page + 1) }, 'Next'),
      );
    }
    return page;
  }

  function goTo(page) {
    state.page = page;
    const current = draw();
    // The pressed pager button is re-rendered away, so move focus to the results before it is lost.
    results.focus();
    announce(`Page ${current.page} of ${current.pageCount}`);
  }

  function resetFilters() {
    Object.assign(state, { query: '', category: '', kind: '', maxPrice: '', sort: 'newest', page: 1 });
    form.reset();
    draw();
    // The Clear filters button sits in the empty state that draw() just removed, so move focus to the results.
    results.focus();
  }

  function toggleSave(id) {
    const nowSaved = saved.toggle(id);
    onSavedChange?.(id);
    draw();
    // draw() rebuilt every card, so the pressed Save button is new. Focus the one for this listing, if it is still shown.
    const button = [...results.querySelectorAll('button[data-listing-id]')].find((node) => node.dataset.listingId === id);
    if (button) button.focus();
    else results.focus();
    const title = listings.find((item) => item.id === id)?.title ?? 'this listing';
    announce(nowSaved ? `Listing saved: ${title}.` : `Listing removed from saved: ${title}.`);
  }

  draw();
  return { refresh: draw };
}

