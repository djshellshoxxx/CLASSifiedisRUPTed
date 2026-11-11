import { createBarterRuntime, barterCodecs } from './barter-runtime.ts';
import { mountBarter } from './barter.ts';
import { createBus, createRegistry, createSystemClock, createUuidV7Generator, z, type Bus } from '../../../packages/kernel/src/index.ts';
import { openVault, backupCodec, type UnlockedVault } from '../../../packages/vault/src/index.ts';
import { signEnvelope, verifyEnvelope, MAX_ENVELOPE_BYTES } from '../../../packages/federation/src/index.ts';
import { bazaarDefinitions, listingSchema, listingRepo, publicationRepo, inventoryHoldRepo, validatePublicationRecord } from '../../../packages/bazaar/src/index.ts';
import { discoveryDefinitions, retainedListingRepo, validateRetainedRecord, type RetainedListing } from '../../../packages/discovery/src/index.ts';

const codecs = [
  ...barterCodecs,
  {
    ...backupCodec(listingRepo),
    async restoreData(input: unknown, principal: string) {
      const data = listingRepo.schema.parse(input);
      if (data.ownerId !== principal) throw new Error('Backup listing belongs to another principal');
      return data;
    },
  },
  { ...backupCodec(publicationRepo), validate: (input: unknown) => validatePublicationRecord(input, verifyEnvelope) },
  {
    ...backupCodec(inventoryHoldRepo),
    async restoreData(input: unknown, principal: string) {
      const data = inventoryHoldRepo.schema.parse(input);
      if (data.ownerId !== principal) throw new Error('Backup reservation belongs to another principal');
      return data;
    },
  },
  { ...backupCodec(retainedListingRepo), validate: (input: unknown) => validateRetainedRecord(input, verifyEnvelope) },
];
const CATEGORY = '0195aaaa-0000-7000-8000-000000000001';
const ids = createUuidV7Generator();
let unlocked: UnlockedVault | undefined;
let bus: Bus | undefined;
let busy = false;
let barter: ReturnType<typeof mountBarter> | undefined;
function element<T extends HTMLElement>(id: string): T {
  const value = document.getElementById(id);
  if (!value) throw new Error(`Missing interface element: ${id}`);
  return value as T;
}
function message(text: string): void { element('status').textContent = text; }
function report(error: unknown): void {
  const output = element('error'); output.hidden = false;
  output.textContent = error instanceof Error ? error.message : 'The operation failed. No success was recorded.';
  output.focus();
}
async function action(fn: () => Promise<void>): Promise<void> {
  if (busy) return;
  busy = true; element('error').hidden = true;
  const buttons = [...document.querySelectorAll<HTMLButtonElement>('button')];
  buttons.forEach(button => { button.disabled = true; });
  try { await fn(); } catch (error) { report(error); }
  finally { busy = false; buttons.forEach(button => { button.disabled = false; }); }
}
function current() {
  if (!unlocked || !bus) throw new Error('Unlock your vault first.');
  return { vault: unlocked, bus, context: { actor: { kind: 'user' as const, id: unlocked.principal, roles: ['member'] }, tenantId: unlocked.principal } };
}
async function command(name: string, input: unknown): Promise<unknown> {
  const { bus, context } = current();
  const result = await bus.dispatch(context, name, input, { idempotencyKey: ids.next() });
  if (!result.ok) throw new Error(`${result.error.code}: the operation was not applied. Check your input and current listing state.`);
  return result.value.value;
}
async function query(name: string, input: unknown): Promise<unknown> {
  const { bus, context } = current(); const result = await bus.query(context, name, input);
  if (!result.ok) throw new Error(`${result.error.code}: could not read local data.`);
  return result.value.value;
}
function download(name: string, content: unknown): void {
  const url = URL.createObjectURL(new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
async function readFile(input: HTMLInputElement, maxBytes: number): Promise<unknown> {
  const file = input.files?.[0];
  if (!file) throw new Error('Choose a JSON file first.');
  if (file.size > maxBytes) throw new Error('The selected file exceeds the import limit.');
  return JSON.parse(await file.text()) as unknown;
}
function node<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] {
  const output = document.createElement(tag); if (text !== undefined) output.textContent = text; return output;
}
function button(text: string, fn: () => Promise<void>) {
  const output = node('button', text); output.addEventListener('click', () => { void action(fn); }); return output;
}
function card(title: string, description: string, detail: string) {
  const article = node('article'); article.className = 'card';
  article.append(node('h3', title), node('p', description), node('p', detail)); return article;
}
async function refresh(): Promise<void> {
  const page = z.object({ items: z.array(z.object({ id: z.string(), revision: z.number(), data: listingSchema })) }).parse(await query('bazaar.listing.list', {}));
  const list = element('listings'); list.replaceChildren();
  if (!page.items.length) list.append(node('p', 'No listings yet. Save your first local draft above.'));
  for (const item of page.items) {
    const article = card(item.data.title, item.data.description, `${item.data.status} · revision ${item.revision} · ${item.data.barterOptIn ? 'barter enabled' : 'barter disabled'}`);
    const actions = node('div'); actions.className = 'actions';
    if (item.data.status === 'draft' || item.data.status === 'unpublished') actions.append(button('Publish signed file', async () => {
      const response = z.object({ envelope: z.unknown() }).parse(await command('bazaar.listing.publish', { listingId: item.id, expectedRevision: item.revision }));
      const verified = await verifyEnvelope(response.envelope);
      download(`listing-${item.id}.json`, verified); message('Published locally. Save and share the signed file explicitly; nothing was sent.'); await refresh();
    }));
    if (item.data.status === 'published') actions.append(button('Unpublish', async () => {
      const response = z.object({ envelope: z.unknown() }).parse(await command('bazaar.listing.unpublish', { listingId: item.id, expectedRevision: item.revision }));
      download(`withdraw-listing-${item.id}.json`, response.envelope); message('Unpublished locally. Share the signed withdrawal with peers who retained your listing.'); await refresh();
    }));
    if (item.data.status === 'unpublished') actions.append(button('Archive', async () => {
      await command('bazaar.listing.archive', { listingId: item.id, expectedRevision: item.revision }); message('Listing archived.'); await refresh();
    }));
    article.append(actions); list.append(article);
  }
  await refreshPeers();
  await barter?.refresh();
}
async function refreshPeers(): Promise<void> {
  const result = await query('discovery.listing.search', { query: element<HTMLInputElement>('search').value });
  const data = z.object({ items: z.array(z.unknown()), staleOrExcluded: z.number() }).parse(result);
  const list = element('peers'); list.replaceChildren();
  for (const value of data.items) {
    const retained = value as RetainedListing;
    const p = retained.projection;
    if (!p) continue;
    list.append(card(p.title, p.description, `Peer-signed · ${p.regionCell} · expires ${p.expiresAt} · observed ${retained.observedAt}`));
  }
  if (!data.items.length) list.append(node('p', 'No matching retained peer listings. Import a signed file to start.'));
  if (data.staleOrExcluded) list.append(node('p', `${data.staleOrExcluded} expired, conflicted or filtered records excluded.`));
}
async function connect(session: UnlockedVault): Promise<void> {
  unlocked = session;
  const definitions = bazaarDefinitions({ categoryAllowed: id => id === CATEGORY,
    signProjection: async (type, payload, seq, prev) => ({ ...await signEnvelope(session.identity, { type, payload, seq, prev, createdAt: new Date().toISOString() }) }),
    verifyProjection: input => verifyEnvelope(input),
  });
  const barterRuntime = createBarterRuntime(session);
  bus = createBus({ registry: createRegistry().add(...definitions.all, ...discoveryDefinitions({ verifyEnvelope }).all, ...barterRuntime.definitions), storage: session.storage,
    clock: createSystemClock(), ids,
    authz: { authorize: (actor, _capability, _resource, context) => context.tenantId === session.principal && actor.kind === 'user' && actor.id === session.principal && unlocked === session ? { allow: true } : { allow: false, code: 'FORBIDDEN' } },
    origin: `vault:${session.principal}` });
  element('access').hidden = true; element('workspace').hidden = false; element('principal').textContent = session.principal;
  barter?.destroy();
  barter = mountBarter({ container: element('barter'), session, command, query, action, message, download, refreshListings: refresh, setMatchingPolicy: barterRuntime.setMatchingPolicy });
  await refresh(); message('Vault unlocked. Local changes are persisted in this browser.');
}
element<HTMLFormElement>('unlock-form').addEventListener('submit', event => {
  event.preventDefault(); const form = event.currentTarget as HTMLFormElement;
  const submitter = (event as SubmitEvent).submitter as HTMLButtonElement | null;
  const data = new FormData(form); const name = String(data.get('vault')); const passphrase = String(data.get('passphrase'));
  void action(async () => {
    if (!globalThis.isSecureContext || !crypto.subtle) throw new Error('Open this application on localhost or HTTPS to use browser cryptography.');
    const vault = await openVault({ name, codecs });
    try { await connect(submitter?.value === 'create' ? await vault.create(passphrase) : await vault.unlock(passphrase)); }
    catch (error) { await vault.close(); barter?.destroy(); barter = undefined; unlocked = undefined; bus = undefined; element('workspace').hidden = true; element('access').hidden = false; throw error; }
    (form.elements.namedItem('passphrase') as HTMLInputElement).value = '';
  });
});
element('lock').addEventListener('click', () => { void action(async () => {
  const session = unlocked; barter?.destroy(); barter = undefined; unlocked = undefined; bus = undefined;
  if (session) await session.lock();
  element('workspace').hidden = true; element('access').hidden = false;
  element('listings').replaceChildren(); element('peers').replaceChildren(); element('principal').textContent = '';
  element<HTMLInputElement>('backup-password').value = ''; element<HTMLFormElement>('listing-form').reset(); element<HTMLInputElement>('search').value = ''; element<HTMLInputElement>('peer-file').value = ''; message('Vault locked.');
}); });
element<HTMLFormElement>('listing-form').addEventListener('submit', event => {
  event.preventDefault(); const form = event.currentTarget as HTMLFormElement; const data = new FormData(form);
  void action(async () => {
    await command('bazaar.listing.create', { listingId: ids.next(), title: String(data.get('title')), description: String(data.get('description')),
      kind: data.get('kind'), condition: data.get('condition'), categoryId: CATEGORY, regionCell: data.get('region'),
      value: { amount: String(data.get('amount')), currency: 'CAD' }, barterOptIn: data.get('barter') === 'on' });
    form.reset(); message('Draft saved locally. It has not been shared.'); await refresh();
  });
});
element<HTMLInputElement>('peer-file').addEventListener('change', event => { const input = event.currentTarget as HTMLInputElement;
  void action(async () => { try { await command('discovery.listing.retain', { envelope: await readFile(input, MAX_ENVELOPE_BYTES) }); message('Peer statement verified and retained locally.'); await refreshPeers(); await barter?.refresh(); } finally { input.value = ''; } });
});
let searchRevision = 0;
element('search').addEventListener('input', () => {
  const revision = ++searchRevision;
  const run = () => { if (revision !== searchRevision) return; if (busy) { setTimeout(run, 80); return; } void action(refreshPeers); };
  setTimeout(run, 120);
});
element('backup').addEventListener('click', () => { void action(async () => {
  const password = element<HTMLInputElement>('backup-password');
  try { download('classrup-encrypted-backup.json', await current().vault.exportBackup(password.value)); message('Encrypted backup downloaded. Keep its passphrase separately.'); }
  finally { password.value = ''; }
}); });
element<HTMLFormElement>('restore-form').addEventListener('submit', event => {
  event.preventDefault(); const form = event.currentTarget as HTMLFormElement;
  void action(async () => {
    const data = new FormData(form); const name = String(data.get('restore-name')); const passphrase = String(data.get('restore-password'));
    const input = element<HTMLInputElement>('restore-file');
    const vault = await openVault({ name, codecs });
    try { const backup = await readFile(input, 24 * 1024 * 1024); await connect(await vault.restoreBackup(backup, passphrase)); form.reset(); message('Backup restored into this new vault. Peer availability must be checked again.'); }
    catch (error) { await vault.close(); barter?.destroy(); barter = undefined; unlocked = undefined; bus = undefined; element('workspace').hidden = true; element('access').hidden = false; element('listings').replaceChildren(); element('peers').replaceChildren(); throw error; }
    finally { input.value = ''; (form.elements.namedItem('restore-password') as HTMLInputElement).value = ''; }
  });
});
function networkStatus() { element('network').textContent = navigator.onLine ? 'Local mode · no relay configured. Files are shared only when you choose.' : 'Offline · local records remain available. Peer freshness cannot be confirmed.'; }
window.addEventListener('online', networkStatus); window.addEventListener('offline', networkStatus); networkStatus();
if ('serviceWorker' in navigator && globalThis.isSecureContext) {
  void navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {
    message('Offline asset installation failed. Local records are intact; reconnect to load the app again.');
  });
}

// Install all vault form event handlers before revealing or enabling vault access.
element('access').removeAttribute('inert');
element('access').hidden = false;
