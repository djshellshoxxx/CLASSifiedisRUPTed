import { expect, test, type Page } from '@playwright/test';
import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { PrivateIntent } from '../../packages/blindmatch/src/index.ts';
import type { StoredRecord } from '../../packages/kernel/src/index.ts';

interface OperationEvidence {
  readonly state: 'fulfilled' | 'rejected';
}
interface LifecycleEvidence {
  readonly baseVersion: number;
  readonly upgrade: { readonly error: string; readonly oldVersion: number; readonly newVersion: number };
  readonly reopenedVersion: number;
  readonly principal: string;
  readonly reopenedPrincipal: string;
  readonly signedBefore: boolean;
  readonly signedAfterReopen: boolean;
  readonly saved: StoredRecord<PrivateIntent>;
  readonly captured: StoredRecord<PrivateIntent>;
  readonly reopened: StoredRecord<PrivateIntent>;
  readonly signer: OperationEvidence;
  readonly retained: OperationEvidence;
  readonly heldRead: OperationEvidence;
  readonly queuedRead: OperationEvidence;
  readonly freshRead: OperationEvidence;
  readonly freshWrite: OperationEvidence;
  readonly callbacks: { readonly queuedRead: number; readonly freshRead: number; readonly freshWrite: number };
}
type FixtureWindow = Window & { __storageLifecycleTest: { runVersionchange(): Promise<LifecycleEvidence> } };
let bundle = '';

