import { expect, test } from '@playwright/test';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import type * as BlindMatch from '../../packages/blindmatch/src/index.ts';
import type * as Kernel from '../../packages/kernel/src/index.ts';
import type * as Vault from '../../packages/vault/src/index.ts';
import type { productionBackupCodecs } from '../../apps/pwa/src/backup-codecs.ts';

type Harness = Pick<typeof BlindMatch, 'createLocalIntentStore' | 'createLocalMatchSession' | 'privateIntentRepo'>
  & Pick<typeof Kernel, 'createFakeClock' | 'unwrap'> & Pick<typeof Vault, 'openVault'>
  & { productionBackupCodecs: typeof productionBackupCodecs };
type HarnessWindow = Window & { __blindmatchFoundation: Harness };
let bundle = '';

test.beforeAll(async () => {
  const result = await build({
    stdin: { contents: `
      export { createLocalIntentStore, createLocalMatchSession, privateIntentRepo } from './packages/blindmatch/src/index.ts';
      export { createFakeClock, unwrap } from './packages/kernel/src/index.ts';
      export { openVault } from './packages/vault/src/index.ts';
      export { productionBackupCodecs } from './apps/pwa/src/backup-codecs.ts';`,
    loader: 'ts', resolveDir: fileURLToPath(new URL('../../', import.meta.url)) },
    bundle: true, platform: 'browser', target: 'es2022', format: 'iife', globalName: '__blindmatchFoundation', write: false,
    footer: { js: "document.documentElement.dataset.blindmatchReady = 'true';" },
  });
  bundle = result.outputFiles[0]!.text;
});

