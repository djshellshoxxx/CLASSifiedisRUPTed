import { createLocalIntentStore, createLocalMatchSession, privateIntentCriteriaSchema,
  type LocalIntentStore, type LocalMatchSession, type LocalMatchSessionOptions,
  type LocalMatchSuggestion, type PrivateIntent } from '../../../packages/blindmatch/src/index.ts';
import { createSystemClock, type Clock, type StoredRecord } from '../../../packages/kernel/src/index.ts';
import type { UnlockedVault } from '../../../packages/vault/src/index.ts';

/** The form uses UTC explicitly; keep an unchanged saved expiry's subsecond precision. */
export function privateIntentFormInput(data: FormData, previous?: PrivateIntent) {
  const text = (name: string) => String(data.get(name) ?? '');
  const rawExpiry = text('expires');
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(rawExpiry)) {
    throw new Error('Enter a valid expiry date and time in UTC.');
  }
  const canonicalExpiry = `${rawExpiry.length === 16 ? `${rawExpiry}:00` : rawExpiry}.000Z`;
  const date = new Date(canonicalExpiry);
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== canonicalExpiry) {
    throw new Error('Enter a valid expiry date and time in UTC.');
  }
  const currency = text('currency').trim().toUpperCase();
  const min = text('min'), max = text('max');
  if ((min || max) && !currency) throw new Error('Choose a currency for the price limits.');
  const criteria = privateIntentCriteriaSchema.safeParse({
    query: text('query').normalize('NFC'),
    ...(text('category') ? { categoryId: text('category') } : {}),
    ...(text('kind') ? { kind: text('kind') } : {}),
    ...(text('condition') ? { condition: text('condition') } : {}),
    ...(text('region') ? { regionCell: text('region') } : {}),
    ...(currency ? { price: { currency, ...(min ? { min } : {}), ...(max ? { max } : {}) } } : {}),
  });
  if (!criteria.success) throw new Error('Check the search filters, coarse area and exact whole minor-unit price limits.');
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
  const node = <K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] => {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    return element;
  };
  const title = node('h2', 'Private local matching'); title.id = 'blindmatch-title';
  ports.container.setAttribute('aria-labelledby', title.id);
  const help = node('p', 'Save private search preferences in your encrypted vault and match them against up to 128 already-retained public listings. Nothing is published or sent to a provider. Matching starts only when you run it.');
  help.id = 'blindmatch-help';
  const enableLabel = node('label', 'Enable local matching for this session'); enableLabel.className = 'check';
  const enable = node('input'); enable.type = 'checkbox'; enable.checked = false;
  enable.setAttribute('aria-describedby', help.id); enableLabel.prepend(enable);
  const content = node('div'); content.hidden = true;
  const form = node('form'); form.id = 'blindmatch-form'; form.autocomplete = 'off';
  const fields = node('fieldset'); fields.append(node('legend', 'Private intent'));
  function input(label: string, name: string) {
    const wrapper = node('label', label), control = node('input');
    control.name = name; control.autocomplete = 'off'; control.spellcheck = false;
    wrapper.append(control); fields.append(wrapper); return control;
  }
  function select(label: string, name: string, choices: readonly (readonly [string, string])[]) {
    const wrapper = node('label', label), control = node('select'); control.name = name;
    for (const [value, text] of choices) { const option = node('option', text); option.value = value; control.append(option); }
    wrapper.append(control); fields.append(wrapper); return control;
  }
  const query = input('Private search text', 'query'); query.maxLength = 120;
  const category = input('Category identifier (optional)', 'category'); category.maxLength = 36;
  const kind = select('Matching listing type', 'kind', [['', 'Any listing type'], ['sell', 'For sale'], ['wanted', 'Wanted'], ['giveaway', 'Giveaway']]);
  const condition = select('Matching condition', 'condition', [['', 'Any condition'], ['new', 'New'], ['like_new', 'Like new'], ['good', 'Good'], ['fair', 'Fair'], ['poor', 'Poor'], ['for_parts', 'For parts']]);
  const region = input('Matching coarse area (optional)', 'region'); region.maxLength = 5;
  const currency = input('Price currency (optional)', 'currency'); currency.maxLength = 10;
  const min = input('Minimum price (whole minor units)', 'min');
  const max = input('Maximum price (whole minor units)', 'max');
  for (const amount of [min, max]) { amount.inputMode = 'numeric'; amount.maxLength = 78; amount.pattern = '(0|[1-9][0-9]{0,77})'; }
  const expires = input('Expires at (UTC)', 'expires'); expires.type = 'datetime-local'; expires.step = '1'; expires.required = true;
  fields.append(node('p', 'Use UTC for expiry and whole minor units for prices, such as 1250 for CAD 12.50. Saving creates a draft; editing an existing intent returns it to draft.'));
  const formActions = node('div'); formActions.className = 'actions';
  const save = node('button', 'Save private intent'); save.type = 'submit';
  const cancelEdit = node('button', 'Cancel editing'); cancelEdit.type = 'button'; cancelEdit.hidden = true;
  formActions.append(save, cancelEdit); fields.append(formActions); form.append(fields);
  const status = node('p'); status.id = 'blindmatch-status'; status.setAttribute('role', 'status');
  const error = node('p'); error.id = 'blindmatch-error'; error.setAttribute('role', 'alert');
  const cancelMatch = node('button', 'Cancel local match'); cancelMatch.type = 'button'; cancelMatch.hidden = true;
  const rows = node('div'); rows.id = 'blindmatch-intents';
  const results = node('div'); results.id = 'blindmatch-results';
  content.append(form, status, error, cancelMatch, node('h3', 'Saved private intents'), rows, node('h3', 'Local matching results'), results,
    node('p', 'Results refer to a locally verified signed snapshot. Availability remains a peer claim. A match grants no contact, consent, reservation or trade.'));
  ports.container.replaceChildren(title, help, enableLabel, content); ports.container.hidden = false;

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
    save.textContent = editing ? 'Save intent changes' : 'Save private intent';
    content.setAttribute('aria-busy', operation ? 'true' : 'false');
  }
  function clearForm(): void { editing = undefined; dirty = false; form.reset(); controls(); }
  function invalidateResults(): void {
    if (operation?.kind === 'match') operation = undefined;
    matching?.cancel(); results.replaceChildren(); status.textContent = ''; error.textContent = ''; controls();
  }
  function failure(problem: unknown): void {
    const code = problem && typeof problem === 'object' && 'code' in problem ? problem.code : undefined;
    error.textContent = code === 'EXPIRED' ? 'This private intent has expired. Edit its expiry before matching.'
      : code === 'VALIDATION_FAILED' ? 'Check the filters and expiry, then try again.'
      : code === 'CONFLICT_REVISION' ? 'The saved intent changed. Reopen this view and review its current state before retrying.'
      : 'This action could not be confirmed. A save may already have completed. Reopen this view and review saved state before retrying.';
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
    if (!items.length) { results.append(node('p', 'No eligible retained public listings matched this intent.')); return; }
    for (const item of items) {
      const card = node('article'); card.className = 'card'; card.append(node('h4', 'Public listing reference'));
      const details = node('dl');
      for (const [label, value] of [['Owner', item.ownerId], ['Listing', item.listingId], ['Revision', String(item.revision)], ['CID', item.cid]]) {
        const valueNode = node('dd', value); valueNode.className = 'mono';
        details.append(node('dt', label), valueNode);
      }
      card.append(details); results.append(card);
    }
  }
  function renderRows(items: readonly Row[], at: number): void {
    if (!current(at)) return;
    const version = ++renderVersion;
    rowButtons.length = 0; rows.replaceChildren();
    if (!items.length) rows.append(node('p', 'No saved private intents.'));
    for (const row of items) {
      const card = node('article'); card.className = 'card';
      card.append(node('h4', row.data.criteria.query || 'Private intent'),
        node('p', `State: ${row.data.state} · Revision: ${row.revision} · Expires: ${row.data.expiresAt} (UTC)`));
      const actions = node('div'); actions.className = 'actions';
      const usable = () => current(at) && version === renderVersion && !operation && !dirty && !editing;
      function button(label: string, callback: () => void) {
        const control = node('button', label); control.type = 'button';
        control.addEventListener('click', () => { if (usable()) callback(); });
        rowButtons.push(control); actions.append(control);
      }
      button('Edit private intent', () => {
        invalidateResults(); editing = structuredClone(row); dirty = false;
        const criteria = row.data.criteria;
        query.value = criteria.query; category.value = criteria.categoryId ?? ''; kind.value = criteria.kind ?? '';
        condition.value = criteria.condition ?? ''; region.value = criteria.regionCell ?? '';
        currency.value = criteria.price?.currency ?? ''; min.value = criteria.price?.min ?? ''; max.value = criteria.price?.max ?? '';
        expires.value = row.data.expiresAt.slice(0, 19); controls(); query.focus();
        status.textContent = 'Editing a private intent. Save or cancel editing before matching.';
      });
      button('Run local match', () => {
        invalidateResults();
        void perform('match', async (ticket, store, matcher) => {
          status.textContent = 'Preparing the saved private intent…';
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
          status.textContent = 'Matching locally against authenticated retained public listings…';
          const matched = await matcher.match({ id: selected.id, expectedRevision: selected.revision });
          if (!admitted(ticket)) return;
          if (!matched.ok) throw matched.error;
          renderReferences(matched.value.items);
          status.textContent = `Local match complete: ${matched.value.items.length} public listing reference${matched.value.items.length === 1 ? '' : 's'}. Results stay in this view.`;
        });
      });
      if (row.data.state === 'active') button('Pause private intent', () => {
        invalidateResults();
        void perform('write', async (ticket, store) => {
          const paused = await store.setState({ id: row.id, expectedRevision: row.revision, state: 'paused' });
          if (!admitted(ticket)) return;
          if (!paused.ok) throw paused.error;
          const saved = await store.list();
          if (!admitted(ticket)) return;
          if (!saved.ok) throw saved.error;
          renderRows(saved.value, ticket.generation); status.textContent = 'Private intent paused.';
        });
      });
      button('Erase private intent', () => {
        if (!window.confirm('Erase this private intent from this vault? Independent backups and other copies are not erased.')) return;
        if (!usable()) return;
        invalidateResults();
        void perform('write', async (ticket, store) => {
          const erased = await store.erase({ id: row.id, expectedRevision: row.revision });
          if (!admitted(ticket)) return;
          if (!erased.ok) throw erased.error;
          const saved = await store.list();
          if (!admitted(ticket)) return;
          if (!saved.ok) throw saved.error;
          renderRows(saved.value, ticket.generation); status.textContent = 'Private intent erased from this vault. Independent backups and other copies remain separate.';
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
      status.textContent = 'Loading saved private intents…';
      const saved = await store.list();
      if (!admitted(ticket)) return;
      if (!saved.ok) throw saved.error;
      renderRows(saved.value, ticket.generation); status.textContent = 'Local matching enabled for this session. Choose an intent and run it explicitly.';
    });
  });
  form.addEventListener('input', () => {
    if (!current() || operation) return;
    dirty = true; invalidateResults(); controls();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!current() || operation) return;
    const previous = editing;
    let input: ReturnType<typeof privateIntentFormInput>;
    try { input = privateIntentFormInput(new FormData(form), previous?.data); }
    catch (problem) { error.textContent = problem instanceof Error ? problem.message : 'Check the private intent fields.'; return; }
    invalidateResults();
    void perform('write', async (ticket, store) => {
      const saved = previous ? await store.revise({ id: previous.id, expectedRevision: previous.revision, ...input }) : await store.create(input);
      if (!admitted(ticket)) return;
      if (!saved.ok) throw saved.error;
      clearForm();
      const all = await store.list();
      if (!admitted(ticket)) return;
      if (!all.ok) throw all.error;
      renderRows(all.value, ticket.generation); status.textContent = 'Private intent saved locally as draft. Run local match when ready.';
    });
  });
  cancelEdit.addEventListener('click', () => {
    if (!current() || operation) return;
    invalidateResults(); clearForm(); status.textContent = 'Editing cleared. Saved private intents are unchanged.';
  });
  cancelMatch.addEventListener('click', () => {
    if (!current() || operation?.kind !== 'match') return;
    invalidateResults(); status.textContent = 'Local matching cancelled. Review saved state before retrying if activation was still in progress.';
  });
  controls();
  return {
    invalidateResults,
    destroy() {
      if (!alive) return;
      alive = false;
      ownerDocument.removeEventListener('visibilitychange', visibilityChanged);
      ownerWindow?.removeEventListener('pagehide', pageHidden);
      ownerWindow?.removeEventListener('pageshow', pageShown);
      disable(); ports.container.replaceChildren(); ports.container.hidden = true;
    },
  };
}
