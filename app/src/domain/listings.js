import { parseMinor } from '../lib/money.js';

export const KINDS = ['sell', 'buy', 'giveaway', 'trade'];
export const CATEGORIES = ['home', 'electronics', 'garden', 'clothing', 'books', 'tools', 'services'];
export const CONDITIONS = ['new', 'like-new', 'good', 'fair'];
export const REGIONS = ['Riverside', 'Old Town', 'Harbour', 'Northside', 'Greenfield'];
export const PAGE_SIZE = 6;
export const SORTS = ['newest', 'price-asc', 'price-desc'];

const TITLE_MIN = 3;
const TITLE_MAX = 80;
const DESCRIPTION_MAX = 1000;

export function validateListing(draft) {
  const errors = {};
  const title = String(draft.title ?? '').trim();
  const description = String(draft.description ?? '').trim();

  if (title.length < TITLE_MIN) errors.title = `Title needs at least ${TITLE_MIN} characters.`;
  else if (title.length > TITLE_MAX) errors.title = `Title can be at most ${TITLE_MAX} characters.`;

  if (description.length > DESCRIPTION_MAX) {
    errors.description = `Description can be at most ${DESCRIPTION_MAX} characters.`;
  }

  if (!KINDS.includes(draft.kind)) errors.kind = 'Choose what kind of listing this is.';
  if (!CATEGORIES.includes(draft.category)) errors.category = 'Choose a category.';
  if (!CONDITIONS.includes(draft.condition)) errors.condition = 'Choose a condition.';
  if (!REGIONS.includes(draft.region)) errors.region = 'Choose a coarse area. Exact addresses are never shown.';

  if (draft.kind === 'giveaway' || draft.kind === 'trade') {
    // Free or barter listings carry no asking price.
  } else if (parseMinor(draft.price) === null) {
    errors.price = 'Enter a price such as 12 or 12.50.';
  }

  return errors;
}

export function toListingRecord(draft, { id, now }) {
  const free = draft.kind === 'giveaway' || draft.kind === 'trade';
  return {
    id,
    title: String(draft.title).trim(),
    description: String(draft.description ?? '').trim(),
    kind: draft.kind,
    category: draft.category,
    condition: draft.condition,
    region: draft.region,
    priceMinor: free ? 0 : parseMinor(draft.price),
    currency: 'EUR',
    createdAt: now,
    seller: 'demo-user',
  };
}

export function filterListings(listings, { query = '', category = '', kind = '', maxPriceMinor = null } = {}) {
  const needle = query.trim().toLowerCase();
  return listings.filter((item) => {
    if (needle && !`${item.title} ${item.description}`.toLowerCase().includes(needle)) return false;
    if (category && item.category !== category) return false;
    if (kind && item.kind !== kind) return false;
    if (maxPriceMinor !== null && item.priceMinor > maxPriceMinor) return false;
    return true;
  });
}

export function sortListings(listings, sort = 'newest') {
  const copy = [...listings];
  if (sort === 'price-asc') return copy.sort((a, b) => a.priceMinor - b.priceMinor || b.createdAt - a.createdAt);
  if (sort === 'price-desc') return copy.sort((a, b) => b.priceMinor - a.priceMinor || b.createdAt - a.createdAt);
  return copy.sort((a, b) => b.createdAt - a.createdAt);
}

export function paginate(items, page = 1, pageSize = PAGE_SIZE) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), page: safePage, pageCount, total: items.length };
}
