import { en as englishMessages } from '../../../packages/i18n/src/internationalization/languages/blindmatch/en.ts';
import { mountBlindMatchLanguage, type BlindMatchMessage } from './blindmatch-language.ts';
import { createLocalIntentStore, createLocalMatchSession, privateIntentCriteriaSchema,
  type LocalIntentStore, type LocalMatchSession, type LocalMatchSessionOptions,
  type LocalMatchSuggestion, type PrivateIntent } from '../../../packages/blindmatch/src/index.ts';
import { createSystemClock, type Clock, type StoredRecord } from '../../../packages/kernel/src/index.ts';
import type { UnlockedVault } from '../../../packages/vault/src/index.ts';

class PrivateIntentFormError extends Error {
  constructor(key: 'invalidExpiry' | 'needCurrency' | 'invalidFilters') {
    super(englishMessages[`blindmatch.${key}`]);
    this.key = key;
  }
  readonly key: BlindMatchMessage;
}

/** The form uses UTC explicitly; keep an unchanged saved expiry's subsecond precision. */
export function privateIntentFormInput(data: FormData, previous?: PrivateIntent) {
  const text = (name: string) => String(data.get(name) ?? '');
  const rawExpiry = text('expires');
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(rawExpiry)) {
    throw new PrivateIntentFormError('invalidExpiry');
  }
  const canonicalExpiry = `${rawExpiry.length === 16 ? `${rawExpiry}:00` : rawExpiry}.000Z`;
  const date = new Date(canonicalExpiry);
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== canonicalExpiry) {
    throw new PrivateIntentFormError('invalidExpiry');
  }
  const currency = text('currency').trim().toUpperCase();
  const min = text('min'), max = text('max');
  if ((min || max) && !currency) throw new PrivateIntentFormError('needCurrency');
  const criteria = privateIntentCriteriaSchema.safeParse({
    query: text('query').normalize('NFC'),
    ...(text('category') ? { categoryId: text('category') } : {}),
    ...(text('kind') ? { kind: text('kind') } : {}),
    ...(text('condition') ? { condition: text('condition') } : {}),
    ...(text('region') ? { regionCell: text('region') } : {}),
    ...(currency ? { price: { currency, ...(min ? { min } : {}), ...(max ? { max } : {}) } } : {}),
  });
  if (!criteria.success) throw new PrivateIntentFormError('invalidFilters');
  return {
    criteria: criteria.data,
    expiresAt: previous && canonicalExpiry === `${previous.expiresAt.slice(0, 19)}.000Z` ? previous.expiresAt : canonicalExpiry,
  };
}

interface BlindMatchPorts {
  readonly container: HTMLElement;
  readonly session: Pick<UnlockedVault, 'storage' | 'principal'>;
  readonly isCurrent: () => boolean;
  readonly clock?: Clock;
  readonly loadCandidates: LocalMatchSessionOptions['loadCandidates'];
  readonly blockedOwners?: () => readonly string[];
}

