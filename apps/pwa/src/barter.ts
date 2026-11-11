import { createUuidV7Generator, type StoredRecord } from '../../../packages/kernel/src/index.ts';
import { signEnvelope, verifyEnvelope, MAX_ENVELOPE_BYTES } from '../../../packages/federation/src/index.ts';
import { publicKeyFromDid } from '../../../packages/identity/src/index.ts';
import { type UnlockedVault } from '../../../packages/vault/src/index.ts';
import { admitSignedGraph, discoverCycles, prepareProposal, parseWant, WANT_TYPE, PROPOSAL_TYPE, CONSENT_TYPE, RESERVATION_TYPE, WITHDRAWAL_TYPE, coordinationRepo, type CoordinationState } from '../../../packages/mutiny/src/index.ts';
import type { BarterInputs, MatchingPolicy } from './barter-runtime.ts';

export interface BarterMountOptions {
  readonly container: HTMLElement;
  readonly session: UnlockedVault;
  readonly command: (name: string, input: unknown) => Promise<unknown>;
  readonly query: (name: string, input: unknown) => Promise<unknown>;
  readonly action: (fn: () => Promise<void>) => Promise<void>;
  readonly message: (text: string) => void;
  readonly download: (name: string, content: unknown) => void;
  readonly refreshListings: () => Promise<void>;
  readonly setMatchingPolicy: (policy: MatchingPolicy) => void;
}
function node<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  return element;
}
const short = (value: string): string => value.length <= 24 ? value : `${value.slice(0, 12)}…${value.slice(-8)}`;
const ids = createUuidV7Generator();

