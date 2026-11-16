import type { Listing } from '../../../packages/bazaar/src/index.ts';

export interface EditableListing { readonly id: string; readonly revision: number; readonly data: Listing }

/** Preserve fields this editor does not expose, including exact currency and private metadata. */
export function listingEditInput(row: EditableListing, data: FormData) {
  const amount = String(data.get('amount') ?? '');
  if (row.data.value && !amount) throw new Error('Enter the declared value in minor units.');
  if (amount && !/^(0|[1-9][0-9]*)$/.test(amount)) throw new Error('Use whole, non-negative minor units without separators.');
  const condition = String(data.get('condition') ?? '');
  if (!condition && (row.data.condition || row.data.kind !== 'wanted')) throw new Error('Choose a condition for this listing.');
  const region = String(data.get('region') ?? '');
  if (!region && row.data.regionCell) throw new Error('Enter the coarse area for this listing.');
  return {
    listingId: row.id, expectedRevision: row.revision, title: String(data.get('title') ?? ''), description: String(data.get('description') ?? ''),
    categoryId: row.data.categoryId, tags: [...row.data.tags], locale: row.data.locale,
    ...(condition ? { condition } : {}), ...(region ? { regionCell: region } : {}),
    barterOptIn: data.get('barter') === 'on', privateNotes: String(data.get('notes') ?? ''),
    ...(amount ? { value: { amount, currency: row.data.value?.currency ?? 'CAD' } } : {}),
  };
}

interface EditorPorts {
  readonly container: HTMLElement;
  action(fn: () => Promise<void>): Promise<void>;
  command(name: string, input: unknown): Promise<unknown>;
  saved(): Promise<void>;
  message(text: string): void;
}
export function mountListingEditor(ports: EditorPorts) {
  let active = true;
  let editing: EditableListing | undefined;
  const node = <K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] => {
    const item = document.createElement(tag); if (text !== undefined) item.textContent = text; return item;
  };
  const title = node('h2', 'Edit local listing'); title.id = 'listing-editor-title';
  ports.container.setAttribute('aria-labelledby', title.id);
  const form = node('form');
  function field(label: string, name: string, multiline = false) {
    const wrapper = node('label', label);
    const input = multiline ? node('textarea') : node('input'); input.name = name;
    wrapper.append(input); form.append(wrapper); return input;
  }
  const name = field('Edit title', 'title'); name.required = true; name.minLength = 3; name.maxLength = 120;
  const description = field('Edit description', 'description', true); description.maxLength = 5000;
  const conditionLabel = node('label', 'Edit condition');
  const condition = node('select'); condition.name = 'condition'; condition.id = 'edit-listing-condition'; conditionLabel.htmlFor = condition.id;
  for (const [value, text] of [['', 'Not specified (wanted listings)'], ['new', 'New'], ['like_new', 'Like new'], ['good', 'Good'], ['fair', 'Fair'], ['poor', 'Poor'], ['for_parts', 'For parts']]) {
    const option = node('option', text); option.value = value!; condition.append(option);
  }
  const conditionField = node('div'); conditionField.append(conditionLabel, condition); form.append(conditionField);
  const region = field('Edit coarse area', 'region') as HTMLInputElement;
  region.pattern = '[0123456789bcdefghjkmnpqrstuvwxyz]{4,5}'; region.maxLength = 5;
  const amountLabel = node('label', 'Edit declared value (minor units)');
  const amount = node('input'); amount.name = 'amount'; amount.inputMode = 'numeric'; amount.pattern = '[0-9]+';
  amountLabel.append(amount); form.append(amountLabel);
  const currency = node('p'); form.append(currency);
  const barterLabel = node('label', 'Allow edited listing in barter'); barterLabel.className = 'check';
  const barter = node('input'); barter.name = 'barter'; barter.type = 'checkbox'; barterLabel.prepend(barter); form.append(barterLabel);
  const notes = field('Private listing notes', 'notes', true); notes.maxLength = 2000;
  form.append(node('p', 'Private notes stay out of signed listing files. Saving changes does not publish them.'));
  const buttons = node('div'); buttons.className = 'actions';
  const save = node('button', 'Save listing changes'); save.type = 'submit';
  const cancel = node('button', 'Cancel editing'); cancel.type = 'button';
  buttons.append(save, cancel); form.append(buttons);
  const clear = () => { editing = undefined; form.reset(); ports.container.hidden = true; };
  cancel.addEventListener('click', clear);
  form.addEventListener('submit', event => {
    event.preventDefault(); const row = editing; const data = new FormData(form);
    if (!active || !row) return;
    void ports.action(async () => {
      if (!active || editing !== row) return;
      await ports.command('bazaar.listing.edit', listingEditInput(row, data));
      if (!active || editing !== row) return;
      clear(); await ports.saved(); ports.message('Listing changes saved locally. Publish the updated listing when ready.');
    });
  });
  ports.container.replaceChildren(title, form); clear();
  return {
    open(row: EditableListing) {
      if (!active) return;
      if (row.data.status !== 'draft' && row.data.status !== 'unpublished') throw new Error('Unpublish this listing before editing it.');
      editing = structuredClone(row);
      name.value = row.data.title; description.value = row.data.description; condition.value = row.data.condition ?? '';
      condition.required = row.data.kind !== 'wanted' || !!row.data.condition;
      condition.options[0]!.disabled = condition.required;
      region.value = row.data.regionCell ?? ''; region.required = !!row.data.regionCell;
      amount.value = row.data.value?.amount ?? ''; amount.required = !!row.data.value;
      currency.textContent = `Currency: ${row.data.value?.currency ?? 'CAD'}. Enter the exact amount in minor units.`;
      barter.checked = row.data.barterOptIn; notes.value = row.data.privateNotes;
      ports.container.hidden = false; name.focus(); ports.container.scrollIntoView({ block: 'nearest' });
    },
    destroy() { active = false; clear(); ports.container.replaceChildren(); },
  };
}