/** Local-only composition. Every enablement creates a fresh, revocable view session. */
export function mountBlindMatch(ports: BlindMatchPorts) {
  type Row = StoredRecord<PrivateIntent>;
  type Operation = { readonly generation: number; readonly kind: 'load' | 'write' | 'match' };
  const clock = ports.clock ?? createSystemClock();
  const ownerDocument = ports.container.ownerDocument;
  const ownerWindow = ownerDocument.defaultView;
  let pageSuspended = false;
  let alive = true, enabled = false, generation = 0, renderVersion = 0, dirty = false;
  let intents: LocalIntentStore | undefined, matching: LocalMatchSession | undefined;
  let editing: Row | undefined, operation: Operation | undefined;
  const rowButtons: HTMLButtonElement[] = [];
  const language = mountBlindMatchLanguage(ports.container);
  const { message, translate } = language;
  const node = <K extends keyof HTMLElementTagNameMap>(tag: K, label?: BlindMatchMessage | (() => string)): HTMLElementTagNameMap[K] => {
    const element = ownerDocument.createElement(tag);
    if (label !== undefined) message(element, label);
    return element;
  };
  const title = node('h2', 'title'); title.id = 'blindmatch-title';
  ports.container.setAttribute('aria-labelledby', title.id);
  const help = node('p', 'help');
  help.id = 'blindmatch-help';
  const enableLabel = node('label', 'enable'); enableLabel.className = 'check';
  const enable = node('input'); enable.type = 'checkbox'; enable.checked = false;
  enable.setAttribute('aria-describedby', help.id); enableLabel.prepend(enable);
  const content = node('div'); content.hidden = true;
  const form = node('form'); form.id = 'blindmatch-form'; form.autocomplete = 'off';
  const fields = node('fieldset'); fields.append(node('legend', 'intent'));
  function input(label: BlindMatchMessage, name: string) {
    const wrapper = node('label', label), control = node('input');
    control.name = name; control.autocomplete = 'off'; control.spellcheck = false;
    wrapper.append(control); fields.append(wrapper); return control;
  }
  function select(label: BlindMatchMessage, name: string, choices: readonly (readonly [string, BlindMatchMessage])[]) {
    const wrapper = node('label', label), control = node('select'); control.name = name;
    for (const [value, text] of choices) { const option = node('option', text); option.value = value; control.append(option); }
    wrapper.append(control); fields.append(wrapper); return control;
  }
  const query = input('query', 'query'); query.maxLength = 120; query.dir = 'auto';
  const category = input('category', 'category'); category.maxLength = 36;
  const kind = select('kind', 'kind', [['', 'anyKind'], ['sell', 'sell'], ['wanted', 'wanted'], ['giveaway', 'giveaway']]);
  const condition = select('condition', 'condition', [['', 'anyCondition'], ['new', 'new'], ['like_new', 'likeNew'], ['good', 'good'], ['fair', 'fair'], ['poor', 'poor'], ['for_parts', 'forParts']]);
  const region = input('region', 'region'); region.maxLength = 5;
  const currency = input('currency', 'currency'); currency.maxLength = 10;
  const min = input('min', 'min');
  const max = input('max', 'max');
  for (const amount of [min, max]) { amount.dir = 'ltr'; amount.inputMode = 'numeric'; amount.maxLength = 78; amount.pattern = '(0|[1-9][0-9]{0,77})'; }
  const expires = input('expires', 'expires'); expires.type = 'datetime-local'; expires.step = '1'; expires.required = true;
  fields.append(node('p', 'formHelp'));
  const formActions = node('div'); formActions.className = 'actions';
  const save = node('button', 'save'); save.type = 'submit';
  const cancelEdit = node('button', 'cancelEdit'); cancelEdit.type = 'button'; cancelEdit.hidden = true;
  formActions.append(save, cancelEdit); fields.append(formActions); form.append(fields);
  const status = node('p'); status.id = 'blindmatch-status'; status.setAttribute('role', 'status');
  const error = node('p'); error.id = 'blindmatch-error'; error.setAttribute('role', 'alert');
  const cancelMatch = node('button', 'cancelMatch'); cancelMatch.type = 'button'; cancelMatch.hidden = true;
  const rows = node('div'); rows.id = 'blindmatch-intents';
  const results = node('div'); results.id = 'blindmatch-results';
  content.append(form, status, error, cancelMatch, node('h3', 'savedList'), rows, node('h3', 'results'), results,
    node('p', 'resultNotice'));
  ports.container.replaceChildren(title, help, language.control, language.announcement, enableLabel, content); ports.container.hidden = false;

  function current(at = generation): boolean {
    try { return alive && enabled && !pageSuspended && !ownerDocument.hidden
      && at === generation && ports.isCurrent() === true; }
    catch { return false; }
  }
  const admitted = (ticket: Operation) => current(ticket.generation) && operation === ticket;
  function controls(): void {
    fields.disabled = !enabled || operation !== undefined;
    for (const button of rowButtons) button.disabled = operation !== undefined || dirty || editing !== undefined;
    cancelEdit.hidden = !dirty && !editing;
    cancelMatch.hidden = operation?.kind !== 'match';
    message(save, editing ? 'saveChanges' : 'save');
    content.setAttribute('aria-busy', operation ? 'true' : 'false');
  }
  function clearForm(): void { editing = undefined; dirty = false; form.reset(); controls(); }
  function invalidateResults(): void {
    if (operation?.kind === 'match') operation = undefined;
    matching?.cancel(); results.replaceChildren(); status.textContent = ''; error.textContent = ''; controls();
  }
  function failure(problem: unknown): void {
    const code = problem && typeof problem === 'object' && 'code' in problem ? problem.code : undefined;
    message(error, code === 'EXPIRED' ? 'expired'
      : code === 'VALIDATION_FAILED' ? 'invalid'
      : code === 'CONFLICT_REVISION' ? 'conflict'
      : 'unknown');
    status.textContent = '';
  }
  async function perform(kind: Operation['kind'], work: (ticket: Operation, store: LocalIntentStore, matcher: LocalMatchSession) => Promise<void>): Promise<void> {
    if (!current() || operation || !intents || !matching) return;
    const ticket = { generation, kind };
    operation = ticket; error.textContent = ''; controls();
    try { await work(ticket, intents, matching); }
    catch (problem) { if (admitted(ticket)) failure(problem); }
    finally { if (admitted(ticket)) { operation = undefined; controls(); } }
  }
  function renderReferences(items: readonly LocalMatchSuggestion[]): void {
    results.replaceChildren();
    if (!items.length) { results.append(node('p', 'emptyResults')); return; }
    for (const item of items) {
      const card = node('article'); card.className = 'card'; card.append(node('h4', 'reference'));
      const details = node('dl');
      for (const [label, value] of [['owner', item.ownerId], ['listing', item.listingId], ['revision', String(item.revision)], ['cid', item.cid]] as const) {
        const valueNode = node('dd'); valueNode.textContent = value; valueNode.dir = 'ltr'; valueNode.className = 'mono';
        details.append(node('dt', label), valueNode);
      }
      card.append(details); results.append(card);
    }
  }
  function renderRows(items: readonly Row[], at: number): void {
    if (!current(at)) return;
    const version = ++renderVersion;
    rowButtons.length = 0; rows.replaceChildren();
    if (!items.length) rows.append(node('p', 'emptyIntents'));
    for (const row of items) {
      const card = node('article'); card.className = 'card';
      const heading = node('h4', 'intent');
      if (row.data.criteria.query) { heading.textContent = row.data.criteria.query; heading.dir = 'auto'; }
      const { state, expiresAt } = row.data;
      const revision = row.revision;
      card.append(heading, node('p', () => translate('row', { state: translate(state), revision, expiry: expiresAt })));
      const actions = node('div'); actions.className = 'actions';
      const usable = () => current(at) && version === renderVersion && !operation && !dirty && !editing;
      function button(label: BlindMatchMessage, callback: () => void) {
        const control = node('button', label); control.type = 'button';
        control.addEventListener('click', () => { if (usable()) callback(); });
        rowButtons.push(control); actions.append(control);
      }
      button('edit', () => {
        invalidateResults(); editing = structuredClone(row); dirty = false;
        const criteria = row.data.criteria;
        query.value = criteria.query; category.value = criteria.categoryId ?? ''; kind.value = criteria.kind ?? '';
        condition.value = criteria.condition ?? ''; region.value = criteria.regionCell ?? '';
        currency.value = criteria.price?.currency ?? ''; min.value = criteria.price?.min ?? ''; max.value = criteria.price?.max ?? '';
        expires.value = row.data.expiresAt.slice(0, 19); controls(); query.focus();
        message(status, 'editing');
      });
      button('run', () => {
        invalidateResults();
        void perform('match', async (ticket, store, matcher) => {
          message(status, 'preparing');
          let selected = row;
          if (selected.data.state !== 'active') {
            const activated = await store.setState({ id: row.id, expectedRevision: row.revision, state: 'active' });
            if (!admitted(ticket)) return;
            if (!activated.ok) throw activated.error;
            selected = activated.value;
          }
          const saved = await store.list();
          if (!admitted(ticket)) return;
          if (!saved.ok) throw saved.error;
          renderRows(saved.value, ticket.generation);
          message(status, 'matching');
          const matched = await matcher.match({ id: selected.id, expectedRevision: selected.revision });
          if (!admitted(ticket)) return;
          if (!matched.ok) throw matched.error;
          renderReferences(matched.value.items);
          const count = matched.value.items.length;
          message(status, () => language.resultCount(count));
        });
      });
      if (row.data.state === 'active') button('pause', () => {
        invalidateResults();
        void perform('write', async (ticket, store) => {
          const paused = await store.setState({ id: row.id, expectedRevision: row.revision, state: 'paused' });
          if (!admitted(ticket)) return;
          if (!paused.ok) throw paused.error;
          const saved = await store.list();
          if (!admitted(ticket)) return;
          if (!saved.ok) throw saved.error;
          renderRows(saved.value, ticket.generation); message(status, 'pauseDone');
        });
      });
      button('erase', () => {
        if (!ownerWindow?.confirm(translate('confirmErase'))) return;
        if (!usable()) return;
        invalidateResults();
        void perform('write', async (ticket, store) => {
          const erased = await store.erase({ id: row.id, expectedRevision: row.revision });
          if (!admitted(ticket)) return;
          if (!erased.ok) throw erased.error;
          const saved = await store.list();
          if (!admitted(ticket)) return;
          if (!saved.ok) throw saved.error;
          renderRows(saved.value, ticket.generation); message(status, 'eraseDone');
        });
      });
      card.append(actions); rows.append(card);
    }
    controls();
  }

  function disable(): void {
    generation++; enabled = false; operation = undefined; renderVersion++;
    matching?.cancel(); matching = undefined; intents = undefined;
    rowButtons.length = 0; clearForm(); rows.replaceChildren(); results.replaceChildren();
    status.textContent = ''; error.textContent = ''; content.hidden = true; enable.checked = false;
  }
  // Conceal immediately on backgrounding/navigation; the vault's delayed lock
  // does not protect this view. Returning to the page never restores opt-in.
  const visibilityChanged = () => { if (ownerDocument.hidden) disable(); };
  const pageHidden = () => { pageSuspended = true; disable(); };
  const pageShown = () => { pageSuspended = false; };
  ownerDocument.addEventListener('visibilitychange', visibilityChanged);
  ownerWindow?.addEventListener('pagehide', pageHidden);
  ownerWindow?.addEventListener('pageshow', pageShown);
  enable.addEventListener('change', () => {
    if (!alive) return;
    if (!enable.checked) { disable(); return; }
    generation++; enabled = true;
    const at = generation, isCurrent = () => current(at);
    if (!isCurrent()) { disable(); return; }
    intents = createLocalIntentStore({ storage: ports.session.storage, principal: ports.session.principal, clock, isCurrent, enabled: true });
    matching = createLocalMatchSession({ intents, principal: ports.session.principal, clock, isCurrent, enabled: true,
      loadCandidates: ports.loadCandidates, ...(ports.blockedOwners ? { blockedOwners: ports.blockedOwners } : {}) });
    content.hidden = false;
    void perform('load', async (ticket, store) => {
      message(status, 'loading');
      const saved = await store.list();
      if (!admitted(ticket)) return;
      if (!saved.ok) throw saved.error;
      renderRows(saved.value, ticket.generation); message(status, 'enabled');
    });
  });
  form.addEventListener('input', () => {
    if (!current() || operation) return;
    dirty = true; invalidateResults(); controls();
  });
  // Preserve native constraints and focus the first invalid field while showing
  // the validation message in the language explicitly chosen for this panel.
  form.addEventListener('invalid', event => {
    event.preventDefault();
    if (!current() || operation) return;
    const invalid = form.querySelector<HTMLInputElement>('input:invalid');
    if (!invalid || invalid !== event.target) return;
    message(error, invalid === expires ? 'invalidExpiry' : 'invalidFilters');
    invalid.focus();
  }, true);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!current() || operation) return;
    const previous = editing;
    let input: ReturnType<typeof privateIntentFormInput>;
    try { input = privateIntentFormInput(new FormData(form), previous?.data); }
    catch (problem) { message(error, problem instanceof PrivateIntentFormError ? problem.key : 'invalid'); return; }
    invalidateResults();
    void perform('write', async (ticket, store) => {
      const saved = previous ? await store.revise({ id: previous.id, expectedRevision: previous.revision, ...input }) : await store.create(input);
      if (!admitted(ticket)) return;
      if (!saved.ok) throw saved.error;
      clearForm();
      const all = await store.list();
      if (!admitted(ticket)) return;
      if (!all.ok) throw all.error;
      renderRows(all.value, ticket.generation); message(status, 'saved');
    });
  });
  cancelEdit.addEventListener('click', () => {
    if (!current() || operation) return;
    invalidateResults(); clearForm(); message(status, 'cleared');
  });
  cancelMatch.addEventListener('click', () => {
    if (!current() || operation?.kind !== 'match') return;
    invalidateResults(); message(status, 'cancelled');
  });
  controls();
  return {
    invalidateResults,
    destroy() {
      if (!alive) return;
      alive = false;
      language.destroy();
      ownerDocument.removeEventListener('visibilitychange', visibilityChanged);
      ownerWindow?.removeEventListener('pagehide', pageHidden);
      ownerWindow?.removeEventListener('pageshow', pageShown);
      disable(); ports.container.replaceChildren(); ports.container.hidden = true;
    },
  };
}