test.beforeAll(async () => {
  const result = await build({
    stdin: { contents: `
      import { productionBackupCodecs } from './apps/pwa/src/backup-codecs.ts';
      import { createLocalIntentStore, privateIntentRepo } from './packages/blindmatch/src/index.ts';
      import { createFakeClock, ok, unwrap } from './packages/kernel/src/index.ts';
      import { VAULT_DB_VERSION } from './packages/kernel/src/storage/indexeddb.ts';
      import { publicKeyFromDid } from './packages/identity/src/index.ts';
      import { openVault } from './packages/vault/src/index.ts';

      const clock = createFakeClock('2026-11-27T12:00:00.000Z');
      const name = 'native-storage-lifecycle';
      const databaseName = 'classrup-vault:' + name;
      const passphrase = 'synthetic native storage lifecycle acceptance passphrase';
      const challenge = new TextEncoder().encode('synthetic lifecycle signature challenge');
      const criteria = { query: 'private native invalidation canary', kind: 'sell',
        price: { currency: 'CAD', min: '900719925474099301', max: '900719925474099302' } };

      // Observe both synchronous admission failures and asynchronous outcomes.
      // No exception message, private key or passphrase is returned as evidence.
      function observe(operation) {
        try {
          return Promise.resolve(operation()).then(
            () => ({ state: 'fulfilled' }), () => ({ state: 'rejected' }));
        } catch { return Promise.resolve({ state: 'rejected' }); }
      }
      async function signsCorrectly(identity) {
        const signature = await identity.sign(challenge);
        const publicKey = await crypto.subtle.importKey('raw', publicKeyFromDid(identity.principal),
          'Ed25519', false, ['verify']);
        return crypto.subtle.verify('Ed25519', publicKey, signature, challenge);
      }
      function abortVersionUpgrade() {
        return new Promise((resolve, reject) => {
          const request = indexedDB.open(databaseName, VAULT_DB_VERSION + 1);
          let oldVersion, newVersion;
          request.onupgradeneeded = event => {
            oldVersion = event.oldVersion; newVersion = event.newVersion;
            // Exercise a real versionchange without changing the durable schema.
            request.transaction.abort();
          };
          request.onerror = event => {
            event.preventDefault();
            resolve({ error: request.error?.name, oldVersion, newVersion });
          };
          request.onblocked = () => reject(new Error('Vault did not close its native connection for versionchange'));
          request.onsuccess = () => {
            request.result.close();
            reject(new Error('The test-only version upgrade unexpectedly committed'));
          };
        });
      }
      function currentDatabaseVersion() {
        return new Promise((resolve, reject) => {
          const request = indexedDB.open(databaseName);
          request.onsuccess = () => {
            const version = request.result.version;
            request.result.close(); resolve(version);
          };
          request.onerror = () => reject(request.error);
        });
      }

      export async function runVersionchange() {
        let vault, reopenedVault, releaseRead = () => {};
        const pending = [];
        try {
          vault = await openVault({ name, codecs: productionBackupCodecs, clock });
          const session = await vault.create(passphrase);
          const exposedSigner = session.identity;
          const principal = session.principal;
          // Keep the caller predicate unchanged: native invalidation itself must revoke access.
          const intents = createLocalIntentStore({ storage: session.storage, principal, clock,
            isCurrent: () => true, enabled: true });
          const saved = unwrap(await intents.create({ criteria, expiresAt: '2026-11-28T12:00:00.000Z' }));
          const signedBefore = await signsCorrectly(exposedSigner);
          let entered, retainedGet, captured;
          const started = new Promise(resolve => { entered = resolve; });
          const held = new Promise(resolve => { releaseRead = resolve; });
          const heldRead = observe(() => session.storage.read(async tx => {
            captured = tx.records.get(principal, privateIntentRepo.type, saved.id);
            retainedGet = tx.records.get;
            entered(); await held; return captured;
          }));
          pending.push(heldRead);
          await Promise.race([started, heldRead.then(() => { throw new Error('Held read settled before entering'); })]);
          const callbacks = { queuedRead: 0, freshRead: 0, freshWrite: 0 };
          const queuedRead = observe(() => session.storage.read(() => { callbacks.queuedRead++; return captured; }));
          pending.push(queuedRead);

          // No explicit lock or close occurs before these invalidation checks.
          const upgrade = await abortVersionUpgrade();
          const signer = await observe(() => exposedSigner.sign(challenge));
          const retained = await observe(() => retainedGet(principal, privateIntentRepo.type, saved.id));
          const freshRead = observe(() => session.storage.read(() => { callbacks.freshRead++; return captured; }));
          const freshWrite = observe(() => session.storage.transaction(() => { callbacks.freshWrite++; return ok(undefined); }));
          pending.push(freshRead, freshWrite);
          releaseRead();
          const [heldResult, queuedResult, freshResult, writeResult] = await Promise.all(pending);
          await vault.close();

          const reopenedVersion = await currentDatabaseVersion();
          reopenedVault = await openVault({ name, codecs: productionBackupCodecs, clock });
          const fresh = await reopenedVault.unlock(passphrase);
          const reopened = await fresh.storage.read(tx => tx.records.get(principal, privateIntentRepo.type, saved.id));
          const signedAfterReopen = await signsCorrectly(fresh.identity);
          return { baseVersion: VAULT_DB_VERSION, upgrade, reopenedVersion, principal,
            reopenedPrincipal: fresh.principal, signedBefore, signedAfterReopen, saved, captured, reopened,
            signer, retained, heldRead: heldResult, queuedRead: queuedResult,
            freshRead: freshResult, freshWrite: writeResult, callbacks };
        } finally {
          releaseRead();
          await Promise.allSettled(pending);
          try { await vault?.close(); } finally { await reopenedVault?.close(); }
        }
      }
    `, loader: 'ts', resolveDir: fileURLToPath(new URL('../../', import.meta.url)) },
    bundle: true, platform: 'browser', target: 'es2022', format: 'iife', globalName: '__storageLifecycleTest', write: false,
    footer: { js: "document.documentElement.dataset.storageLifecycleReady = 'true';" },
  });
  bundle = result.outputFiles[0]!.text;
});

