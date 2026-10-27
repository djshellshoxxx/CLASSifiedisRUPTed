import { h } from '../lib/dom.js';
import { formatMinor } from '../lib/money.js';

export const KIND_LABELS = { sell: 'For sale', buy: 'Wanted', giveaway: 'Free', trade: 'Barter' };

export function priceLabel(item) {
  if (item.kind === 'giveaway') return 'Free';
  if (item.kind === 'trade') return 'Barter';
  return formatMinor(item.priceMinor, item.currency);
}

export function listingCard(item, { isSaved, onToggleSave }) {
  const saveButton = h(
    'button',
    {
      type: 'button',
      class: 'btn btn-small',
      'aria-pressed': String(isSaved),
      'aria-label': `${isSaved ? 'Unsave' : 'Save'} ${item.title}`,
      onClick: () => onToggleSave(item.id),
    },
    isSaved ? 'Saved' : 'Save',
  );
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
