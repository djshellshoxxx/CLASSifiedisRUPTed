import { expect, test, type Page } from '@playwright/test';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import type { PrivateIntent } from '../../packages/blindmatch/src/index.ts';

interface FixtureSnapshot {
  intents: readonly { id: string; revision: number; data: PrivateIntent }[];
  candidates: readonly { listingId: string; cid: string }[];
  loaderCalls: number;
  rawHasQuery: boolean;
  rawHasIntentId: boolean;
}
interface Fixture {
  start(): Promise<void>;
  snapshot(): Promise<FixtureSnapshot>;
  reopen(): Promise<void>;
  lock(): Promise<void>;
  replaceAccount(): Promise<void>;
  holdNextLoad(): void;
  loaderStarted(): Promise<void>;
  heldLoadAborted(): boolean;
  releaseHeldLoad(): Promise<void>;
}
type FixtureWindow = Window & { __blindmatchUiTest: Fixture };
let bundle = '';

test.beforeAll(async () => {
  const result = await build({
    stdin: { contents: `
      import { mountBlindMatch } from './apps/pwa/src/blindmatch.ts';
      import { createLocalCandidateLoader } from './apps/pwa/src/blindmatch-candidates.ts';
      import { productionBackupCodecs } from './apps/pwa/src/backup-codecs.ts';
      import { createLocalIntentStore } from './packages/blindmatch/src/index.ts';
      import { allowAllAuthz, createBus, createDeterministicIds, createFakeClock, createRegistry, unwrap } from './packages/kernel/src/index.ts';
      import { discoveryDefinitions } from './packages/discovery/src/index.ts';
      import { createIdentity } from './packages/identity/src/index.ts';
      import { signEnvelope, verifyEnvelope } from './packages/federation/src/index.ts';
      import { openVault } from './packages/vault/src/index.ts';

      const clock = createFakeClock('2026-11-27T12:00:00.000Z');
      const passphrase = 'synthetic BlindMatch UI acceptance passphrase';
      const name = 'blindmatch-ui-acceptance';
      let activeVaultName = name;
      let vault, current, controller, loaderCalls = 0, waiting, entered, release, completed, heldSignal;
      const candidates = [];
      function mount(session) {
        const load = createLocalCandidateLoader({ storage: session.storage, principal: session.principal,
          clock, isCurrent: () => current === session });
        controller = mountBlindMatch({ container: document.getElementById('blindmatch'),
          session, clock, isCurrent: () => current === session,
          loadCandidates: async request => {
            loaderCalls++;
            const snapshot = await load(request);
            if (waiting) {
              const pause = waiting; waiting = undefined; heldSignal = request.signal; entered();
              await pause;
              // The test port deliberately ignores late cancellation after verification.
              // The component must still discard results when its session is revoked.
              completed();
            }
            return snapshot;
          },
        });
      }
      export async function start() {
        vault = await openVault({ name, codecs: productionBackupCodecs });
        const session = current = await vault.create(passphrase);
        const peer = await createIdentity('synthetic public candidate signing passphrase');
        try {
          const ids = createDeterministicIds({ seed: 149, now: () => clock.now() });
          const defs = discoveryDefinitions({ verifyEnvelope: input => verifyEnvelope(input, { now: clock.now() }) });
          const bus = createBus({ registry: createRegistry().add(...defs.all), storage: session.storage,
            clock, ids, authz: allowAllAuthz });
          const context = { actor: { kind: 'user', id: session.principal, roles: ['member'] }, tenantId: session.principal };
          const categoryId = ids.next();
          for (const amount of ['900719925474099301', '900719925474099302']) {
            const projection = { ownerId: peer.identity.principal, listingId: ids.next(), revision: 1,
              kind: 'sell', title: 'Bicycle matching candidate', description: 'Synthetic signed public bicycle evidence.',
              categoryId, condition: 'good', tags: ['bicycle'], locale: 'en', regionCell: 'c2b2',
              barterOptIn: false, availability: 'available', value: { currency: 'CAD', amount },
              expiresAt: '2026-11-29T12:00:00.000Z' };
            const envelope = await signEnvelope(peer.identity, { type: 'classrup.bazaar.listing/v1', payload: projection,
              createdAt: clock.iso(), seq: 1, prev: null });
            unwrap(await bus.dispatch(context, defs.retain.name, { envelope }, { idempotencyKey: ids.next() }));
            candidates.push({ listingId: projection.listingId, cid: envelope.cid });
          }
        } finally { peer.identity.lock(); }
        mount(session);
      }
      export async function snapshot() {
        const session = current;
        const intents = unwrap(await createLocalIntentStore({ storage: session.storage, principal: session.principal,
          clock, isCurrent: () => current === session }).list());
        const db = await new Promise((resolve, reject) => {
          const request = indexedDB.open('classrup-vault:' + activeVaultName);
          request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
        });
        let raw;
        try {
          const tables = [...db.objectStoreNames], tx = db.transaction(tables, 'readonly');
          raw = JSON.stringify(await Promise.all(tables.map(table => new Promise((resolve, reject) => {
            const request = tx.objectStore(table).getAll();
            request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
          }))));
        } finally { db.close(); }
        return { intents, candidates, loaderCalls, rawHasQuery: raw.includes('bicycle'),
          rawHasIntentId: intents.some(row => raw.includes(row.id)) };
      }
      export async function lock() {
        const session = current; current = undefined;
        controller.destroy();
        await session.lock();
      }
      export async function reopen() {
        if (current) await lock();
        await vault.close();
        activeVaultName = name;
        vault = await openVault({ name, codecs: productionBackupCodecs });
        const session = current = await vault.unlock(passphrase);
        mount(session);
      }
      export async function replaceAccount() {
        await lock(); await vault.close();
        activeVaultName = name + '-replacement';
        vault = await openVault({ name: activeVaultName, codecs: productionBackupCodecs });
        const session = current = await vault.create(passphrase);
        mount(session);
      }
      let startedPromise, completedPromise;
      export function holdNextLoad() {
        heldSignal = undefined;
        waiting = new Promise(resolve => { release = resolve; });
        startedPromise = new Promise(resolve => { entered = resolve; });
        completedPromise = new Promise(resolve => { completed = resolve; });
      }
      export function loaderStarted() { return startedPromise; }
      export function heldLoadAborted() { return heldSignal?.aborted === true; }
      export async function releaseHeldLoad() {
        release(); await completedPromise;
        await new Promise(resolve => requestAnimationFrame(() => resolve()));
      }
    `, loader: 'ts', resolveDir: fileURLToPath(new URL('../../', import.meta.url)) },
    bundle: true, platform: 'browser', target: 'es2022', format: 'iife', globalName: '__blindmatchUiTest', write: false,
    footer: { js: "document.documentElement.dataset.blindmatchUiReady = 'true';" },
  });
  bundle = result.outputFiles[0]!.text;
});

