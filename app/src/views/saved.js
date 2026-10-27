import { h, clear, emptyState, announce } from '../lib/dom.js';
import { listingCard } from './cards.js';

export function renderSaved(root, { listings, saved, onSavedChange }) {
  clear(root);
  const ids = saved.list();
  const items = ids.map((id) => listings.get(id)).filter(Boolean);

  // The heading is focusable so focus has a stable target after the pressed card is removed.
  root.append(h('header', { class: 'page-head' }, h('h1', { tabindex: '-1' }, 'Saved listings'), h('p', { class: 'muted' }, 'Stored in this browser only.')));

  if (items.length === 0) {
    root.append(emptyState('Nothing saved yet.', h('a', { class: 'btn', href: '#/' }, 'Browse listings')));
    return;
  }

  root.append(
    h(
      'ul',
      { class: 'card-grid' },
      items.map((item) =>
        h('li', {}, listingCard(item, {
          isSaved: true,
          onToggleSave: (id) => {
            saved.unsave(id);
            announce('Listing removed from saved.');
            onSavedChange?.(id);
            renderSaved(root, { listings, saved, onSavedChange });
            // The card that held focus was removed by the re-render. Move focus to the empty-state link or the heading.
            (root.querySelector('.state-empty a') ?? root.querySelector('h1'))?.focus();
          },
        })),
      ),
    ),
  );
}