/** Explicit, signed file exchange only. Suggestions never authorize inventory or consent. */
export function mountBarter(options: BarterMountOptions): { refresh(): Promise<void>; destroy(): void } {
  const { container, session } = options;
  let destroyed = false;
  let inputs: BarterInputs | undefined;
  const root = node('section');
  root.setAttribute('aria-label', 'Local barter coordination');
  root.append(node('h2', 'Local barter coordination'), node('p', 'Exchange signed listing, want and coordination files with each participant. Nothing is delivered automatically. Local reservations do not guarantee global inventory exclusivity.'));
  const trustLabel = node('label');
  const trust = node('input'); trust.type = 'checkbox';
  trustLabel.append(trust, document.createTextNode(' Include unfamiliar signing identities in cycle discovery (a signature does not establish a person’s identity).'));
  root.append(trustLabel);
  const blockedLabel = node('label', 'Blocked signing identities (one did:key per line, current session)');
  const blocked = node('textarea'); blocked.rows = 2; blockedLabel.append(blocked); root.append(blockedLabel);
  const policy = (): MatchingPolicy => {
    const blockedOwners = blocked.value.split(/\s+/u).filter(Boolean);
    if (blockedOwners.length > 2000) throw new Error('Too many blocked identities');
    for (const principal of blockedOwners) publicKeyFromDid(principal);
    const current = { enabled: trust.checked, blockedOwners }; options.setMatchingPolicy(current); return current;
  };
  trust.addEventListener('change', () => run(async () => { policy(); }));
  blocked.addEventListener('change', () => run(async () => { policy(); }));
  const wantForm = node('form');
  const offered = node('select'); offered.required = true;
  const requested = node('select'); requested.required = true;
  const offerLabel = node('label', 'I offer my published item'); offerLabel.append(offered);
  const requestLabel = node('label', 'I want this retained peer item'); requestLabel.append(requested);
  const wantSubmit = node('button', 'Sign and download this want'); wantSubmit.type = 'submit';
  wantForm.append(offerLabel, requestLabel, wantSubmit);
  root.append(wantForm, node('p', 'Wants become eligible after the specification’s 15-minute aging period. Each want expires after seven days. Import every referenced listing before discovering cycles.'));
  const fileLabel = node('label', 'Import a signed want, proposal, consent, reservation or withdrawal JSON file');
  const file = node('input'); file.type = 'file'; file.accept = '.json,application/json'; fileLabel.append(file); root.append(fileLabel);
  const summary = node('p'); summary.setAttribute('role', 'status'); root.append(summary);
  const suggestions = node('div');
  const coordinations = node('div');
  const holds = node('div');
  const run = (fn: () => Promise<void>) => { void options.action(async () => { if (destroyed) throw new Error('This vault is locked'); await fn(); }); };
  const button = (label: string, fn: () => Promise<void>): HTMLButtonElement => {
    const b = node('button', label); b.type = 'button'; b.addEventListener('click', () => run(fn)); return b;
  };
  root.append(button('Refresh barter records', refresh), button('Discover compatible cycles', discover), suggestions, coordinations, holds);
  container.replaceChildren(root);

  function live(): void { if (destroyed) throw new Error('This vault is locked'); }
  async function load(): Promise<BarterInputs> {
    live(); const result = await options.query('mutiny.alpha.inputs', {}); live(); return result as BarterInputs;
  }
  async function signed(type: string, payload: unknown) {
    live(); return signEnvelope(session.identity, { type, payload, createdAt: new Date().toISOString(), seq: 1, prev: null });
  }
  async function coordinationRows(): Promise<StoredRecord<ReturnType<typeof coordinationRepo.schema.parse>>[]> {
    const page = await options.query('mutiny.coordination.list', {}) as { items: StoredRecord<unknown>[] };
    return page.items.map(row => ({ ...row, data: coordinationRepo.schema.parse(row.data) }));
  }
  async function ingest(envelope: unknown): Promise<void> {
    policy();
    const verified = await verifyEnvelope(envelope);
    if (verified.type === WANT_TYPE) { parseWant(verified.payload); await options.command('mutiny.want.retain', { envelope: verified }); return; }
    if (![PROPOSAL_TYPE, CONSENT_TYPE, RESERVATION_TYPE, WITHDRAWAL_TYPE].includes(verified.type)) throw new Error('Import listings using the peer listing control. Unsupported barter file type.');
    const payload = verified.payload as { subjectId?: unknown };
    if (typeof payload?.subjectId !== 'string') throw new Error('Coordination subject is missing');
    const previous = (await coordinationRows()).find(row => row.id === payload.subjectId);
    await options.command('mutiny.coordination.ingest', { envelope: verified, expectedRevision: previous?.revision ?? 0 });
  }
  wantForm.addEventListener('submit', event => { event.preventDefault(); run(async () => {
    const current = await load();
    const local = current.listings.find(row => row.data.publicationCid === offered.value && row.data.ownerId === session.principal && row.data.status === 'published' && row.data.barterOptIn);
    const peer = current.retained.find(row => row.data.cid === requested.value && row.data.projection && !row.data.conflicted && row.data.ownerId !== session.principal);
    if (!local || !peer || !peer.data.projection || Date.parse(peer.data.projection.expiresAt) <= Date.now()) throw new Error('Choose currently published own and peer items.');
    const envelope = await signed(WANT_TYPE, { offeringListingCid: offered.value, requestedListingCid: requested.value, expiresAt: new Date(Date.now() + 7 * 86400000).toISOString() });
    await ingest(envelope); options.download(`want-${envelope.cid}.json`, envelope);
    options.message('Want signed and saved locally. Share its file and the referenced listings; matching starts after the 15-minute aging period.'); await refresh();
  }); });
  file.addEventListener('change', () => run(async () => {
    try {
      const selected = file.files?.[0]; if (!selected) throw new Error('Choose a signed JSON file');
      if (selected.size > MAX_ENVELOPE_BYTES) throw new Error('File exceeds the 1 MiB statement limit');
      await ingest(JSON.parse(await selected.text()) as unknown); options.message('Signed statement verified and saved locally.'); await refresh();
    } finally { file.value = ''; }
  }));

  async function discover(): Promise<void> {
    if (!trust.checked) throw new Error('Explicitly choose whether to include unfamiliar signing identities before discovery.');
    inputs = await load();
    const now = Date.now();
    const graph = await admitSignedGraph(inputs.listingStatements, inputs.wantStatements, { now, localPrincipal: session.principal, optedIn: true, includeUnknownIdentities: true, blockedOwners: policy().blockedOwners });
    const result = await discoverCycles(graph.edges, { now, localPrincipal: session.principal });
    live(); suggestions.replaceChildren(node('h3', 'Suggestions — no commitment'));
    suggestions.append(node('p', `${result.suggestions.length} suggestions; ${graph.rejected} wants excluded; search cutoff: ${result.stats.truncated}. Time-limited results can vary between devices.`));
    for (const suggestion of result.suggestions) {
      const article = node('article'); article.className = 'card';
      article.append(node('h4', `${suggestion.legs.length}-party cycle`));
      const description = node('ol');
      for (const leg of suggestion.legs) description.append(node('li', `${short(leg.giverId)} gives item ${leg.inventoryItemId} to ${short(leg.receiverId)} (${leg.valueMinor} minor units ${leg.currency}).`));
      article.append(description, button('Propose this exact cycle', async () => {
        const fresh = await load(); const createdAt = Date.now();
        const latest = await admitSignedGraph(fresh.listingStatements, fresh.wantStatements, { now: createdAt, localPrincipal: session.principal, optedIn: trust.checked, includeUnknownIdentities: trust.checked, blockedOwners: policy().blockedOwners });
        const latestResult = await discoverCycles(latest.edges, { now: createdAt, localPrincipal: session.principal });
        if (!latestResult.suggestions.some(s => s.cycleKey === suggestion.cycleKey)) throw new Error('This suggestion is no longer admissible. Discover again.');
        const proposal = await prepareProposal({ subjectId: ids.next(), coordinatorId: session.principal, revisionNo: 1, previousHash: null, legs: suggestion.legs, createdAt, consentDeadline: createdAt + 3600000, executionWindowMs: 86400000 }, createdAt);
        const envelope = await signed(PROPOSAL_TYPE, proposal.snapshot); await ingest(envelope);
        options.download(`proposal-${proposal.snapshot.subjectId}.json`, envelope);
        options.message('Immutable proposal signed and saved. No consent or reservation was created. Participants have one hour to consent, followed by a one-day execution window.'); await refresh();
      })); suggestions.append(article);
    }
  }

  async function refresh(): Promise<void> {
    await options.command('mutiny.coordination.refresh', {});
    inputs = await load(); live();
    offered.replaceChildren(); requested.replaceChildren();
    const placeholder = (select: HTMLSelectElement, label: string) => { const choice = node('option', label); choice.value = ''; select.append(choice); };
    placeholder(offered, 'Select your offered item'); placeholder(requested, 'Select the peer item you want');
    for (const row of inputs.listings) if (row.data.ownerId === session.principal && row.data.status === 'published' && row.data.barterOptIn && row.data.publicationCid && row.data.onHand === 1) {
      const choice = node('option', row.data.title); choice.value = row.data.publicationCid; offered.append(choice);
    }
    for (const row of inputs.retained) {
      const p = row.data.projection;
      if (!p || row.data.conflicted || row.data.ownerId === session.principal || !p.barterOptIn || p.availability !== 'available' || Date.parse(p.expiresAt) <= Date.now()) continue;
      const choice = node('option', `${p.title} — ${short(p.ownerId)}`); choice.value = row.data.cid; requested.append(choice);
    }
    summary.textContent = `${inputs.wants.length} signed wants retained. Listings and wants remain local until you share their files.`;
    coordinations.replaceChildren(node('h3', 'Proposals and coordination'));
    const rows = await coordinationRows();
    for (const row of rows) renderCoordination(row);
    if (!rows.length) coordinations.append(node('p', 'No proposals. Discover a cycle or import a proposal that names your principal.'));
    holds.replaceChildren(node('h3', 'Local inventory reservations'));
    for (const hold of inputs.holds.filter(r => r.data.state === 'active' && Date.parse(r.data.expiresAt) > Date.now())) {
      const article = node('article');
      article.append(node('p', `Item ${hold.data.listingId} reserved for ${hold.data.subjectId} until ${hold.data.expiresAt}. This is a local hold.`));
      const related = rows.find(row => row.id === hold.data.subjectId && ['proposed', 'committed'].includes(row.data.state.status));
      article.append(button(related ? 'Withdraw and release my hold' : 'Release orphaned local hold', async () => {
        if (related) {
          const proposal = related.data.state.proposal;
          const envelope = await signed(WITHDRAWAL_TYPE, { subjectId: related.id, revisionHash: proposal.revisionHash, revisionNo: proposal.snapshot.revisionNo, reason: 'dropout' });
          await ingest(envelope); options.download(`withdrawal-${related.id}.json`, envelope);
          options.message('Withdrawal saved and local hold released. Share the signed withdrawal with every participant.');
        } else {
          await options.command('bazaar.inventory.release', { holdId: hold.id, expectedRevision: hold.revision });
          options.message('Orphaned local hold released. Review and share any related coordination evidence with peers.');
        }
        await refresh();
      }));
      holds.append(article);
    }
  }
  function renderCoordination(row: StoredRecord<ReturnType<typeof coordinationRepo.schema.parse>>): void {
    const state = row.data.state; const proposal = state.proposal; const snapshot = proposal.snapshot;
    const article = node('article'); article.className = 'card';
    article.append(node('h4', `Proposal ${short(row.id)} · ${state.status}`), node('p', `Revision ${snapshot.revisionNo}, digest ${proposal.revisionHash}. Consent deadline ${new Date(snapshot.consentDeadline).toISOString()}. ${state.reason ?? ''}`));
    const legs = node('ol');
    for (const leg of snapshot.legs) legs.append(node('li', `${short(leg.giverId)} gives ${leg.inventoryItemId} to ${short(leg.receiverId)}. Consent: ${state.consentCids[leg.giverId] ? 'signed' : 'missing'}; reservation: ${state.reservationCids[leg.giverId] ? 'signed claim' : 'missing'}.`));
    article.append(legs);
    article.append(button('Download all signed evidence files', async () => {
      const latest = (await coordinationRows()).find(r => r.id === row.id);
      if (!latest) throw new Error('Proposal no longer exists');
      for (const evidence of latest.data.state.evidence) options.download(`${evidence.envelope.type.split('/')[0]}-${evidence.envelope.cid}.json`, evidence.envelope);
      options.message('Evidence files requested for download. Browser settings may require allowing multiple downloads. Share every file with participants.');
    }));
    if (state.status === 'proposed' && snapshot.consentDeadline > Date.now()) {
      article.append(button('Reserve my item and download signed claim', async () => {
        const latest = await load();
        const leg = snapshot.legs.find(l => l.giverId === session.principal);
        const listing = leg && latest.listings.find(r => r.id === leg.inventoryItemId);
        if (!leg || !listing || listing.data.publicationCid !== leg.listingCid) throw new Error('Your proposed item changed. Renegotiate this proposal.');
        const result = await options.command('bazaar.inventory.reserve', { listingId: listing.id, expectedRevision: listing.revision, holdId: ids.next(), subjectId: row.id, revisionHash: proposal.revisionHash, expiresAt: new Date(snapshot.consentDeadline + snapshot.executionWindowMs).toISOString() }) as { envelope: unknown };
        options.download(`reservation-${row.id}.json`, result.envelope);
        try { await ingest(result.envelope); }
        catch (error) { await refresh(); throw new Error(`The local hold was saved and its file downloaded, but coordination import failed. Release it below or retry importing the file. ${error instanceof Error ? error.message : ''}`); }
        options.message('Your item is reserved locally. Share the signed reservation. Consent is still a separate action.'); await refresh();
      }));
      article.append(button('I consent to this exact proposal', async () => {
        if (!trust.checked) throw new Error('Explicitly accept the included signing identities before consenting.');
        policy();
        const latest = (await coordinationRows()).find(r => r.id === row.id);
        if (!latest || latest.data.state.proposal.revisionHash !== proposal.revisionHash) throw new Error('Proposal changed; review its new terms first.');
        const result = await options.command('mutiny.alpha.consent', { subjectId: row.id, revisionHash: proposal.revisionHash, expectedRevision: latest.revision }) as { envelope: unknown };
        options.download(`consent-${row.id}.json`, result.envelope);
        options.message('Your explicit consent was saved and downloaded. Share it with all participants; remote delivery is unknown.'); await refresh();
      }));
    }
    if (state.status === 'proposed' || state.status === 'committed') article.append(button('Withdraw from this proposal', async () => {
      const envelope = await signed(WITHDRAWAL_TYPE, { subjectId: row.id, revisionHash: proposal.revisionHash, revisionNo: snapshot.revisionNo, reason: 'dropout' });
      await ingest(envelope); options.download(`withdrawal-${row.id}.json`, envelope);
      options.message('Withdrawal saved locally. Share it with every participant. This cannot undo a physical exchange.'); await refresh();
    }));
    if (state.status === 'frozen') article.append(node('p', 'Conflicting signed commitments froze this coordination. Review the evidence and explicitly negotiate a new proposal; no winner is chosen automatically.'));
    coordinations.append(article);
  }
  return { refresh, destroy() { destroyed = true; options.setMatchingPolicy({ enabled: false, blockedOwners: [] }); inputs = undefined; container.replaceChildren(); } };
}
