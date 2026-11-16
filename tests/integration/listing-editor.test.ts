import { expect, it } from 'vitest';
import { uuidv7 } from '../../packages/kernel/src/index.ts';
import { listingEditInput, type EditableListing } from '../../apps/pwa/src/listing-editor.ts';

const row: EditableListing = { id: 'listing', revision: 7, data: { title: 'Original', description: 'Original text', ownerId: 'did:key:owner', kind: 'sell',
  status: 'unpublished', onHand: 1, condition: 'good', categoryId: uuidv7().parse('0195aaaa-0000-7000-8000-000000000001'), tags: ['Music'], locale: 'fr-CA', regionCell: 'c2b2', barterOptIn: false,
  privateNotes: 'Private detail', value: { currency: 'EUR', amount: '900719925474099301' } } };
function form() {
  const data = new FormData();
  for (const [key, value] of Object.entries({ title: 'Edited', description: 'Updated public text', condition: 'fair', region: 'c2b2q', amount: '900719925474099302', notes: 'Private edit', barter: 'on' })) data.set(key, value);
  return data;
}
it('preserves exact currency amounts, revision, tags and locale without copying derived ownership fields', () => {
  const input = listingEditInput(row, form());
  expect(input).toEqual({ listingId: 'listing', expectedRevision: 7, title: 'Edited', description: 'Updated public text', condition: 'fair', regionCell: 'c2b2q',
    value: { currency: 'EUR', amount: '900719925474099302' }, privateNotes: 'Private edit', barterOptIn: true, categoryId: row.data.categoryId, tags: ['Music'], locale: 'fr-CA' });
  expect(row.data.value?.amount).toBe('900719925474099301');
});
it('rejects missing, negative, rounded or formatted monetary input', () => {
  for (const amount of ['', '-1', '1.5', '1e3', '1,000', '00', 'Infinity']) {
    const data = form(); data.set('amount', amount);
    expect(() => listingEditInput(row, data)).toThrow();
  }
});

it('edits a wanted draft without forcing disclosure of absent optional fields', () => {
  const { condition: _condition, value: _value, regionCell: _region, ...data } = row.data;
  const draft = { ...row, data: { ...data, status: 'draft' as const, kind: 'wanted' as const } };
  const input = form(); input.set('amount', ''); input.set('region', ''); input.set('condition', '');
  const edit = listingEditInput(draft, input);
  expect(edit.title).toBe('Edited');
  expect(edit).not.toHaveProperty('regionCell');
  expect(edit).not.toHaveProperty('value');
  expect(edit).not.toHaveProperty('condition');
  for (const name of ['region', 'condition']) {
    const missing = form(); missing.set(name, '');
    expect(() => listingEditInput(row, missing)).toThrow();
  }
});