async function openFixture(page: Page) {
  // This mounts the actual component through a test-only composition. The production
  // launch flag remains off; this does not establish public PWA activation.
  const production = await page.request.get('/');
  expect(production.ok()).toBe(true);
  const policy = production.headers()['content-security-policy'];
  expect(policy).toContain("script-src 'self'");
  expect(policy).not.toMatch(/'unsafe-(?:eval|inline)'/);
  const html = '<!doctype html><html lang="en"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>BlindMatch component acceptance</title><link rel="stylesheet" href="/styles.css">'
    + '<script defer src="/__blindmatch_ui_test.js"></script></head>'
    + '<body><main><section id="blindmatch"></section></main></body></html>';
  await page.route('**/__blindmatch_ui_test.html', route => route.fulfill({ status: 200,
    headers: { ...production.headers(), 'content-length': String(Buffer.byteLength(html)) }, body: html }));
  await page.route('**/__blindmatch_ui_test.js', route => route.fulfill({ contentType: 'application/javascript', body: bundle }));
  const response = await page.goto('/__blindmatch_ui_test.html');
  expect(response?.headers()['content-security-policy']).toBe(policy);
  await expect(page.locator('html')).toHaveAttribute('data-blindmatch-ui-ready', 'true');
  expect(await page.evaluate(async () => ({ origin: location.origin, secure: isSecureContext,
    crypto: crypto.subtle instanceof SubtleCrypto, storage: indexedDB instanceof IDBFactory,
    controller: navigator.serviceWorker.controller, registrations: (await navigator.serviceWorker.getRegistrations()).length,
  }))).toEqual({ origin: new URL(production.url()).origin, secure: true, crypto: true,
    storage: true, controller: null, registrations: 0 });
  await page.evaluate(() => (window as unknown as FixtureWindow).__blindmatchUiTest.start());
}

