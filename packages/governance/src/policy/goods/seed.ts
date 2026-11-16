// Bundled seed taxonomy data: 12 top-level groups with a few children each, with deterministic ids.
// It is unsigned data; a publisher vault signs it as a taxonomy pack (see NOTES.md).
import type { PackEntry } from './model.ts';

const GROUPS: readonly (readonly [string, string, readonly (readonly [string, string])[]])[] = [
  ['electronics', 'Electronics', [['phones', 'Phones'], ['computers', 'Computers'], ['audio', 'Audio'], ['cameras', 'Cameras']]],
  ['home_garden', 'Home and garden', [['furniture', 'Furniture'], ['kitchen', 'Kitchen'], ['garden_tools', 'Garden tools'], ['lighting', 'Lighting']]],
  ['clothing', 'Clothing and accessories', [['womens_clothing', "Women's clothing"], ['mens_clothing', "Men's clothing"], ['shoes', 'Shoes'], ['bags', 'Bags']]],
  ['sports', 'Sports and outdoors', [['bikes', 'Bikes'], ['camping', 'Camping'], ['fitness', 'Fitness'], ['water_sports', 'Water sports']]],
  ['vehicles', 'Vehicles and parts', [['cars', 'Cars'], ['motorcycles', 'Motorcycles'], ['car_parts', 'Car parts'], ['trailers', 'Trailers']]],
  ['family', 'Family and kids', [['toys', 'Toys'], ['baby_gear', 'Baby gear'], ['kids_clothing', "Kids' clothing"], ['school', 'School supplies']]],
  ['books_media', 'Books and media', [['books', 'Books'], ['music', 'Music'], ['films', 'Films'], ['games', 'Games']]],
  ['tools', 'Tools and equipment', [['power_tools', 'Power tools'], ['hand_tools', 'Hand tools'], ['workshop', 'Workshop'], ['building', 'Building materials']]],
  ['hobbies', 'Hobbies and collectibles', [['collectibles', 'Collectibles'], ['crafts', 'Crafts'], ['instruments', 'Musical instruments'], ['art', 'Art']]],
  ['pets', 'Pets and animal supplies', [['pet_supplies', 'Pet supplies'], ['aquariums', 'Aquariums'], ['pet_beds', 'Pet beds'], ['pet_travel', 'Pet travel']]],
  ['health', 'Health and personal care', [['health_devices', 'Health devices'], ['beauty', 'Beauty'], ['mobility', 'Mobility aids'], ['wellness', 'Wellness']]],
  ['other', 'Everything else', [['free_stuff', 'Free stuff'], ['antiques', 'Antiques'], ['office', 'Office'], ['miscellaneous', 'Miscellaneous']]],
];

const idFor = (n: number): string => `0192f3a4-1111-7000-8000-${n.toString(16).padStart(12, '0')}`;

/** Deterministic entries: ids never change meaning between releases of the seed. `health_devices` is restricted (proposal-gated in later releases). */
export function seedTaxonomyEntries(): PackEntry[] {
  const out: PackEntry[] = [];
  let n = 0;
  for (const [i, [key, name, children]] of GROUPS.entries()) {
    n += 1;
    const groupId = idFor(n);
    out.push({ id: groupId, key, depth: 1, names: { en: name }, restricted: false, status: 'active', sortOrder: i });
    for (const [j, [childKey, childName]] of children.entries()) {
      n += 1;
      const restricted = childKey === 'health_devices';
      out.push({
        id: idFor(n), key: childKey, parentId: groupId, depth: 2, names: { en: childName }, restricted,
        ...(restricted ? { restrictedReasonKey: 'policy.restricted.health_devices' } : {}), status: 'active', sortOrder: j,
      });
    }
  }
  return out;
}