async function openFixture(page: Page) {
  const production = await page.request.get('/');
  expect(production.ok()).toBe(true);
  const policy = production.headers()['content-security-policy'];
  expect(policy).toContain("script-src 'self'");
  expect(policy).not.toMatch(/'unsafe-(?:eval|inline)'/);
  const html = '<!doctype html><html lang="en"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>Native storage lifecycle acceptance</title>'
    + '<script defer src="/__storage_lifecycle_test.js"></script></head>'
    + '<body><main><h1>Native storage lifecycle acceptance</h1></main></body></html>';
  await page.route('**/__storage_lifecycle_test.html', route => route.fulfill({ status: 200,
    headers: { ...production.headers(), 'content-length': String(Buffer.byteLength(html)) }, body: html }));
  await page.route('**/__storage_lifecycle_test.js', route => route.fulfill({ contentType: 'application/javascript', body: bundle }));
  const response = await page.goto('/__storage_lifecycle_test.html');
  expect(response?.headers()['content-security-policy']).toBe(policy);
  await expect(page.locator('html')).toHaveAttribute('data-storage-lifecycle-ready', 'true');
  expect(await page.evaluate(async () => ({ origin: location.origin, secure: isSecureContext,
    crypto: crypto.subtle instanceof SubtleCrypto, storage: indexedDB instanceof IDBFactory,
    locks: typeof navigator.locks?.request, controller: navigator.serviceWorker.controller,
    registrations: (await navigator.serviceWorker.getRegistrations()).length,
  }))).toEqual({ origin: new URL(production.url()).origin, secure: true, crypto: true,
    storage: true, locks: 'function', controller: null, registrations: 0 });
}

test('native versionchange revokes vault signers and queued reads before identity-preserving reopen', async ({ page }) => {
  await openFixture(page);
  const evidence = await page.evaluate(() => (window as unknown as FixtureWindow).__storageLifecycleTest.runVersionchange());
  await test.info().attach('native-storage-lifecycle-evidence', {
    body: JSON.stringify(evidence, null, 2), contentType: 'application/json',
  });
  expect(evidence.upgrade).toEqual({ error: 'AbortError', oldVersion: evidence.baseVersion, newVersion: evidence.baseVersion + 1 });
  expect(evidence.reopenedVersion).toBe(evidence.baseVersion);
  expect(evidence.signedBefore).toBe(true);
  expect(evidence.signedAfterReopen).toBe(true);
  expect(evidence.principal).toMatch(/^did:key:/);
  expect(evidence.reopenedPrincipal).toBe(evidence.principal);
  expect(evidence.saved.revision).toBe(1);
  expect(evidence.saved.data.criteria).toEqual({ query: 'private native invalidation canary', kind: 'sell',
    price: { currency: 'CAD', min: '900719925474099301', max: '900719925474099302' } });
  expect(evidence.captured).toEqual(evidence.saved);
  expect(evidence.reopened).toEqual(evidence.saved);
  for (const operation of ['signer', 'retained', 'heldRead', 'queuedRead', 'freshRead', 'freshWrite'] as const) {
    expect(evidence[operation], operation).toEqual({ state: 'rejected' });
  }
  expect(evidence.callbacks).toEqual({ queuedRead: 0, freshRead: 0, freshWrite: 0 });
});

const productionPassphrase = 'synthetic production storage lifecycle passphrase';
async function createProductionVault(page: Page, name: string): Promise<string> {
  await page.goto('/');
  await page.locator('[name="vault"]').fill(name);
  await page.locator('[name="passphrase"]').fill(productionPassphrase);
  await page.getByRole('button', { name: 'Create a new vault' }).click();
  await expect(page.locator('#workspace')).toBeVisible();
  await expect(page.locator('#status')).toHaveText(/Vault unlocked/);
  return (await page.locator('#principal').textContent())!;
}
async function saveProductionDraft(page: Page, title: string): Promise<void> {
  const form = page.locator('#listing-form');
  await form.getByLabel('Title', { exact: true }).fill(title);
  await form.getByLabel('Description', { exact: true }).fill('A synthetic item saved before the native connection ends.');
  await form.getByLabel('Declared value').fill('12500');
  await form.getByRole('button', { name: 'Save local draft' }).click();
  await expect(page.locator('#listings').getByRole('heading', { name: title, exact: true })).toBeVisible();
}

