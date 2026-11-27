import { productionBackupCodecs } from './backup-codecs.ts';
import { describeBackupCoverage, describeAttachmentCoverage, readBackupInspection } from './backup-coverage.ts';
import { protectVaultSession, runForSession } from './vault-session.ts';
import { defaultPeerSearch, parsePeerSearch } from './peer-search.ts';
import { createBarterRuntime } from './barter-runtime.ts';
import { mountBarter } from './barter.ts';
import { mountNotifications } from './notifications.ts';
import { drainNotificationDelivery } from './notification-delivery.ts';
import { bindActionsToSession, createActionQueue } from './action-queue.ts';
import { listingHistory } from './listing-history.ts';
import { listingClosure } from './listing-closure.ts';
import { createListingMaintenance } from './listing-maintenance.ts';
import { mountListingEditor } from './listing-editor.ts';
import { mountLocationPreferences } from './location-preferences.ts';
import { mountBlindMatch } from './blindmatch.ts';
import { createLocalCandidateLoader } from './blindmatch-candidates.ts';
import { localNotificationDefinitions } from '../../../packages/notify/src/index.ts';
import { formatMoney, type MoneyValue } from '../../../packages/i18n/src/index.ts';
import { createBus, createOutboxDispatcher, createRegistry, createSystemClock, createUuidV7Generator, z, type Bus, type OutboxDispatcher } from '../../../packages/kernel/src/index.ts';
import { openVault, type UnlockedVault } from '../../../packages/vault/src/index.ts';
import { signEnvelope, verifyEnvelope, MAX_ENVELOPE_BYTES } from '../../../packages/federation/src/index.ts';
import { bazaarDefinitions, listingSchema, archiveRecordRepo } from '../../../packages/bazaar/src/index.ts';
import { discoveryDefinitions, locationDefinitions, type RetainedListing } from '../../../packages/discovery/src/index.ts';


