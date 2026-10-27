import { h } from '../lib/dom.js';
import { formatMinor } from '../lib/money.js';

export const KIND_LABELS = { sell: 'For sale', buy: 'Wanted', giveaway: 'Free', trade: 'Barter' };

export function priceLabel(item) {
  if (item.kind === 'giveaway') return 'Free';
  if (item.kind === 'trade') return 'Barter';
  return formatMinor(item.priceMinor, item.currency);
}

// Sets aria-pressed, aria-label and text together so every view paints the save state the same way.
export function paintSaveButton(button, title, isSaved) {
  button.setAttribute('aria-pressed', String(isSaved));
  button.setAttribute('aria-label', `${isSaved ? 'Unsave' : 'Save'} ${title}`);
  button.textContent = isSaved ? 'Saved' : 'Save';
  return button;
}

// onToggleSave receives the listing id and the button that was pressed.
export function listingCard(item, { isSaved, onToggleSave }) {
  const saveButton = h('button', {
    type: 'button',
    class: 'btn btn-small',
    onClick: () => onToggleSave(item.id, saveButton),
  });
  paintSaveButton(saveButton, item.title, isSaved);
  return h(
    'article',
    { class: 'card' },
    h('div', { class: 'card-tag' }, KIND_LABELS[item.kind]),
    h('h3', {}, h('a', { href: `#/listing/${item.id}` }, item.title)),
    h('p', { class: 'price' }, priceLabel(item)),
    h('p', { class: 'muted' }, `${item.region} · ${item.condition}`),
    h('div', { class: 'card-actions' }, saveButton),
  );
}
