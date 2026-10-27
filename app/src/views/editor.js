import { h, clear, announce } from '../lib/dom.js';
import { CATEGORIES, CONDITIONS, KINDS, REGIONS, validateListing } from '../domain/listings.js';
import { confirmDialog } from '../lib/dialog.js';

const EMPTY_DRAFT = { title: '', description: '', kind: 'sell', category: '', condition: '', region: '', price: '' };
const LABELS = { sell: 'For sale', buy: 'Wanted', giveaway: 'Free', trade: 'Barter' };

export function renderEditor(root, { listings, drafts }) {
  const restored = drafts.load();
  let draft = { ...EMPTY_DRAFT, ...(restored ?? {}) };
  let errors = {};

  const summary = h('div', { class: 'error-summary', role: 'alert', hidden: true });
  const notice = h('p', { class: 'notice', role: 'status' });
  const submitBtn = h('button', { type: 'submit', class: 'btn btn-primary' }, 'Submit (simulated)');
  const form = h('form', { class: 'editor', novalidate: true, onSubmit: onSubmit });

  root.replaceChildren(
    h('header', { class: 'page-head' }, h('h1', {}, 'Create a listing'), h('p', { class: 'muted' }, 'Demo mode: submissions stay in this session only and are not published.')),
    restored ? h('p', { class: 'notice' }, 'Restored your saved draft from this browser.') : null,
    notice,
    summary,
    form,
  );

  function field(name, label, control, { hint } = {}) {
    const errorId = `${name}-error`;
    const hintId = `${name}-hint`;
    const error = h('p', { class: 'field-error', id: errorId, hidden: !errors[name] }, errors[name] ?? '');
    const input = control;
    input.id = name;
    input.name = name;
    input.setAttribute('aria-describedby', [hint ? hintId : null, errorId].filter(Boolean).join(' '));
    if (errors[name]) input.setAttribute('aria-invalid', 'true');
    input.addEventListener('input', () => onChange(name, input.value));
    input.addEventListener('change', () => onChange(name, input.value));
    return h(
      'div',
      { class: 'field' },
      h('label', { for: name }, label),
      hint ? h('p', { class: 'hint', id: hintId }, hint) : null,
      input,
      error,
    );
  }

  function select(name, label, options, labels = {}) {
    const control = h(
      'select',
      {},
      h('option', { value: '' }, `Choose…`),
      options.map((value) => h('option', { value, selected: draft[name] === value }, labels[value] ?? value)),
    );
    control.value = draft[name] ?? '';
    return field(name, label, control);
  }

  function input(name, label, props = {}, opts) {
    const control = h('input', { type: 'text', value: draft[name] ?? '', ...props });
    return field(name, label, control, opts);
  }

  function paint() {
    clear(form);
    form.append(
      select('kind', 'Listing type', KINDS, LABELS),
      input('title', 'Title', { maxlength: 120, autocomplete: 'off' }, { hint: '3 to 80 characters.' }),
      h(
        'div',
        { class: 'field' },
        h('label', { for: 'description' }, 'Description'),
        h('textarea', { id: 'description', name: 'description', rows: 4, 'aria-describedby': 'description-error', onInput: (event) => onChange('description', event.target.value) }, draft.description),
        h('p', { class: 'field-error', id: 'description-error', hidden: !errors.description }, errors.description ?? ''),
      ),
      input('price', 'Price (EUR)', { inputmode: 'decimal', placeholder: 'e.g. 12.50' }, { hint: 'Leave for free or barter listings; the field is ignored there.' }),
      select('category', 'Category', CATEGORIES),
      select('condition', 'Condition', CONDITIONS),
      select('region', 'Coarse area', REGIONS),
      h(
        'div',
        { class: 'form-actions' },
        submitBtn,
        h('button', { type: 'button', class: 'btn', onClick: onDiscard }, 'Discard draft'),
      ),
    );
  }

  function onChange(name, value) {
    draft = { ...draft, [name]: value };
    drafts.save(draft);
    if (errors[name]) {
      errors = validateListing(draft);
      paintErrors();
    }
  }

  function paintErrors() {
    for (const name of ['kind', 'title', 'description', 'price', 'category', 'condition', 'region']) {
      const node = form.querySelector(`#${name}-error`);
      if (!node) continue;
      node.textContent = errors[name] ?? '';
      node.hidden = !errors[name];
      const control = form.querySelector(`[name="${name}"]`);
      if (control) errors[name] ? control.setAttribute('aria-invalid', 'true') : control.removeAttribute('aria-invalid');
    }
    const keys = Object.keys(errors);
    summary.hidden = keys.length === 0;
    summary.replaceChildren(
      keys.length ? h('p', {}, `Fix ${keys.length} field${keys.length === 1 ? '' : 's'} to continue:`) : '',
      keys.length ? h('ul', {}, keys.map((key) => h('li', {}, h('a', { href: `#${key}` }, errors[key])))) : '',
    );
  }

  async function onSubmit(event) {
    event.preventDefault();
    errors = validateListing(draft);
    paintErrors();
    if (Object.keys(errors).length) {
      summary.focus?.();
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';
    const result = await listings.submit(draft, { delayMs: 400 });
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit (simulated)';
    if (!result.ok) {
      errors = result.errors;
      paintErrors();
      return;
    }
    drafts.clear();
    draft = { ...EMPTY_DRAFT };
    notice.replaceChildren(
      'Simulated: your listing exists only in this session. ',
      h('a', { href: `#/listing/${result.id}` }, 'View it'),
    );
    announce('Listing submitted in demo mode.');
    paint();
  }

  async function onDiscard() {
    const ok = await confirmDialog({
      title: 'Discard this draft?',
      message: 'The text you entered in this form will be removed from this browser.',
      confirmLabel: 'Discard',
    });
    if (!ok) return;
    drafts.clear();
    draft = { ...EMPTY_DRAFT };
    errors = {};
    paint();
    announce('Draft discarded.');
  }

  paint();
}
