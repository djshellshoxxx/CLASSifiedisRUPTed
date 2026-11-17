import { expect, test } from '@playwright/test';

test('the public matching worker is available offline after application installation', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise<void>(resolve => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }));
  });
  await context.setOffline(true);
  const result = await page.evaluate(async () => {
    return new Promise<unknown>((resolve, reject) => {
      const worker = new Worker(new URL('./matching-worker.js', location.href), { type: 'module' });
      const timer = setTimeout(() => { worker.terminate(); reject(new Error('Offline matching worker timed out')); }, 15000);
      worker.onerror = () => { clearTimeout(timer); worker.terminate(); reject(new Error('Offline matching worker failed')); };
      worker.onmessage = event => { clearTimeout(timer); worker.terminate(); resolve(event.data); };
      worker.postMessage({ v: 1, kind: 'match', id: 1, listings: [], wants: [], admission: { now: Date.now(), localPrincipal: 'local', optedIn: true }, search: {} });
    });
  });
  expect(result).toMatchObject({ v: 1, kind: 'result', id: 1, outcome: { result: { suggestions: [], stats: { nodes: 0, edges: 0, truncated: 'none' } } } });
});

test('matching can be cancelled from the PWA while ordinary actions are busy', async ({ page }) => {
  // Simulate a worker which started but never answered. The product must offer a
  // responsive cancellation path without waiting for the 60-second watchdog.
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, 'Worker', { configurable: true, value: class {
      onmessage = null; onerror = null; onmessageerror = null;
      postMessage(): void {}
      terminate(): void {}
    } });
  });
  await page.goto('/');
  await page.locator('[name="vault"]').fill('cancel-matching');
  await page.locator('[name="passphrase"]').fill('correct horse local alpha 2026');
  await page.getByRole('button', { name: 'Create a new vault' }).click();
  await expect(page.locator('#workspace')).toBeVisible();
  await expect(page.locator('#status')).toHaveText(/Vault unlocked/);
  await page.getByLabel('Include unfamiliar signing identities').check();
  await page.getByRole('button', { name: 'Discover compatible cycles' }).click();
  await expect(page.getByRole('button', { name: 'Lock vault', exact: true })).toBeDisabled();
  const cancel = page.getByRole('button', { name: 'Cancel matching', exact: true });
  await expect(cancel).toBeEnabled();
  await cancel.click();
  await expect(cancel).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Lock vault', exact: true })).toBeEnabled();
  await expect(page.locator('#status')).toContainText('Matching was cancelled');
  await expect(page.locator('#barter')).toContainText('Matching stopped');
});
