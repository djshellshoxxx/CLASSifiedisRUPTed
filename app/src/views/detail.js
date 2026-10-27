import { h, clear, errorState } from '../lib/dom.js';
import { KIND_LABELS, priceLabel } from './cards.js';
import { announce } from '../lib/dom.js';

export function renderDetail(root, { id, listings, saved, onSavedChange }) {
  const item = listings.get(id);
  clear(root);
  if (!item) {
    root.append(
      errorState('This listing does not exist in the demo data.'),
      h('a', { class: 'btn', href: '#/' }, 'Back to browse'),
    );
    return;
  }

  const saveBtn = h('button', { type: 'button', class: 'btn', 'aria-pressed': 'false' });
  const paintSave = () => {
    const isSaved = saved.has(item.id);
    saveBtn.setAttribute('aria-pressed', String(isSaved));
    saveBtn.textContent = isSaved ? 'Remove from saved' : 'Save listing';
  };
  saveBtn.addEventListener('click', () => {
    const nowSaved = saved.toggle(item.id);
    paintSave();
    onSavedChange?.(item.id);
    announce(nowSaved ? 'Listing saved.' : 'Listing removed from saved.');
  });
  paintSave();

  root.append(
    h('p', {}, h('a', { href: '#/' }, '← Back to browse')),
    h(
      'article',
      { class: 'detail' },
      h('div', { class: 'card-tag' }, KIND_LABELS[item.kind]),
      h('h1', {}, item.title),
      h('p', { class: 'price' }, priceLabel(item)),
      h(
        'dl',
        { class: 'facts' },
        h('dt', {}, 'Category'), h('dd', {}, item.category),
        h('dt', {}, 'Condition'), h('dd', {}, item.condition),
        h('dt', {}, 'Area'), h('dd', {}, item.region),
        h('dt', {}, 'Seller'), h('dd', {}, item.seller === 'demo-user' ? 'You (demo)' : item.seller),
      ),
      h('p', {}, item.description || 'No description provided.'),
      h('div', { class: 'card-actions' }, saveBtn, h('button', { type: 'button', class: 'btn', onClick: () => announce('Demo only: messaging is not implemented, nothing was sent.') }, 'Message seller (demo)')),
      h('p', { class: 'muted small' }, 'Messaging is simulated. No contact details or exact addresses are exchanged.'),
    ),
  );
}