const CATEGORY = '0195aaaa-0000-7000-8000-000000000001';
// The composition is qualified separately; retain FUTURE/off until the documented activation gates pass.
const ENABLE_LOCAL_BLINDMATCH_PREVIEW = false;
const ids = createUuidV7Generator();
let unlocked: UnlockedVault | undefined;
let bus: Bus | undefined;
const queueAction = createActionQueue();
let appliedPeerSearch = defaultPeerSearch();
let listingCursor: string | undefined;
const listingPages: (string | undefined)[] = [];
function resetListingPage() { listingCursor = undefined; listingPages.length = 0; }
let barter: ReturnType<typeof mountBarter> | undefined;
let notifications: ReturnType<typeof mountNotifications> | undefined;
let notificationOutbox: OutboxDispatcher | undefined;
let lastNotificationSweep = 0;
let listingEditor: ReturnType<typeof mountListingEditor> | undefined;
let locationPreferences: ReturnType<typeof mountLocationPreferences> | undefined;
let blindMatch: ReturnType<typeof mountBlindMatch> | undefined;
let sessionProtection: ReturnType<typeof protectVaultSession> | undefined;
let closingSession: Promise<void> | undefined;
let storageCloseFailed = false;
let listingMaintenance: ReturnType<typeof createListingMaintenance> | undefined;
let maintenanceTimer: ReturnType<typeof setInterval> | undefined;
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
function action(fn: () => Promise<void>): Promise<void> {
  return queueAction(async () => {
    const startedSession = unlocked;
    element('error').hidden = true;
    // BlindMatch owns its independent cancellation and mutation controls.
    const buttons = [...document.querySelectorAll<HTMLButtonElement>('button')]
      .filter(button => !button.closest('#blindmatch')).map(button => ({ button, disabled: button.disabled }));
    buttons.forEach(({ button }) => { button.disabled = true; });
    try { await fn(); } catch (error) {
      // An automatic lock may revoke an in-flight action. Keep its private result
      // and any obsolete error out of the newly locked (or replaced) session.
      if (!startedSession || unlocked === startedSession) report(error);
    }
    finally { buttons.forEach(({ button, disabled }) => { button.disabled = disabled; }); }
  });
}
const vaultAction = bindActionsToSession(action, () => unlocked);
function current() {
  if (!unlocked || !bus) throw new Error('Unlock your vault first.');
  return { vault: unlocked, bus, context: { actor: { kind: 'user' as const, id: unlocked.principal, roles: ['member'] }, tenantId: unlocked.principal } };
}
async function command(name: string, input: unknown): Promise<unknown> {
  const { bus, context, vault } = current();
  return runForSession(vault, () => unlocked, async () => {
    const result = await bus.dispatch(context, name, input, { idempotencyKey: ids.next() });
    if (!result.ok) throw new Error(result.error.code === 'BAZAAR_ARCHIVE_HOLD_ACTIVE'
      ? 'This listing has an active inventory hold. Withdraw from its proposal in Barter coordination, then try again.'
      : `${result.error.code}: the operation was not applied. Check your input and current listing state.`);
    return result.value.value;
  }, syncNotifications);
}
async function syncNotifications(): Promise<void> {
  const session = unlocked;
  const outbox = notificationOutbox;
  const inbox = notifications;
  if (!session || !outbox) return;
  try {
    const { bus, context, vault } = current();
    const now = Date.now();
    if (lastNotificationSweep === 0 || now - lastNotificationSweep >= 3600000 || now < lastNotificationSweep) {
      const swept = await bus.dispatch(context, 'notify.notification.sweep', {});
      if (unlocked !== session) return;
      if (!swept.ok) throw new Error('Inbox maintenance failed');
      lastNotificationSweep = now;
    }
    const pending = await drainNotificationDelivery(outbox, vault.storage, bus.registry);
    if (unlocked !== session) return;
    await inbox?.refresh();
    if (unlocked !== session) return;
    element('notification-delivery-status').textContent = pending
      ? 'Some local updates could not be processed. Review barter coordination for the current state.' : '';
  } catch {
    if (unlocked !== session) return;
    // The domain command has already committed. An inbox failure must not report it as rolled back.
    element('notification-delivery-status').textContent = 'Local notifications are unavailable. Your saved changes remain intact.';
  }
}
async function query(name: string, input: unknown): Promise<unknown> {
  const { bus, context, vault } = current();
  return runForSession(vault, () => unlocked, async () => {
    const result = await bus.query(context, name, input);
    if (!result.ok) throw new Error(`${result.error.code}: could not read local data.`);
    return result.value.value;
  });
}
function download(session: UnlockedVault, name: string, content: unknown): void {
  if (unlocked !== session) throw new Error('Vault session ended. Unlock before exporting.');
  const url = URL.createObjectURL(new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
async function readFile(file: File | undefined, maxBytes: number): Promise<unknown> {
  if (!file) throw new Error('Choose a JSON file first.');
  if (file.size > maxBytes) throw new Error('The selected file exceeds the import limit.');
  return JSON.parse(await file.text()) as unknown;
}
function node<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] {
  const output = document.createElement(tag); if (text !== undefined) output.textContent = text; return output;
}
function button(text: string, fn: () => Promise<void>) {
  const session = unlocked;
  const output = node('button', text); output.addEventListener('click', () => { if (unlocked === session) void vaultAction(fn); }); return output;
}
// The alpha editor declares CAD amounts in cents. Other signed currency codes may
// be custom, so keep their exact minor units until the currency registry is available.
const listingCurrency = { code: 'CAD', exponent: 2, kind: 'iso' } as const;
function card(title: string, description: string, detail: string, value?: MoneyValue) {
  const article = node('article'); article.className = 'card';
  article.append(node('h3', title), node('p', description));
  if (value) {
    const formatted = value.currency === listingCurrency.code
      ? formatMoney(value, listingCurrency, navigator.language, { display: 'code' })
      : undefined;
    const amount = formatted?.ok ? formatted.value : `${value.amount} minor units (${value.currency})`;
    article.append(node('p', `Declared value: ${amount}`));
  }
  article.append(node('p', detail));
  return article;
}
async function refreshListings(): Promise<void> {
  const session = current().vault;
  const loadedCursor = listingCursor;
  const page = z.object({ items: z.array(z.object({ id: z.string(), revision: z.number(), data: listingSchema })), nextCursor: z.string().optional() }).parse(await query('bazaar.listing.list', listingCursor ? { cursor: listingCursor } : {}));
  const list = element('listings'); list.replaceChildren();
  if (!page.items.length) list.append(node('p', 'No listings yet. Save your first local draft above.'));
  for (const item of page.items) {
    const article = card(item.data.title, item.data.description, `${item.data.status} · revision ${item.revision} · ${item.data.barterOptIn ? 'barter enabled' : 'barter disabled'}`, item.data.value);
    const actions = node('div'); actions.className = 'actions';
    if (item.data.status === 'draft' || item.data.status === 'unpublished') actions.append(button('Edit listing', async () => { listingEditor?.open(item); }));
    if (item.data.status === 'draft' || item.data.status === 'unpublished') actions.append(button('Publish signed file', async () => {
      const response = z.object({ envelope: z.unknown() }).parse(await command('bazaar.listing.publish', { listingId: item.id, expectedRevision: item.revision }));
      const verified = await verifyEnvelope(response.envelope);
      download(session, `listing-${item.id}.json`, verified); message('Published locally. Save and share the signed file explicitly; nothing was sent.'); await refresh();
    }));
    if (item.data.status === 'published') actions.append(button('Unpublish', async () => {
      const response = z.object({ envelope: z.unknown() }).parse(await command('bazaar.listing.unpublish', { listingId: item.id, expectedRevision: item.revision }));
      download(session, `withdraw-listing-${item.id}.json`, response.envelope); message('Unpublished locally. Share the signed withdrawal with peers who retained your listing.'); await refresh();
    }));
    if (item.data.status !== 'archived') actions.append(button('Archive', async () => {
      if (!confirm('Archive this listing? You can restore it for 90 days. Published listings also need their signed withdrawal shared with peers.')) return;
      const result = z.object({ restoreUntil: z.string(), envelope: z.unknown().optional() }).parse(await command('bazaar.listing.archive', { listingId: item.id, expectedRevision: item.revision }));
      if (result.envelope) download(session, `withdraw-listing-${item.id}.json`, result.envelope);
      message(`Archived locally. Restore until ${new Date(result.restoreUntil).toLocaleString()}.${result.envelope ? ' Share the downloaded withdrawal with peers who retained this listing.' : ''}`);
      await refresh();
    }));
    if (item.data.status === 'archived') actions.append(button('Restore listing', async () => {
      const records = z.object({ items: z.array(z.object({ id: z.string(), revision: z.int().positive(), data: archiveRecordRepo.schema })) }).parse(await query('bazaar.archive_record.list_mine', { listingId: item.id, status: 'archived' }));
      if (records.items.length !== 1) throw new Error('No unique restore record is available for this archived listing.');
      const record = records.items[0]!;
      await command('bazaar.listing.restore', { archiveRecordId: record.id, expectedRevision: record.revision });
      message('Listing restored as unpublished. Review and publish it when ready.'); await refresh();
    }));
    if (item.data.publicationCid) actions.append(button(item.data.status === 'published' ? 'Download signed listing again' : 'Download signed withdrawal', async () => {
      const result = z.object({ envelope: z.unknown() }).parse(await query('bazaar.listing.publication', { listingId: item.id }));
      download(session, `${item.data.status === 'published' ? 'listing' : 'withdraw-listing'}-${item.id}.json`, result.envelope);
      message('Verified signed file downloaded. Share it explicitly with peers.');
    }));
    if (['published', 'unpublished', 'expired'].includes(item.data.status)) article.append(listingClosure(item, {
      active: () => unlocked === session, action: vaultAction, command,
      download: (name, value) => download(session, name, value), message, refresh,
    }));
    article.append(actions, listingHistory(item.id, { query, action: vaultAction })); list.append(article);
  }
  const navigation = node('nav'); navigation.setAttribute('aria-label', 'My listing pages'); navigation.className = 'actions';
  if (listingPages.length) navigation.append(button('Previous listings', async () => {
    if (listingCursor !== loadedCursor) return;
    const prior = listingCursor; const cursor = listingPages.pop(); listingCursor = cursor;
    try { await refreshListings(); } catch (error) { listingPages.push(cursor); listingCursor = prior; throw error; }
  }));
  if (page.nextCursor) navigation.append(button('Next listings', async () => {
    if (listingCursor !== loadedCursor) return;
    const prior = listingCursor; listingPages.push(prior); listingCursor = page.nextCursor;
    try { await refreshListings(); } catch (error) { listingPages.pop(); listingCursor = prior; throw error; }
  }));
  list.append(navigation);
}
async function refresh(): Promise<void> {
  await listingMaintenance?.run();
  await refreshListings();
  await refreshPeers();
  await barter?.refresh();
}
async function refreshPeers(): Promise<void> {
  blindMatch?.invalidateResults();
  const result = await query('discovery.listing.search', appliedPeerSearch);
  const data = z.object({ items: z.array(z.unknown()), staleOrExcluded: z.number() }).parse(result);
  const list = element('peers'); list.replaceChildren();
  for (const value of data.items) {
    const retained = value as RetainedListing;
    const p = retained.projection;
    if (!p) continue;
    list.append(card(p.title, p.description, `Peer-signed · ${p.regionCell} · expires ${p.expiresAt} · observed ${retained.observedAt}`, p.value));
  }
  if (!data.items.length) list.append(node('p', 'No matching retained peer listings. Import a signed file to start.'));
  element('peer-search-status').textContent = `${data.items.length} matching retained peer listing${data.items.length === 1 ? '' : 's'}.`;
  if (data.staleOrExcluded) list.append(node('p', `${data.staleOrExcluded} expired, conflicted or filtered records excluded.`));
}
async function connect(session: UnlockedVault): Promise<void> {
  resetPeerSearch();
  unlocked = session;
  sessionProtection?.dispose();
  element<HTMLSelectElement>('vault-idle-minutes').value = '15';
  sessionProtection = protectVaultSession({ document,
    lock: reason => lockSession(session, reason === 'hidden' ? 'Vault locked after 5 minutes in a hidden tab.' : 'Vault locked after inactivity.'),
    onError: () => {}, // lockSession reports close failures for both manual and automatic locks.
  });
  const definitions = bazaarDefinitions({ categoryAllowed: id => id === CATEGORY,
    signProjection: async (type, payload, seq, prev) => ({ ...await signEnvelope(session.identity, { type, payload, seq, prev, createdAt: new Date().toISOString() }) }),
    verifyProjection: input => verifyEnvelope(input),
  });
  const barterRuntime = createBarterRuntime(session);
  const notifyDefinitions = localNotificationDefinitions({ localPrincipal: () => session.principal, isBlocked: barterRuntime.isBlocked, isThreadMuted: () => false });
  const registry = createRegistry().add(...definitions.all, ...discoveryDefinitions({ verifyEnvelope }).all,
    ...locationDefinitions({ localPrincipal: () => session.principal }).all, ...barterRuntime.definitions, ...notifyDefinitions.all);
  bus = createBus({ registry, storage: session.storage,
    clock: createSystemClock(), ids,
    authz: { authorize: (actor, _capability, _resource, context) => context.tenantId === session.principal && actor.kind === 'user' && actor.id === session.principal && unlocked === session ? { allow: true } : { allow: false, code: 'FORBIDDEN' } },
    origin: `vault:${session.principal}` });
  element('access').hidden = true; element('workspace').hidden = false; element('principal').textContent = session.principal;
  barter?.destroy();
  const sessionMessage = (text: string) => { if (unlocked === session) message(text); };
  let blindMatchBlockedOwners: readonly string[] = [];
  blindMatch?.destroy(); blindMatch = undefined;
  if (ENABLE_LOCAL_BLINDMATCH_PREVIEW) {
    const clock = createSystemClock();
    const isCurrent = () => unlocked === session;
    blindMatch = mountBlindMatch({ container: element('blindmatch'), session, clock, isCurrent,
      loadCandidates: createLocalCandidateLoader({ storage: session.storage, principal: session.principal, clock, isCurrent }),
      blockedOwners: () => blindMatchBlockedOwners });
  }
  barter = mountBarter({ container: element('barter'), session, command, query, action: vaultAction, message: sessionMessage,
    download: (name, content) => download(session, name, content), refreshListings: refresh, setMatchingPolicy(policy) {
      barterRuntime.setMatchingPolicy(policy);
      blindMatchBlockedOwners = [...policy.blockedOwners];
      blindMatch?.invalidateResults();
    } });
  notificationOutbox = createOutboxDispatcher({ registry, storage: session.storage, clock: createSystemClock(), ids, origin: `vault:${session.principal}` });
  lastNotificationSweep = 0;
  notifications?.destroy();
  notifications = mountNotifications({ container: element('notifications'), command, query, action: vaultAction, message: sessionMessage, synchronize: syncNotifications });
  listingEditor?.destroy();
  listingEditor = mountListingEditor({ container: element('listing-editor'), command, action: vaultAction, message: sessionMessage, saved: refresh });
  locationPreferences?.destroy();
  const locationView = mountLocationPreferences({ container: element('location-preferences'), command, query, action: vaultAction, message: sessionMessage,
    geolocation: navigator.geolocation,
    applyToListing(cell) {
      if (unlocked !== session) return;
      const input = element<HTMLFormElement>('listing-form').elements.namedItem('region') as HTMLInputElement;
      input.value = cell; input.focus();
      sessionMessage('Coarse area copied into your new listing form. Review it before saving or publishing.');
    },
    applyToSearch(cell) {
      if (unlocked !== session) return;
      const input = element<HTMLInputElement>('search-area'); input.value = cell; input.focus();
      sessionMessage('Home region copied into the local search form. Select Apply search to use it.');
    },
  });
  locationPreferences = locationView;
  listingMaintenance?.dispose();
  listingMaintenance = createListingMaintenance({ command, isActive: () => unlocked === session,
    onStatus(status) {
      if (unlocked !== session) return;
      const summary = `${status.expired} expired; ${status.archived} archived.`;
      element('listing-maintenance-status').textContent = status.phase === 'failed'
        ? `Local listing maintenance paused after ${status.processed} records. ${summary} It will retry while this vault is open.`
        : status.pending ? `Checking local listing lifecycle: ${status.processed} records. ${summary}`
          : `Local listing lifecycle checked. ${summary}`;
    },
  });
  if (maintenanceTimer !== undefined) clearInterval(maintenanceTimer);
  let maintenanceQueued = false;
  maintenanceTimer = setInterval(() => {
    if (maintenanceQueued || unlocked !== session) return;
    maintenanceQueued = true;
    void vaultAction(refresh).finally(() => { maintenanceQueued = false; });
  }, 60_000);
  await runForSession(session, () => unlocked, syncNotifications);
  await runForSession(session, () => unlocked, () => locationView.refresh());
  await runForSession(session, () => unlocked, refresh);
  sessionMessage('Vault unlocked. Local changes are persisted in this browser.');
}
function clearLocalViews() {
  sessionProtection?.dispose(); sessionProtection = undefined;
  listingMaintenance?.dispose(); listingMaintenance = undefined;
  if (maintenanceTimer !== undefined) clearInterval(maintenanceTimer);
  maintenanceTimer = undefined;
  element('listing-maintenance-status').textContent = '';
  resetListingPage();
  listingEditor?.destroy(); listingEditor = undefined;
  locationPreferences?.destroy(); locationPreferences = undefined;
  blindMatch?.destroy(); blindMatch = undefined;
  notifications?.destroy(); notifications = undefined; notificationOutbox = undefined; lastNotificationSweep = 0;
  element('notification-delivery-status').textContent = '';
}
function clearVaultViews(): void {
  // Invalidate queued actions and hide private DOM before waiting for persistence.
  unlocked = undefined; bus = undefined;
  barter?.destroy(); barter = undefined;
  clearLocalViews();
  element('workspace').hidden = true; element('access').hidden = false;
  element('listings').replaceChildren(); element('peers').replaceChildren(); element('principal').textContent = '';
  element('error').hidden = true; element('error').textContent = '';
  element<HTMLInputElement>('backup-password').value = ''; element('backup-coverage').textContent = ''; element<HTMLFormElement>('listing-form').reset(); resetPeerSearch(); element<HTMLInputElement>('peer-file').value = '';
}
async function finishStorageClose(close: () => Promise<void>): Promise<void> {
  const previous = closingSession;
  const pending = (async () => {
    await previous;
    try { await close(); }
    catch { storageCloseFailed = true; report(new Error('Vault locked. Closing storage failed; reload before reopening.')); }
  })();
  closingSession = pending;
  await pending;
  if (closingSession === pending) closingSession = undefined;
}
async function waitForStorageClose(): Promise<void> {
  await closingSession;
  if (storageCloseFailed) throw new Error('Closing storage failed. Reload before reopening a vault.');
}
async function lockSession(session: UnlockedVault, status: string): Promise<void> {
  if (unlocked !== session) return;
  clearVaultViews();
  message(status);
  await finishStorageClose(() => session.lock());
}
element<HTMLSelectElement>('vault-idle-minutes').addEventListener('change', event => {
  const input = event.currentTarget as HTMLSelectElement;
  sessionProtection?.setIdleMinutes(Number(input.value));
});
element<HTMLFormElement>('unlock-form').addEventListener('submit', event => {
  event.preventDefault(); const form = event.currentTarget as HTMLFormElement;
  const submitter = (event as SubmitEvent).submitter as HTMLButtonElement | null;
  const data = new FormData(form); const name = String(data.get('vault')); const passphrase = String(data.get('passphrase'));
  void action(async () => {
    if (unlocked) {
      (form.elements.namedItem('passphrase') as HTMLInputElement).value = '';
      throw new Error('Lock the current vault before opening another one.');
    }
    let vault: Awaited<ReturnType<typeof openVault>> | undefined;
    try {
      await waitForStorageClose();
      if (!globalThis.isSecureContext || !crypto.subtle) throw new Error('Open this application on localhost or HTTPS to use browser cryptography.');
      vault = await openVault({ name, codecs: productionBackupCodecs });
      await connect(submitter?.value === 'create' ? await vault.create(passphrase) : await vault.unlock(passphrase));
    }
    catch (error) {
      clearVaultViews();
      if (vault) { const failedVault = vault; await finishStorageClose(() => failedVault.close()); }
      if (storageCloseFailed) throw new Error('Vault opening failed and storage could not close. Reload before reopening.');
      throw error;
    }
    finally { (form.elements.namedItem('passphrase') as HTMLInputElement).value = ''; }
  });
});
element('lock').addEventListener('click', () => { void vaultAction(async () => {
  const session = unlocked;
  if (session) await lockSession(session, 'Vault locked.');
}); });
element<HTMLFormElement>('listing-form').addEventListener('submit', event => {
  event.preventDefault(); const form = event.currentTarget as HTMLFormElement; const data = new FormData(form);
  void vaultAction(async () => {
    await command('bazaar.listing.create', { listingId: ids.next(), title: String(data.get('title')), description: String(data.get('description')),
      kind: data.get('kind'), condition: data.get('condition'), categoryId: CATEGORY, regionCell: data.get('region'),
      value: { amount: String(data.get('amount')), currency: listingCurrency.code }, barterOptIn: data.get('barter') === 'on' });
    resetListingPage(); form.reset(); message('Draft saved locally. It has not been shared.'); await refresh();
  });
});
element<HTMLInputElement>('peer-file').addEventListener('change', event => { const input = event.currentTarget as HTMLInputElement;
  const file = input.files?.[0];
  const session = unlocked;
  void vaultAction(async () => {
    try {
      if (!session || unlocked !== session) throw new Error('Unlock the original vault and select the file again.');
      const envelope = await readFile(file, MAX_ENVELOPE_BYTES);
      if (unlocked !== session) throw new Error('Unlock the original vault and select the file again.');
      await command('discovery.listing.retain', { envelope });
      message('Peer statement verified and retained locally.'); await refreshPeers(); await barter?.refresh();
    } finally { if (input.files?.[0] === file) input.value = ''; }
  });
});
function resetPeerSearch(): void {
  appliedPeerSearch = defaultPeerSearch();
  element<HTMLFormElement>('peer-search-form').reset();
  element('peer-search-status').textContent = '';
}
element<HTMLFormElement>('peer-search-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  void vaultAction(async () => {
    const next = parsePeerSearch(new FormData(form));
    const previous = appliedPeerSearch;
    appliedPeerSearch = next;
    try { await refreshPeers(); } catch (error) { appliedPeerSearch = previous; throw error; }
  });
});
element('reset-peer-search').addEventListener('click', () => { void vaultAction(async () => {
  resetPeerSearch(); await refreshPeers();
}); });
element('inspect-backup').addEventListener('click', () => { void vaultAction(async () => {
  const session = current().vault;
  element('backup-coverage').textContent = '';
  const { records, attachments } = await runForSession(session, () => unlocked, () => readBackupInspection(session));
  // The required record report survives a failed optional attachment check.
  // Neither report proves complete attachment recovery or qualifies export.
  element('backup-coverage').textContent = `${describeBackupCoverage(records)} ${describeAttachmentCoverage(attachments)}`;
}); });
element('backup').addEventListener('click', () => { void vaultAction(async () => {
  const password = element<HTMLInputElement>('backup-password');
  const session = current().vault;
  try { download(session, 'classrup-encrypted-backup.json', await session.exportBackup(password.value)); message('Encrypted backup downloaded. Keep its passphrase separately.'); }
  finally { password.value = ''; }
}); });
element<HTMLFormElement>('restore-form').addEventListener('submit', event => {
  event.preventDefault(); const form = event.currentTarget as HTMLFormElement;
  const data = new FormData(form); const name = String(data.get('restore-name')); const passphrase = String(data.get('restore-password'));
  const input = element<HTMLInputElement>('restore-file'); const file = input.files?.[0];
  void action(async () => {
    if (unlocked) {
      if (input.files?.[0] === file) input.value = '';
      (form.elements.namedItem('restore-password') as HTMLInputElement).value = '';
      throw new Error('Lock the current vault before restoring a backup.');
    }
    let vault: Awaited<ReturnType<typeof openVault>> | undefined;
    try {
      await waitForStorageClose();
      vault = await openVault({ name, codecs: productionBackupCodecs });
      const backup = await readFile(file, 24 * 1024 * 1024);
      await connect(await vault.restoreBackup(backup, passphrase));
      form.reset(); message('Backup restored into this new vault. Peer availability must be checked again.');
    }
    catch (error) {
      clearVaultViews();
      if (vault) { const failedVault = vault; await finishStorageClose(() => failedVault.close()); }
      if (storageCloseFailed) throw new Error('Vault restore failed and storage could not close. Reload before reopening.');
      throw error;
    }
    finally { if (input.files?.[0] === file) input.value = ''; (form.elements.namedItem('restore-password') as HTMLInputElement).value = ''; }
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
