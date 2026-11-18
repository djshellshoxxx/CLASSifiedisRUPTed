import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const password = 'correct horse native keygen 2026';
type FaultMode = 'once' | 'always' | 'off';
interface KeygenFault {
  mode: FaultMode;
  attempts: number;
  injectedFailures: number;
  delegatedCalls: number;
}
type FaultWindow = Window & { __classrupKeygenFault: KeygenFault };

async function installKeygenFault(page: Page, mode: 'once' | 'always'): Promise<void> {
  await page.addInitScript(initialMode => {
    const state: KeygenFault = { mode: initialMode, attempts: 0, injectedFailures: 0, delegatedCalls: 0 };
    (window as unknown as FaultWindow).__classrupKeygenFault = state;
    const nativeGenerateKey = crypto.subtle.generateKey.bind(crypto.subtle);
    Object.defineProperty(crypto.subtle, 'generateKey', {
      configurable: true,
      value: async (algorithm: AlgorithmIdentifier, extractable: boolean, keyUsages: KeyUsage[]) => {
        const name = typeof algorithm === 'string' ? algorithm : algorithm.name;
        if (name === 'Ed25519') {
          state.attempts++;
          if (state.mode === 'always' || (state.mode === 'once' && state.injectedFailures === 0)) {
            state.injectedFailures++;
            throw new DOMException('Injected native key-generation diagnostic', 'OperationError');
          }
          state.delegatedCalls++;
        }
        // Successful keys always come from the browser's original native implementation.
        return nativeGenerateKey(algorithm, extractable, keyUsages);
      },
    });
  }, mode);
}

async function faultState(page: Page): Promise<KeygenFault> {
  return page.evaluate(() => ({ ...(window as unknown as FaultWindow).__classrupKeygenFault }));
}

async function enterCredentials(page: Page, name: string): Promise<void> {
  await page.locator('[name="vault"]').fill(name);
  await page.locator('[name="passphrase"]').fill(password);
}

async function createVault(page: Page, name: string): Promise<string> {
  await enterCredentials(page, name);
  await page.getByRole('button', { name: 'Create a new vault', exact: true }).click();
  await expect(page.locator('#workspace')).toBeVisible();
  await expect(page.locator('#status')).toHaveText(/Vault unlocked/);
  await expect(page.locator('#error')).toBeHidden();
  const principal = (await page.locator('#principal').textContent())!;
  expect(principal).toMatch(/^did:key:z/);
  return principal;
}

async function signedDownload(page: Page, buttonName: string): Promise<string> {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: buttonName, exact: true }).click();
  const file = await (await pending).path();
  if (!file) throw new Error('Signed listing download has no readable path');
  await expect(page.locator('#error')).toBeHidden();
  return readFile(file, 'utf8');
}

async function signedListingSurvivesLock(page: Page, name: string, title: string, principal: string): Promise<void> {
  const form = page.locator('#listing-form');
  await form.getByLabel('Title', { exact: true }).fill(title);
  await form.getByLabel('Description', { exact: true }).fill('A real signed listing retained after native key-generation recovery.');
  await form.getByLabel('Declared value').fill('12500');
  await form.getByLabel('Allow this listing').check();
  await form.getByRole('button', { name: 'Save local draft', exact: true }).click();
  await expect(page.locator('#listings').getByRole('heading', { name: title, exact: true })).toBeVisible();
  // The product verifies the native signature before offering this download.
  const signed = await signedDownload(page, 'Publish signed file');
  expect(JSON.parse(signed)).toMatchObject({ author: principal, sig: expect.any(String) });
  expect(signed).toContain(title);
  await expect(page.locator('#listings')).toContainText('published');

  await page.getByRole('button', { name: 'Lock vault', exact: true }).click();
  await expect(page.locator('#workspace')).toBeHidden();
  await expect(page.locator('#principal')).toBeEmpty();
  await expect(page.locator('#listings')).toBeEmpty();
  await enterCredentials(page, name);
  await page.getByRole('button', { name: 'Unlock', exact: true }).click();
  await expect(page.locator('#workspace')).toBeVisible();
  await expect(page.locator('#status')).toHaveText(/Vault unlocked/);
  await expect(page.locator('#principal')).toHaveText(principal);
  await expect(page.locator('#listings').getByRole('heading', { name: title, exact: true })).toBeVisible();
  expect(await signedDownload(page, 'Download signed listing again')).toBe(signed);
}

test('one native key-generation OperationError recovers into a persistent signing vault', async ({ page }) => {
  await installKeygenFault(page, 'once');
  await page.goto('/');
  const principal = await createVault(page, 'keygen-once');
  const recovered = await faultState(page);
  // A real native failure may consume the third attempt after our injected first failure.
  expect(recovered.attempts).toBeGreaterThanOrEqual(2);
  expect(recovered.attempts).toBeLessThanOrEqual(3);
  expect(recovered.injectedFailures).toBe(1);
  expect(recovered.delegatedCalls).toBe(recovered.attempts - 1);

  await signedListingSurvivesLock(page, 'keygen-once', 'Listing after one native keygen failure', principal);
  // Unlock must import the persisted identity, not silently generate a replacement.
  expect(await faultState(page)).toEqual(recovered);
});

test('exhausted native key generation stays locked and a fresh explicit create can recover', async ({ page }) => {
  await installKeygenFault(page, 'always');
  await page.goto('/');
  await enterCredentials(page, 'keygen-exhausted');
  await page.getByRole('button', { name: 'Create a new vault', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Browser cryptography failed during generate-key.');
  await expect(page.locator('#workspace')).toBeHidden();
  await expect(page.locator('#principal')).toBeEmpty();
  await expect(page.locator('[name="passphrase"]')).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Create a new vault', exact: true })).toBeEnabled();
  expect(await faultState(page)).toEqual({ mode: 'always', attempts: 3, injectedFailures: 3, delegatedCalls: 0 });

  // Keep the same vault name: failed creation must release storage without persisting an identity.
  await page.evaluate(() => { (window as unknown as FaultWindow).__classrupKeygenFault.mode = 'off'; });
  const principal = await createVault(page, 'keygen-exhausted');
  const recovered = await faultState(page);
  expect(recovered.attempts).toBeGreaterThanOrEqual(4);
  expect(recovered.attempts).toBeLessThanOrEqual(6);
  expect(recovered.injectedFailures).toBe(3);
  expect(recovered.delegatedCalls).toBe(recovered.attempts - 3);

  await signedListingSurvivesLock(page, 'keygen-exhausted', 'Listing after an explicit new create', principal);
  expect(await faultState(page)).toEqual(recovered);
});
