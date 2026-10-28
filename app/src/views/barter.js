import { h, clear, emptyState } from '../lib/dom.js';
import { BARTER_OFFERS, BARTER_CYCLES } from '../data/fixtures.js';

const STATUS = { pending: 'Pending', declined: 'Declined', simulated: 'Illustrative' };

// Read-only presentation. No matching, consent, expiry or settlement behaviour exists here.
export function renderBarter(root, { listings }) {
  clear(root);
  const nameOf = (id) => listings.get(id)?.title ?? id;

  root.append(
    h('header', { class: 'page-head' }, h('h1', {}, 'Barter (read-only demo)'), h('p', { class: 'muted' }, 'Fixture offers only. Nothing here can be accepted, countered or executed.')),
    h(
      'section',
      { class: 'panel' },
      h('h2', { id: 'offers-heading' }, 'Trade offers'),
      BARTER_OFFERS.length
        ? h(
            'div',
            { class: 'table-scroll', tabindex: '0', role: 'region', 'aria-labelledby': 'offers-heading' },
            h(
              'table',
              { class: 'table' },
              h('caption', { class: 'sr-only' }, 'Demo trade offers, read-only'),
              h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'Offered'), h('th', { scope: 'col' }, 'Wanted'), h('th', { scope: 'col' }, 'Status'))),
              h('tbody', {}, BARTER_OFFERS.map((offer) => h('tr', {}, h('td', {}, nameOf(offer.offered)), h('td', {}, nameOf(offer.wanted)), h('td', {}, STATUS[offer.status] ?? offer.status)))),
            ),
          )
        : emptyState('No offers in the demo data.'),
    ),
    h(
      'section',
      { class: 'panel', 'aria-labelledby': 'cycles-heading' },
      h('h2', { id: 'cycles-heading' }, 'Multi-party cycles'),
      ...BARTER_CYCLES.map((cycle) =>
        h('article', { class: 'cycle' },
          h('p', {}, h('strong', {}, `${cycle.participants.length} participants`), ` · ${STATUS[cycle.status] ?? cycle.status}`),
          h('p', { class: 'muted small' }, cycle.note),
        ),
      ),
    ),
  );
}