const snapshot = (page: Page) => page.evaluate(() => (window as unknown as FixtureWindow).__blindmatchUiTest.snapshot());

test('the production launch gate stays off after a real vault unlock', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#access')).toBeVisible();
  await page.locator('[name="vault"]').fill('blindmatch-production-gate');
  await page.locator('[name="passphrase"]').fill('synthetic production gate acceptance passphrase');
  await page.getByRole('button', { name: 'Create a new vault', exact: true }).click();
  await expect(page.locator('#status')).toContainText('Vault unlocked');
  await expect(page.locator('#workspace')).toBeVisible();
  await expect(page.locator('#blindmatch')).toBeHidden();
  await expect(page.locator('#blindmatch')).toBeEmpty();
  await expect(page.getByRole('checkbox', { name: 'Enable local matching for this session', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Lock vault', exact: true }).click();
  await expect(page.locator('#workspace')).toBeHidden();
});

async function saveIntent(page: Page, amount = '900719925474099301') {
  const form = page.locator('#blindmatch-form');
  await form.getByLabel('Private search text', { exact: true }).fill('bicycle');
  await form.locator('[name="kind"]').selectOption('sell');
  await form.locator('[name="condition"]').selectOption('good');
  await form.locator('[name="region"]').fill('c2b2');
  await form.locator('[name="currency"]').fill('CAD');
  await form.locator('[name="min"]').fill(amount);
  await form.locator('[name="max"]').fill(amount);
  // Native datetime-local controls serialize zero seconds without the :00 suffix.
  await form.getByLabel('Expires at (UTC)', { exact: true }).fill('2026-11-28T12:00');
  await form.getByRole('button', { name: /^Save (?:private intent|intent changes)$/ }).click();
  await expect(form.getByLabel('Private search text', { exact: true })).toHaveValue('');
  await expect(page.locator('#blindmatch-intents > article')).toHaveCount(1);
  await expect(page.locator('#blindmatch-error')).toBeHidden();
}

test('private local editor preserves exact filters, uses verified references and erases across native reopen', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await openFixture(page);
  const enabled = page.getByRole('checkbox', { name: 'Enable local matching for this session', exact: true });
  await expect(enabled).not.toBeChecked();
  await expect(page.locator('#blindmatch-form')).toBeHidden();
  await expect(page.locator('#blindmatch-status')).toHaveAttribute('role', 'status');
  await expect(page.locator('#blindmatch-error')).toHaveAttribute('role', 'alert');
  expect((await snapshot(page)).loaderCalls).toBe(0);
  await enabled.focus();
  await page.keyboard.press('Space');
  await expect(page.locator('#blindmatch-form')).toBeVisible();
  await page.getByLabel('Private search text', { exact: true }).fill('unsaved-local-only-canary');
  await page.locator('#blindmatch-form [name="currency"]').fill('CAD');
  await page.locator('#blindmatch-form [name="min"]').fill('123456789012345678');
  await enabled.uncheck();
  await expect(page.locator('#blindmatch-form')).toBeHidden();
  expect(await page.locator('#blindmatch-form input, #blindmatch-form select').evaluateAll(controls =>
    controls.every(control => (control as HTMLInputElement).value === ''))).toBe(true);
  for (const selector of ['#blindmatch-intents', '#blindmatch-results', '#blindmatch-status', '#blindmatch-error']) {
    await expect(page.locator(selector)).toBeEmpty();
  }
  await enabled.check();
  await saveIntent(page);
  const first = await snapshot(page);
  expect(first.intents).toHaveLength(1);
  expect(first.intents[0]!.data).toMatchObject({ state: 'draft', expiresAt: '2026-11-28T12:00:00.000Z',
    criteria: { query: 'bicycle', kind: 'sell', condition: 'good', regionCell: 'c2b2',
    price: { currency: 'CAD', min: '900719925474099301', max: '900719925474099301' } } });
  expect(first.rawHasQuery).toBe(false);
  expect(first.rawHasIntentId).toBe(false);
  expect(first.loaderCalls).toBe(0);
  await page.getByRole('button', { name: 'Run local match', exact: true }).focus();
  await page.keyboard.press('Enter');
  const results = page.locator('#blindmatch-results');
  await expect(results).toContainText(first.candidates[0]!.listingId);
  await expect(results).toContainText(first.candidates[0]!.cid);
  await expect(results).not.toContainText(first.candidates[1]!.listingId);
  await expect(results).not.toContainText('Bicycle matching candidate');
  expect((await snapshot(page)).loaderCalls).toBe(1);

  for (const width of [375, 320]) {
    await page.setViewportSize({ width, height: 812 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.getByRole('button', { name: 'Pause private intent', exact: true }).click();
  await expect(page.locator('#blindmatch-intents')).toContainText('paused');
  await expect(results).toBeEmpty();
  await page.getByRole('button', { name: 'Edit private intent', exact: true }).click();
  await expect(page.getByLabel('Private search text', { exact: true })).toHaveValue('bicycle');
  await saveIntent(page, '900719925474099302');
  await expect(page.locator('#blindmatch-intents')).toContainText('draft');
  const edited = await snapshot(page);
  expect(edited.intents[0]!.id).toBe(first.intents[0]!.id);
  expect(edited.intents[0]!.data.expiresAt).toBe(first.intents[0]!.data.expiresAt);
  expect(edited.intents[0]!.data.criteria.price).toEqual({ currency: 'CAD', min: '900719925474099302', max: '900719925474099302' });
  await page.getByRole('button', { name: 'Run local match', exact: true }).click();
  await expect(results).toContainText(first.candidates[1]!.listingId);
  await expect(results).not.toContainText(first.candidates[0]!.listingId);
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Erase private intent', exact: true }).click();
  await expect(page.locator('#blindmatch-intents > article')).toHaveCount(0);
  await expect(results).toBeEmpty();
  expect((await snapshot(page)).intents).toEqual([]);
  await page.evaluate(() => (window as unknown as FixtureWindow).__blindmatchUiTest.reopen());
  await expect(enabled).not.toBeChecked();
  expect((await snapshot(page)).loaderCalls).toBe(2);
  await enabled.check();
  await expect(page.locator('#blindmatch-form')).toBeVisible();
  await expect(page.locator('#blindmatch-intents > article')).toHaveCount(0);
  expect((await snapshot(page)).intents).toEqual([]);
});

for (const change of ['cancel', 'disable', 'lock', 'replace-account'] as const) {
  test(`a delayed authenticated local result stays absent after ${change}`, async ({ page }) => {
    await openFixture(page);
    const enabled = page.getByRole('checkbox', { name: 'Enable local matching for this session', exact: true });
    await enabled.check();
    await saveIntent(page);
    const before = await snapshot(page);
    await page.evaluate(() => (window as unknown as FixtureWindow).__blindmatchUiTest.holdNextLoad());
    await page.getByRole('button', { name: 'Run local match', exact: true }).click();
    await page.evaluate(() => (window as unknown as FixtureWindow).__blindmatchUiTest.loaderStarted());
    if (change === 'cancel') await page.getByRole('button', { name: 'Cancel local match', exact: true }).click();
    else if (change === 'disable') await enabled.uncheck();
    else if (change === 'lock') await page.evaluate(() => (window as unknown as FixtureWindow).__blindmatchUiTest.lock());
    else await page.evaluate(() => (window as unknown as FixtureWindow).__blindmatchUiTest.replaceAccount());
    await page.evaluate(() => (window as unknown as FixtureWindow).__blindmatchUiTest.releaseHeldLoad());
    const container = page.locator('#blindmatch');
    for (const candidate of before.candidates) await expect(container).not.toContainText(candidate.listingId);
    expect(await page.evaluate(() => ({
      results: document.querySelector('#blindmatch-results')?.textContent ?? '',
      privateQuery: document.querySelector<HTMLInputElement>('#blindmatch-form [name="query"]')?.value ?? '',
      error: document.querySelector('#blindmatch-error')?.textContent ?? '',
    }))).toEqual({ results: '', privateQuery: '', error: '' });
    if (change === 'lock') await expect(container).toBeEmpty();
    else if (change === 'cancel') await expect(enabled).toBeChecked();
    else await expect(enabled).not.toBeChecked();
    if (change === 'replace-account') {
      await enabled.check();
      await expect(page.locator('#blindmatch-intents > article')).toHaveCount(0);
      expect((await snapshot(page)).intents).toEqual([]);
    }
  });
}

type PageExit = 'visibility-hidden' | 'pagehide';

async function leavePrivateView(page: Page, change: PageExit) {
  // Deterministic lifecycle admission in a real browser, not an OS backgrounding
  // or actual back/forward-cache qualification. Keep the two visibility APIs consistent.
  const cleared = await page.evaluate(change => {
    if (change === 'visibility-hidden') {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    } else {
      window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
    }
    const form = document.querySelector<HTMLFormElement>('#blindmatch-form')!;
    // Capture immediately in the same task: delayed callbacks or an idle-lock
    // timer must not be needed to conceal the private view.
    return {
      optedIn: document.querySelector<HTMLInputElement>('#blindmatch input[type="checkbox"]')!.checked,
      hidden: form.parentElement!.hidden,
      disabled: form.querySelector('fieldset')!.disabled,
      clearedFields: [...form.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input,select')]
        .every(control => control.value === ''),
      cards: document.querySelector('#blindmatch-intents')!.childElementCount,
      results: document.querySelector('#blindmatch-results')!.textContent,
      status: document.querySelector('#blindmatch-status')!.textContent,
      error: document.querySelector('#blindmatch-error')!.textContent,
      busy: form.parentElement!.getAttribute('aria-busy'),
    };
  }, change);
  expect(cleared).toEqual({ optedIn: false, hidden: true, disabled: true, clearedFields: true,
    cards: 0, results: '', status: '', error: '', busy: 'false' });
}

async function returnToPrivateView(page: Page, change: PageExit) {
  await page.evaluate(change => {
    if (change === 'visibility-hidden') {
      Reflect.deleteProperty(document, 'hidden');
      Reflect.deleteProperty(document, 'visibilityState');
      document.dispatchEvent(new Event('visibilitychange'));
    } else {
      window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    }
  }, change);
  await expect(page.getByRole('checkbox', { name: 'Enable local matching for this session', exact: true })).not.toBeChecked();
  await expect(page.locator('#blindmatch-form')).toBeHidden();
  await expect(page.locator('#blindmatch-intents')).toBeEmpty();
  await expect(page.locator('#blindmatch-results')).toBeEmpty();
}

for (const change of ['visibility-hidden', 'pagehide'] as const) {
  test(`synthetic ${change} immediately clears private content and requires fresh opt-in`, async ({ page }) => {
    await openFixture(page);
    const enabled = page.getByRole('checkbox', { name: 'Enable local matching for this session', exact: true });
    await enabled.check();
    await saveIntent(page);
    const created = await snapshot(page);
    await page.getByRole('button', { name: 'Run local match', exact: true }).click();
    await expect(page.locator('#blindmatch-results')).toContainText(created.candidates[0]!.listingId);
    const matched = await snapshot(page);
    expect(matched.loaderCalls).toBe(1);
    await leavePrivateView(page, change);

    // An event from a hidden/suspended page cannot grant a fresh session.
    const hiddenOptIn = await page.evaluate(() => {
      const checkbox = document.querySelector<HTMLInputElement>('#blindmatch input[type="checkbox"]')!;
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change'));
      return checkbox.checked;
    });
    expect(hiddenOptIn).toBe(false);
    await returnToPrivateView(page, change);
    const returned = await snapshot(page);
    expect(returned.intents).toEqual(matched.intents);
    expect(returned.loaderCalls).toBe(1);

    await enabled.check();
    await expect(page.locator('#blindmatch-intents > article')).toHaveCount(1);
    await expect(page.locator('#blindmatch-results')).toBeEmpty();
    expect((await snapshot(page)).loaderCalls).toBe(1);
    await page.getByRole('button', { name: 'Edit private intent', exact: true }).click();
    await expect(page.getByLabel('Private search text', { exact: true })).toHaveValue('bicycle');
    await page.getByLabel('Private search text', { exact: true }).fill('unsaved-lifecycle-private-canary');
    await page.locator('#blindmatch-form [name="min"]').fill('123456789012345678');
    await leavePrivateView(page, change);
    await returnToPrivateView(page, change);
    expect((await snapshot(page)).intents).toEqual(matched.intents);
    await enabled.check();
    await expect(page.locator('#blindmatch-intents > article')).toHaveCount(1);
    await expect(page.getByLabel('Private search text', { exact: true })).toHaveValue('');
    expect((await snapshot(page)).loaderCalls).toBe(1);
  });

  test(`synthetic ${change} aborts a delayed match without overwriting a fresh session`, async ({ page }) => {
    await openFixture(page);
    const enabled = page.getByRole('checkbox', { name: 'Enable local matching for this session', exact: true });
    await enabled.check();
    await saveIntent(page);
    const before = await snapshot(page);
    await page.evaluate(() => (window as unknown as FixtureWindow).__blindmatchUiTest.holdNextLoad());
    await page.getByRole('button', { name: 'Run local match', exact: true }).click();
    await page.evaluate(() => (window as unknown as FixtureWindow).__blindmatchUiTest.loaderStarted());
    await leavePrivateView(page, change);
    expect(await page.evaluate(() => (window as unknown as FixtureWindow).__blindmatchUiTest.heldLoadAborted())).toBe(true);
    await returnToPrivateView(page, change);
    expect((await snapshot(page)).loaderCalls).toBe(1);

    await enabled.check();
    await expect(page.locator('#blindmatch-intents > article')).toHaveCount(1);
    await expect(page.locator('#blindmatch-results')).toBeEmpty();
    expect((await snapshot(page)).loaderCalls).toBe(1);
    await page.getByRole('button', { name: 'Edit private intent', exact: true }).click();
    await saveIntent(page, '900719925474099302');
    await page.getByRole('button', { name: 'Run local match', exact: true }).click();
    const results = page.locator('#blindmatch-results');
    await expect(results).toContainText(before.candidates[1]!.listingId);
    await expect(results).not.toContainText(before.candidates[0]!.listingId);
    await page.evaluate(() => (window as unknown as FixtureWindow).__blindmatchUiTest.releaseHeldLoad());
    await expect(enabled).toBeChecked();
    await expect(results).toContainText(before.candidates[1]!.listingId);
    await expect(results).not.toContainText(before.candidates[0]!.listingId);
    await expect(page.locator('#blindmatch-error')).toBeEmpty();
    expect((await snapshot(page)).loaderCalls).toBe(2);
  });
}

test.describe('localized private matching', () => {
  test.use({ locale: 'fr-CA', viewport: { width: 320, height: 720 } });

  test('negotiates the local language and preserves a private draft across language changes', async ({ page }) => {
    await openFixture(page);
    const panel = page.locator('#blindmatch');
    await expect(panel).toHaveAttribute('lang', 'fr');
    await panel.getByRole('checkbox').check();
    const query = panel.getByRole('textbox', { name: 'Texte de recherche privé', exact: true });
    await query.fill('vélo {count}');
    await panel.locator('[name="min"]').fill('900719925474099301');
    await panel.locator('[name="expires"]').fill('2026-11-28T12:00');
    await panel.getByRole('button', { name: 'Enregistrer la recherche privée' }).click();
    await expect(panel.getByRole('alert')).toHaveText('Choisissez une devise pour les limites de prix.');
    const language = panel.getByRole('combobox', { name: 'Langue de BlindMatch' });
    await language.selectOption('de');
    await expect(panel).toHaveAttribute('lang', 'de');
    await expect(panel.getByRole('alert')).toHaveText('Wählen Sie eine Währung für die Preisgrenzen.');
    await expect(panel.getByRole('textbox', { name: 'Privater Suchtext' })).toHaveValue('vélo {count}');
    await expect(panel.locator('[name="min"]')).toHaveValue('900719925474099301');
    await panel.locator('[name="expires"]').fill('');
    await panel.getByRole('button', { name: 'Private Suche speichern' }).click();
    await expect(panel.getByRole('alert')).toHaveText('Geben Sie ein gültiges Ablaufdatum mit Uhrzeit in UTC ein.');
    await expect(panel.locator('[name="expires"]')).toBeFocused();
    await panel.locator('[name="expires"]').fill('2026-11-28T12:00');
    await panel.locator('[name="currency"]').fill('CAD');
    await panel.getByRole('button', { name: 'Private Suche speichern' }).click();
    await expect(panel.locator('#blindmatch-intents article')).toHaveCount(1);
    await panel.getByRole('combobox', { name: 'BlindMatch-Sprache' }).selectOption('es');
    await panel.getByRole('button', { name: 'Buscar coincidencias locales' }).click();
    await expect(panel.getByRole('status').filter({ hasText: '0 referencias' })).toBeVisible();
    await expect(panel.getByRole('heading', { name: 'vélo {count}', exact: true })).toBeVisible();
    expect(await panel.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    expect((await snapshot(page)).loaderCalls).toBe(1);
  });
});

test('rapid language changes preserve focus and clear private fields on disable', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await openFixture(page);
  const panel = page.locator('#blindmatch');
  await panel.getByRole('checkbox').check();
  const query = panel.locator('[name="query"]');
  await query.fill('private language stress fixture');
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  const preferred = async (tag: string) => page.evaluate(locale => {
    Object.defineProperty(navigator, 'languages', { configurable: true, value: [locale] });
    window.dispatchEvent(new Event('languagechange'));
  }, tag);
  await page.evaluate(() => {
    const select = document.querySelector<HTMLSelectElement>('#blindmatch-language')!;
    const choices = ['de', 'fr', 'es', 'en', ''];
    for (let i = 0; i < 250; i++) {
      select.value = choices[i % choices.length]!;
      select.dispatchEvent(new Event('change'));
    }
  });
  await preferred('ar-XB');
  await expect(panel).toHaveAttribute('dir', 'rtl');
  await expect(panel).toHaveAttribute('lang', 'ar-XB');
  await expect(query).toBeFocused();
  await expect(query).toHaveValue('private language stress fixture');
  const unchanged = await panel.evaluate(async el => {
    const records: MutationRecord[] = [];
    const observer = new MutationObserver(batch => records.push(...batch));
    observer.observe(el, { characterData: true, childList: true, subtree: true });
    window.dispatchEvent(new Event('languagechange'));
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    observer.disconnect();
    return records.length;
  });
  expect(unchanged).toBe(0);
  await preferred('en-XA');
  await expect(panel).toHaveAttribute('dir', 'ltr');
  await expect(panel).toHaveAttribute('lang', 'en-XA');
  expect(await panel.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await panel.getByRole('checkbox').uncheck();
  await preferred('zz');
  await expect(panel).toHaveAttribute('lang', 'en');
  await expect(query).toHaveValue('');
  await expect(panel.locator('#blindmatch-status')).toBeEmpty();
  await expect(panel.locator('#blindmatch-results')).toBeEmpty();
  expect((await snapshot(page)).loaderCalls).toBe(0);
  expect(requests).toEqual([]);
});