test('BlindMatch foundation uses native encrypted storage, erases locally and restores old content inactive', async ({ page }) => {
  // A parser-loaded external script avoids addScriptTag's Firefox evaluation path.
  // Preserve the actual preview server policy and do not load the PWA/service worker.
  const production = await page.request.get('/');
  expect(production.ok()).toBe(true);
  const policy = production.headers()['content-security-policy'];
  expect(policy).toContain("script-src 'self'");
  expect(policy).not.toContain("'unsafe-eval'");
  expect(policy).not.toContain("'unsafe-inline'");
  const html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>BlindMatch foundation test</title>'
    + '<script defer src="/__blindmatch_foundation_test.js"></script></head><body></body></html>';
  await page.route('**/__blindmatch_foundation_test.html', route => route.fulfill({
    status: 200,
    headers: { ...production.headers(), 'content-type': 'text/html; charset=utf-8', 'content-length': String(Buffer.byteLength(html)) },
    body: html,
  }));
  await page.route('**/__blindmatch_foundation_test.js', route => route.fulfill({ contentType: 'application/javascript', body: bundle }));
  const fixture = await page.goto('/__blindmatch_foundation_test.html');
  expect(fixture?.headers()['content-security-policy']).toBe(policy);
  await expect(page.locator('html')).toHaveAttribute('data-blindmatch-ready', 'true');
  expect(await page.evaluate(async () => ({
    origin: location.origin,
    secure: isSecureContext,
    crypto: crypto.subtle instanceof SubtleCrypto,
    storage: indexedDB instanceof IDBFactory,
    controller: navigator.serviceWorker.controller,
    registrations: (await navigator.serviceWorker.getRegistrations()).length,
  }))).toEqual({
    origin: new URL(production.url()).origin,
    secure: true, crypto: true, storage: true, controller: null, registrations: 0,
  });
  const result = await page.evaluate(async () => {
    const h = (window as unknown as HarnessWindow).__blindmatchFoundation;
    const clock = h.createFakeClock('2026-11-26T12:00:00.000Z');
    const passphrase = 'native BlindMatch foundation acceptance passphrase';
    const canary = 'native-private-intent-canary';
    const name = 'blindmatch-native-foundation';
    const vaults: Vault.Vault[] = [];
    let current: Vault.UnlockedVault | undefined;
    const open = async (vaultName: string) => {
      const vault = await h.openVault({ name: vaultName, codecs: h.productionBackupCodecs });
      vaults.push(vault); return vault;
    };
    const intents = (session: Vault.UnlockedVault, enabled?: boolean) => h.createLocalIntentStore({
      storage: session.storage, principal: session.principal, clock, isCurrent: () => current === session,
      ...(enabled === undefined ? {} : { enabled }),
    });
    async function rawRows(vaultName: string) {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(`classrup-vault:${vaultName}`);
        request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
      });
      try {
        const tables = [...db.objectStoreNames];
        const tx = db.transaction(tables, 'readonly');
        return await Promise.all(tables.map(async table => {
          const store = tx.objectStore(table);
          const keys = store.getAllKeys(), rows = store.getAll();
          const read = <T>(request: IDBRequest<T>) => new Promise<T>((resolve, reject) => {
            request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
          });
          return { table, keys: await read(keys), rows: await read(rows) };
        }));
      } finally { db.close(); }
    }
    try {
      const source = await open(name);
      const session = current = await source.create(passphrase);
      const content = { criteria: { query: canary, price: { currency: 'CAD', max: '987654321012345678' } },
        expiresAt: '2026-11-27T12:00:00.000Z' };
      const disabled = await intents(session).create(content);
      const store = intents(session, true);
      const created = h.unwrap(await store.create(content));
      const active = h.unwrap(await store.setState({ id: created.id, expectedRevision: created.revision, state: 'active' }));
      const before = await rawRows(name);
      const raw = JSON.stringify(before);
      const encryptedBefore = before.find(table => table.table === 'records')!.rows
        .filter(row => row?.format === 'classrup.storage-row/v1').length;
      const backup = await session.exportBackup(passphrase);
      const stillActive = h.unwrap(await store.read(active.id)).data.state;

      let started!: () => void, finish!: (value: readonly unknown[]) => void;
      const startedPromise = new Promise<void>(resolve => { started = resolve; });
      const loaded = new Promise<readonly unknown[]>(resolve => { finish = resolve; });
      let loaderCalls = 0;
      const matching = h.createLocalMatchSession({ intents: store, principal: session.principal, clock,
        isCurrent: () => current === session, enabled: true,
        loadCandidates: async () => { loaderCalls++; started(); return loaded; },
      });
      const pending = matching.match({ id: active.id, expectedRevision: active.revision });
      await startedPromise;
      const erased = await store.erase({ id: active.id, expectedRevision: active.revision });
      finish([]);
      const late = await pending;
      const missingNow = await store.read(active.id);
      const after = await rawRows(name);
      const encryptedAfter = after.find(table => table.table === 'records')!.rows
        .filter(row => row?.format === 'classrup.storage-row/v1').length;
      const afterCoverage = await session.backupCoverage();
      current = undefined;
      await session.lock();

      const reopenedVault = await open(name);
      const reopened = current = await reopenedVault.unlock(passphrase);
      const missingAfterReopen = await intents(reopened, true).read(active.id);
      current = undefined;
      await reopened.lock();

      const restoredVault = await open(`${name}-older-backup`);
      const restored = current = await restoredVault.restoreBackup(backup, passphrase);
      const restoredStore = intents(restored, true);
      const restoredRow = h.unwrap(await restoredStore.read(active.id));
      let restoreLoaderCalls = 0;
      const restoredMatch = h.createLocalMatchSession({ intents: restoredStore, principal: restored.principal, clock,
        isCurrent: () => current === restored, enabled: true,
        loadCandidates: async () => { restoreLoaderCalls++; return []; },
      });
      const automaticLoads = restoreLoaderCalls;
      const inactiveAttempt = await restoredMatch.match({ id: restoredRow.id, expectedRevision: restoredRow.revision });
      current = undefined;
      await restored.lock();
      return {
        disabled, createdRevision: created.revision, activeRevision: active.revision, stillActive,
        encryptedBefore, encryptedAfter,
        rawHasCanary: raw.includes(canary), rawHasId: raw.includes(active.id),
        rawHasAmount: raw.includes('987654321012345678'), rawHasType: raw.includes(h.privateIntentRepo.type),
        backupHasCanary: JSON.stringify(backup).includes(canary),
        erased, late, loaderCalls, missingNow, missingAfterReopen,
        remainingIntentTypes: afterCoverage.recordTypes.filter(row => row.type === h.privateIntentRepo.type),
        restoredState: restoredRow.data.state, restoredCriteria: restoredRow.data.criteria,
        automaticLoads, restoreLoaderCalls, inactiveAttempt,
      };
    } finally {
      current = undefined;
      for (const vault of vaults) await vault.close();
    }
  });
  expect(result.disabled).toMatchObject({ ok: false, error: { code: 'FEATURE_DISABLED' } });
  expect(result.createdRevision).toBe(1);
  expect(result.activeRevision).toBe(2);
  expect(result.stillActive).toBe('active');
  expect(result.encryptedBefore).toBe(1);
  expect(result.encryptedAfter).toBe(0);
  expect([result.rawHasCanary, result.rawHasId, result.rawHasAmount, result.rawHasType, result.backupHasCanary])
    .toEqual([false, false, false, false, false]);
  expect(result.erased.ok).toBe(true);
  expect(result.late).toMatchObject({ ok: false, error: { code: 'PRECONDITION_FAILED' } });
  expect(result.loaderCalls).toBe(1);
  expect(result.missingNow).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } });
  expect(result.missingAfterReopen).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } });
  expect(result.remainingIntentTypes).toEqual([]);
  expect(result.restoredState).toBe('draft');
  expect(result.restoredCriteria).toEqual({ query: 'native-private-intent-canary', price: { currency: 'CAD', max: '987654321012345678' } });
  expect(result.automaticLoads).toBe(0);
  expect(result.restoreLoaderCalls).toBe(0);
  expect(result.inactiveAttempt).toMatchObject({ ok: false, error: { code: 'PRECONDITION_FAILED' } });
});
