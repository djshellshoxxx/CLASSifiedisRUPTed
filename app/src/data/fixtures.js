// Synthetic demo data only. No real users, prices, places or records.
const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 9, 27);

const seed = [
  ['Oak dining table', 'Seats six, minor scratches on one leg.', 'sell', 'home', 'good', 'Old Town', 14000],
  ['Bicycle, city model', 'Seven gears, new tyres last spring.', 'sell', 'tools', 'good', 'Harbour', 9500],
  ['Garden hose 20m', 'Barely used, no kinks.', 'giveaway', 'garden', 'like-new', 'Greenfield', 0],
  ['Wanted: espresso machine', 'Any working model under a reasonable price.', 'buy', 'home', 'fair', 'Northside', 15000],
  ['Paperback box set', 'Twelve novels, sci-fi, all readable.', 'sell', 'books', 'good', 'Riverside', 1200],
  ['Drill and bit set', 'Cordless, two batteries included.', 'trade', 'tools', 'like-new', 'Riverside', 0],
  ['Winter coat, size M', 'Warm, waterproof, worn twice.', 'sell', 'clothing', 'like-new', 'Old Town', 4500],
  ['Laptop stand', 'Aluminium, adjustable height.', 'sell', 'electronics', 'new', 'Northside', 2200],
  ['Hedge trimming help', 'Two hours on a Saturday, tools provided.', 'buy', 'services', 'new', 'Greenfield', 4000],
  ['Desk lamp', 'LED, three brightness levels.', 'giveaway', 'electronics', 'good', 'Harbour', 0],
  ['Kids bookshelf', 'Pine, painted white, assembled.', 'sell', 'home', 'good', 'Riverside', 3000],
  ['Vinyl records, 25 pieces', 'Mostly jazz and 70s rock.', 'trade', 'books', 'good', 'Old Town', 0],
  ['Pressure washer', 'Electric, 1800 W, works well.', 'sell', 'tools', 'good', 'Northside', 8000],
  ['Tent for two', 'Three seasons, packed with pegs.', 'sell', 'garden', 'good', 'Greenfield', 6000],
  ['Bike repair lessons', 'Basic maintenance, one hour, bring your bike.', 'sell', 'services', 'new', 'Harbour', 2500],
  ['Wool sweater set', 'Two sweaters, grey and navy.', 'giveaway', 'clothing', 'fair', 'Riverside', 0],
  ['Smart speaker', 'Previous generation, works with any music app.', 'sell', 'electronics', 'good', 'Old Town', 3500],
  ['Wanted: wheelbarrow', 'Looking for one to borrow or buy.', 'buy', 'garden', 'fair', 'Northside', 2000],
];

export const LISTINGS = seed.map(([title, description, kind, category, condition, region, priceMinor], index) => ({
  id: `demo-${String(index + 1).padStart(3, '0')}`,
  title,
  description,
  kind,
  category,
  condition,
  region,
  priceMinor,
  currency: 'EUR',
  createdAt: NOW - index * DAY,
  seller: index % 3 === 0 ? 'demo-user' : `demo-seller-${(index % 4) + 1}`,
}));

export const DEMO_USER = {
  id: 'demo-user',
  displayName: 'Demo user',
  note: 'Synthetic profile. No sign-in exists in this framework build.',
  region: 'Riverside',
};

// Read-only barter fixtures. No matching, consent or settlement logic is implied.
export const BARTER_OFFERS = [
  { id: 'offer-1', from: 'demo-user', offered: 'Drill and bit set', wanted: 'Bicycle, city model', status: 'pending' },
  { id: 'offer-2', from: 'demo-seller-2', offered: 'Vinyl records, 25 pieces', wanted: 'Smart speaker', status: 'pending' },
  { id: 'offer-3', from: 'demo-seller-3', offered: 'Paperback box set', wanted: 'Laptop stand', status: 'declined' },
];

export const BARTER_CYCLES = [
  {
    id: 'cycle-demo-1',
    participants: ['demo-user', 'demo-seller-2', 'demo-seller-3'],
    status: 'simulated',
    note: 'Illustrative fixture only. Cycle matching is not implemented.',
  },
];
