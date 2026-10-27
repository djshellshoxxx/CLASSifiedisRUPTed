import { h, clear, emptyState } from '../lib/dom.js';
import { DEMO_USER } from '../data/fixtures.js';
import { listingCard } from './cards.js';

export function renderAccount(root, { listings, saved }) {
  clear(root);
  const mine = listings.list().filter((item) => item.seller === DEMO_USER.id);

  root.append(
    h('header', { class: 'page-head' }, h('h1', {}, 'Your account (demo)')),
    h(
      'section',
      { class: 'panel', 'aria-labelledby': 'profile-heading' },
      h('h2', { id: 'profile-heading' }, 'Profile'),
      h('dl', { class: 'facts' },
        h('dt', {}, 'Name'), h('dd', {}, DEMO_USER.displayName),
        h('dt', {}, 'Coarse area'), h('dd', {}, DEMO_USER.region),
        h('dt', {}, 'Saved listings'), h('dd', {}, String(saved.list().length)),
        h('dt', {}, 'Your listings'), h('dd', {}, String(mine.length)),
      ),
      h('p', { class: 'muted small' }, DEMO_USER.note),
    ),
    h('section', { class: 'panel', 'aria-labelledby': 'mine-heading' }, h('h2', { id: 'mine-heading' }, 'Your listings')),
  );

  const section = root.lastElementChild;
  if (mine.length === 0) {
    section.append(emptyState('You have no listings yet.', h('a', { class: 'btn', href: '#/sell' }, 'Create a listing')));
  } else {
    section.append(h('ul', { class: 'card-grid' }, mine.map((item) => h('li', {}, listingCard(item, { isSaved: saved.has(item.id), onToggleSave: () => {} })))));
  }
}