test('production native versionchange clears private views and recovers only saved state', async ({ browser, page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const name = 'production-native-invalidation';
  const principal = await createProductionVault(page, name);
  expect(principal).toMatch(/^did:key:/);
  await expect(page.locator('#blindmatch')).toBeHidden();
  await expect(page.locator('#blindmatch')).toBeEmpty();
  const title = 'Saved native lifecycle draft';
  await saveProductionDraft(page, title);
  await expect(page.locator('#listings article')).toHaveCount(1);
  await expect(page.locator('#listings article')).toContainText('draft · revision 1');
  const savedDraft = (await page.locator('#listings article').textContent())!;

  // Populate a real retained peer card, so clearing that view is not vacuous.
  const peerTitle = 'Synthetic retained peer lifecycle item';
  const peerContext = await browser.newContext({ baseURL: new URL(page.url()).origin });
  let signed: string;
  try {
    const peer = await peerContext.newPage();
    expect(await createProductionVault(peer, 'production-native-peer')).not.toBe(principal);
    await saveProductionDraft(peer, peerTitle);
    const downloaded = peer.waitForEvent('download');
    await peer.getByRole('button', { name: 'Publish signed file', exact: true }).click();
    const path = await (await downloaded).path();
    if (!path) throw new Error('Synthetic peer listing download has no readable path');
    signed = await readFile(path, 'utf8');
  } finally { await peerContext.close(); }
  await page.locator('#peer-file').setInputFiles({ name: 'synthetic-peer-listing.json',
    mimeType: 'application/json', buffer: Buffer.from(signed) });
  await expect(page.locator('#peers').getByRole('heading', { name: peerTitle, exact: true })).toBeVisible();
  await expect(page.locator('#peers article')).toHaveCount(1);
  await expect(page.locator('#peer-search-status')).toHaveText('1 matching retained peer listing.');
  const retainedPeer = (await page.locator('#peers article').textContent())!;

  const canaries = {
    title: 'Unsaved title native invalidation canary',
    description: 'Unsaved description native invalidation canary',
    search: 'Unsaved search native invalidation canary',
    backup: 'Unsaved backup passphrase native invalidation canary',
  };
  const form = page.locator('#listing-form');
  await form.getByLabel('Title', { exact: true }).fill(canaries.title);
  await form.getByLabel('Description', { exact: true }).fill(canaries.description);
  await form.getByLabel('Declared value').fill('777');
  await form.getByLabel('Coarse area').fill('u4pru');
  await form.getByLabel('Listing type').selectOption('wanted');
  await form.getByLabel('Condition', { exact: true }).selectOption('fair');
  await form.getByLabel('Allow this listing').check();
  await page.getByLabel('Search retained listings').fill(canaries.search);
  await page.getByLabel('Search coarse area').fill('u4pru');
  await page.getByLabel('Approximate radius').selectOption('10');
  await page.getByLabel('Filter listing type').selectOption('wanted');
  await page.getByLabel('Filter condition').selectOption('fair');
  await page.getByLabel('Peer listing order').selectOption('ranked');
  await page.locator('#backup-password').fill(canaries.backup);
  await expect(page.locator('#peers article')).toHaveCount(1);

  // Use the native database API, without locking the vault or fabricating an event.
  // Abort the schema change so the existing vault remains recoverable unchanged.
  const upgrade = await page.evaluate(async databaseName => {
    type ClearedView = { workspaceHidden: boolean; accessVisible: boolean;
      listings: number; peers: number; principal: string | null };
    const version = await new Promise<number>((resolve, reject) => {
      const request = indexedDB.open(databaseName);
      request.onerror = () => reject(request.error);
      request.onupgradeneeded = () => {
        request.transaction!.abort();
        reject(new Error('The production vault database did not already exist'));
      };
      request.onsuccess = () => {
        const currentVersion = request.result.version;
        request.result.close(); resolve(currentVersion);
      };
    });
    return new Promise<{
      error: string | undefined; oldVersion: number | undefined; newVersion: number | null | undefined;
      version: number; clearedBeforeUpgrade: ClearedView | undefined;
    }>((resolve, reject) => {
      const request = indexedDB.open(databaseName, version + 1);
      let oldVersion: number | undefined;
      let newVersion: number | null | undefined;
      let clearedBeforeUpgrade: ClearedView | undefined;
      request.onupgradeneeded = event => {
        oldVersion = event.oldVersion; newVersion = event.newVersion;
        clearedBeforeUpgrade = {
          workspaceHidden: document.querySelector<HTMLElement>('#workspace')!.hidden === true,
          accessVisible: !document.querySelector<HTMLElement>('#access')!.hidden,
          listings: document.querySelector('#listings')!.childElementCount,
          peers: document.querySelector('#peers')!.childElementCount,
          principal: document.querySelector('#principal')!.textContent,
        };
        request.transaction!.abort();
      };
      request.onerror = event => {
        event.preventDefault();
        resolve({ error: request.error?.name, oldVersion, newVersion, version, clearedBeforeUpgrade });
      };
      request.onblocked = () => reject(new Error('Production vault blocked its native version change'));
      request.onsuccess = () => {
        request.result.close();
        reject(new Error('The test-only production version upgrade unexpectedly committed'));
      };
    });
  }, `classrup-vault:${name}`);
  await test.info().attach('production-native-storage-lifecycle-evidence', {
    body: JSON.stringify(upgrade, null, 2), contentType: 'application/json',
  });
  expect(upgrade.oldVersion).toBe(upgrade.version);
  expect(upgrade.newVersion).toBe(upgrade.version + 1);
  expect(upgrade.error).toBe('AbortError');
  expect(upgrade.clearedBeforeUpgrade).toEqual({ workspaceHidden: true, accessVisible: true,
    listings: 0, peers: 0, principal: '' });
  await expect(page.locator('#workspace')).toBeHidden();
  await expect(page.locator('#access')).toBeVisible();
  await expect(page.locator('#status')).toHaveText('Vault connection ended. Unlock again to continue.');
  await expect(page.locator('#error')).toBeHidden();
  await expect(page.locator('#listings')).toBeEmpty();
  await expect(page.locator('#peers')).toBeEmpty();
  await expect(page.locator('#principal')).toBeEmpty();
  await expect(form.getByLabel('Title', { exact: true })).toHaveValue('');
  await expect(form.getByLabel('Description', { exact: true })).toHaveValue('');
  await expect(form.getByLabel('Declared value')).toHaveValue('0');
  await expect(form.getByLabel('Coarse area')).toHaveValue('c2b2');
  await expect(form.getByLabel('Listing type')).toHaveValue('sell');
  await expect(form.getByLabel('Condition', { exact: true })).toHaveValue('good');
  await expect(form.getByLabel('Allow this listing')).not.toBeChecked();
  await expect(page.getByLabel('Search retained listings')).toHaveValue('');
  await expect(page.getByLabel('Search coarse area')).toHaveValue('');
  await expect(page.getByLabel('Approximate radius')).toHaveValue('');
  await expect(page.getByLabel('Filter listing type')).toHaveValue('');
  await expect(page.getByLabel('Filter condition')).toHaveValue('');
  await expect(page.getByLabel('Peer listing order')).toHaveValue('retained');
  await expect(page.locator('#peer-search-status')).toBeEmpty();
  await expect(page.locator('#backup-password')).toHaveValue('');
  await expect(page.locator('#blindmatch')).toBeHidden();
  await expect(page.locator('#blindmatch')).toBeEmpty();

  await page.locator('[name="vault"]').fill(name);
  await page.locator('[name="passphrase"]').fill(productionPassphrase);
  await page.getByRole('button', { name: 'Unlock', exact: true }).click();
  await expect(page.locator('#workspace')).toBeVisible();
  await expect(page.locator('#status')).toHaveText(/Vault unlocked/);
  await expect(page.locator('#principal')).toHaveText(principal);
  await expect(page.locator('#listings article')).toHaveCount(1);
  await expect(page.locator('#listings article')).toHaveText(savedDraft);
  await expect(page.locator('#peers article')).toHaveCount(1);
  await expect(page.locator('#peers article')).toHaveText(retainedPeer);
  await expect(page.locator('#blindmatch')).toBeHidden();
  await expect(page.locator('#blindmatch')).toBeEmpty();
  const recoveredView = await page.evaluate(() => ({ text: document.body.textContent ?? '',
    inputs: [...document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea')].map(input => input.value),
  }));
  for (const canary of Object.values(canaries)) {
    expect(recoveredView.text).not.toContain(canary);
    expect(recoveredView.inputs).not.toContain(canary);
  }
  expect(errors).toEqual([]);
});
