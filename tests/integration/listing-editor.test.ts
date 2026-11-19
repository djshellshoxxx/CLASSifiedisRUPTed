import { afterEach, expect, it, vi } from 'vitest';
import { uuidv7 } from '../../packages/kernel/src/index.ts';
import { listingEditInput, mountListingEditor, type EditableListing } from '../../apps/pwa/src/listing-editor.ts';
import { NodeStub } from '../support/node-stub.ts';

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

it('requires explicit removal and never sends a replacement amount with the removal signal', () => {
  const data = form(); data.set('remove-value', 'on');
  const input = listingEditInput(row, data);
  expect(input).toHaveProperty('removeValue', true);
  expect(input).not.toHaveProperty('value');
  expect(row.data.value).toEqual({ currency: 'EUR', amount: '900719925474099301' });
  data.delete('amount');
  expect(listingEditInput(row, data)).toHaveProperty('removeValue', true);
  data.delete('remove-value');
  expect(() => listingEditInput(row, data)).toThrow('Enter the declared value');
});

it('treats zero as an exact replacement value, not a request to remove it', () => {
  const data = form(); data.set('amount', '0');
  const input = listingEditInput(row, data);
  expect(input).toHaveProperty('value', { currency: 'EUR', amount: '0' });
  expect(input).not.toHaveProperty('removeValue');
});

class EditorNode extends NodeStub {
  name = ''; required = false;
  get options() { return this.children as EditorNode[]; }
  override prepend(...children: unknown[]) {
    super.prepend(...children);
    for (const child of children) if (child instanceof NodeStub) child.parent = this;
  }
  focus() {}
  scrollIntoView() {}
  *descendants(): Generator<EditorNode> {
    for (const child of this.children) if (child instanceof EditorNode) { yield child; yield* child.descendants(); }
  }
  reset() { for (const child of this.descendants()) { child.value = ''; child.checked = false; } }
}
const NativeFormData = FormData;
afterEach(() => vi.unstubAllGlobals());

function mount() {
  const nodes: EditorNode[] = [];
  vi.stubGlobal('document', { createElement: (tag: string) => { const node = new EditorNode(tag); nodes.push(node); return node; } });
  vi.stubGlobal('FormData', class extends NativeFormData {
    constructor(element?: EditorNode) {
      super();
      if (element) for (const node of element.descendants()) {
        if (!node.name || node.disabled) continue;
        if (node.type === 'checkbox') { if (node.checked) this.set(node.name, 'on'); }
        else this.set(node.name, node.value);
      }
    }
  });
  const container = new EditorNode('section');
  const queued: Array<() => Promise<void>> = [];
  const command = vi.fn(async (_name: string, _input: unknown) => undefined);
  const saved = vi.fn(async () => undefined);
  const message = vi.fn();
  const ui = mountListingEditor({ container: container as unknown as HTMLElement, command, saved, message,
    action: async fn => { queued.push(fn); },
  });
  const field = (name: string) => nodes.find(node => node.name === name)!;
  const button = (label: string) => nodes.find(node => node.tag === 'button' && node.textContent === label)!;
  const submit = () => nodes.find(node => node.tag === 'form')!.fire('submit');
  const flush = async () => { for (const task of queued.splice(0)) await task(); };
  return { ui, nodes, container, command, saved, message, field, button, submit, flush };
}

it('lets the owner undo removal, cancel and reopen without losing the exact entered value', async () => {
  const f = mount(); f.ui.open(row);
  const remove = f.field('remove-value'); const amount = f.field('amount');
  expect(remove.checked).toBe(false); expect(amount.disabled).toBe(false); expect(amount.required).toBe(true);
  amount.value = '900719925474099302';
  remove.checked = true; remove.fire('change');
  expect(amount.disabled).toBe(true); expect(amount.required).toBe(false);
  expect(amount.value).toBe('900719925474099302');
  remove.checked = false; remove.fire('change');
  expect(amount.disabled).toBe(false); expect(amount.required).toBe(true);
  expect(amount.value).toBe('900719925474099302');
  remove.checked = true; remove.fire('change'); f.button('Cancel editing').click();
  expect(f.container.hidden).toBe(true); expect(f.command).not.toHaveBeenCalled();
  f.ui.open(row);
  expect(remove.checked).toBe(false); expect(amount.disabled).toBe(false);
  expect(amount.value).toBe('900719925474099301');
  expect(f.nodes.some(node => node.textContent.includes('Sale listings require a declared value before publication.'))).toBe(true);
  f.ui.destroy();
});

it('submits explicit removal once, and resets the control when opening a listing without a value', async () => {
  const f = mount(); f.ui.open(row);
  const remove = f.field('remove-value'); remove.checked = true; remove.fire('change');
  f.submit(); await f.flush();
  expect(f.command).toHaveBeenCalledExactlyOnceWith('bazaar.listing.edit', expect.objectContaining({ listingId: row.id, expectedRevision: 7, removeValue: true }));
  expect(f.command.mock.calls[0]![1]).not.toHaveProperty('value');
  expect(f.saved).toHaveBeenCalledOnce(); expect(f.container.hidden).toBe(true);
  const { value: _value, ...data } = row.data;
  f.ui.open({ ...row, data: { ...data, kind: 'wanted' } });
  expect(remove.checked).toBe(false); expect(remove.parent?.hidden).toBe(true);
  expect(f.field('amount').disabled).toBe(false); expect(f.field('amount').required).toBe(false);
  f.ui.destroy();
});

it.each(['cancel', 'lock'] as const)('discards queued removal after %s instead of issuing a stale command', async action => {
  const f = mount(); f.ui.open(row);
  const remove = f.field('remove-value'); remove.checked = true; remove.fire('change'); f.submit();
  if (action === 'cancel') { f.button('Cancel editing').click(); f.ui.open(row); }
  else f.ui.destroy();
  await f.flush();
  expect(f.command).not.toHaveBeenCalled(); expect(f.saved).not.toHaveBeenCalled(); expect(f.message).not.toHaveBeenCalled();
  if (action === 'lock') expect(f.container.children).toEqual([]);
  else { expect(remove.checked).toBe(false); f.ui.destroy(); }
});
