import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const password = 'correct horse local alpha 2026';
async function create(page: Page, name: string) {
  await page.goto('/');
  await page.locator('[name="vault"]').fill(name);
  await page.locator('[name="passphrase"]').fill(password);
  await page.getByRole('button', { name: 'Create a new vault' }).click();
  await expect(page.locator('#workspace')).toBeVisible();
  await expect(page.locator('#status')).toHaveText(/Vault unlocked/);
  return (await page.locator('#principal').textContent())!;
}
async function unlock(page: Page, name: string) {
  await page.locator('[name="vault"]').fill(name);
  await page.locator('[name="passphrase"]').fill(password);
  await page.getByRole('button', { name: 'Unlock', exact: true }).click();
  await expect(page.locator('#workspace')).toBeVisible();
  await expect(page.locator('#status')).toHaveText(/Vault unlocked/);
}
async function listing(page: Page, title: string, amount = '12500') {
  const form = page.locator('#listing-form');
  await form.getByLabel('Title', { exact: true }).fill(title);
  await form.getByLabel('Description', { exact: true }).fill('A locally persisted item, available for an explicit exchange.');
  await form.getByLabel('Declared value').fill(amount);
  await form.getByLabel('Allow this listing').check();
  await form.getByRole('button', { name: 'Save local draft' }).click();
  await expect(page.locator('#listings').getByRole('heading', { name: title, exact: true })).toBeVisible();
}

test('local listing contents and identifiers stay encrypted on disk across lock and unlock', async ({ page }) => {
  const principal = await create(page, 'encrypted-disk');
  const title = 'Private disk encryption canary';
  await listing(page, title);
  const persisted = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('classrup-vault:encrypted-disk');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      const entries = await Promise.all(Array.from(db.objectStoreNames).map(async table => {
        const store = db.transaction(table).objectStore(table);
        const keys = store.getAllKeys();
        const values = store.getAll();
        return await new Promise<unknown>((resolve, reject) => {
          values.onsuccess = () => resolve({ table, keys: keys.result, values: values.result });
          values.onerror = () => reject(values.error);
        });
      }));
      return JSON.stringify(entries);
    } finally { db.close(); }
  });
  expect(persisted).toContain('classrup.storage-row/v1');
  expect(persisted).not.toContain(title);
  expect(persisted).not.toContain(principal);
  await page.getByRole('button', { name: 'Lock vault', exact: true }).click();
  await unlock(page, 'encrypted-disk');
  await expect(page.locator('#listings')).toContainText(title);
});

test('real persisted identity/listing and isolated peer signed-file exchange', async ({ browser, page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const alice = await create(page, 'alice');
  // This minor-unit amount would lose a cent if converted to a JavaScript number.
  const amount = '900719925474099301';
  const display = /Declared value: CAD\s*9,007,199,254,740,993\.01/;
  await listing(page, '<img src=x onerror=alert(1)> Guitar', amount);
  await expect(page.locator('#listings')).toContainText(display, { timeout: 4000 });
  const published = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Publish signed file' }).click();
  const download = await published;
  const downloadedPath = await download.path();
  if (!downloadedPath) throw new Error('Signed-file download has no readable path');
  const signed = await readFile(downloadedPath, 'utf8');
  await expect(page.locator('#listings')).toContainText('published');
  expect(await page.locator('#listings img').count()).toBe(0);
  await page.reload();
  await expect(page.locator('#access')).toBeVisible();
  await unlock(page, 'alice');
  expect(await page.locator('#principal').textContent()).toBe(alice);
  await expect(page.locator('#listings')).toContainText('Guitar');

  const peerContext = await browser.newContext({ baseURL: new URL(page.url()).origin });
  try {
    const peer = await peerContext.newPage();
    const bob = await create(peer, 'bob');
    expect(bob).not.toBe(alice);
    await expect(peer.locator('#listings')).toContainText('No listings yet');
    await peer.locator('#peer-file').setInputFiles({ name: 'alice-listing.json', mimeType: 'application/json', buffer: Buffer.from(signed) });
    await expect(peer.locator('#peers')).toContainText('Guitar');
    await expect(peer.locator('#peers')).toContainText(display);
    await expect(peer.locator('#status')).toContainText('verified and retained');
    await expect(peer.locator('#peer-search-status')).toHaveText('1 matching retained peer listing.');
    // Draft choices do not change results until applied; reset restores the complete retained view.
    await peer.getByLabel('Filter listing type').selectOption('wanted');
    await expect(peer.locator('#peers article')).toHaveCount(1);
    await peer.getByRole('button', { name: 'Apply search', exact: true }).click();
    await expect(peer.locator('#peer-search-status')).toHaveText('0 matching retained peer listings.');
    await peer.getByRole('button', { name: 'Reset search', exact: true }).click();
    await expect(peer.locator('#peers article')).toHaveCount(1);
    await peer.getByLabel('Filter condition').selectOption('good');
    await peer.getByLabel('Search coarse area').fill('c2b2');
    await peer.getByLabel('Approximate radius').selectOption('5');
    await peer.getByLabel('Peer listing order').selectOption('ranked');
    await peer.getByRole('button', { name: 'Apply search', exact: true }).click();
    await expect(peer.locator('#peers article')).toHaveCount(1);
    await peer.getByLabel('Search coarse area').fill('');
    await peer.getByRole('button', { name: 'Apply search', exact: true }).click();
    await expect(peer.locator('#error')).toContainText('Enter a coarse area');
    await expect(peer.locator('#peers article')).toHaveCount(1);
    await peer.getByRole('button', { name: 'Reset search', exact: true }).click();

    // Repeat the exact same upload; the file input must reset and processing must stay idempotent.
    await peer.locator('#peer-file').setInputFiles({ name: 'alice-listing.json', mimeType: 'application/json', buffer: Buffer.from(signed) });
    await expect(peer.locator('#peers article')).toHaveCount(1);
    const tampered = JSON.parse(signed) as { payload: { title: string } };
    tampered.payload.title = 'Attacker replacement';
    await peer.locator('#peer-file').setInputFiles({ name: 'tampered.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(tampered)) });
    await expect(peer.locator('#error')).toBeVisible();
    await expect(peer.locator('#peers')).not.toContainText('Attacker replacement');
    await peer.reload();
    await unlock(peer, 'bob');
    await expect(peer.locator('#peers')).toContainText('Guitar');
    await peer.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await peerContext.setOffline(true);
    await expect(peer.locator('#network')).toContainText('Offline');
    await listing(peer, 'Offline table');
    await expect(peer.locator('#listings')).toContainText('Offline table');
    await peer.reload();
    await unlock(peer, 'bob');
    await expect(peer.locator('#network')).toContainText('Offline');
    await peerContext.setOffline(false);
    await expect(peer.locator('#listings')).toContainText('Offline table');
  } finally { await peerContext.close(); }
  expect(errors).toEqual([]);
});

test('wrong passphrase fails without destroying saved records; lock clears private form text', async ({ page }) => {
  await create(page, 'local');
  await listing(page, 'Retained chair');
  await page.getByLabel('Title', { exact: true }).fill('Unsubmitted private text');
  await page.getByLabel('Search retained listings').fill('Private search draft');
  await page.getByLabel('Search coarse area').fill('u4pru');
  await page.getByLabel('Approximate radius').selectOption('10');
  await page.getByLabel('Filter listing type').selectOption('wanted');
  await page.getByLabel('Filter condition').selectOption('fair');
  await page.getByLabel('Peer listing order').selectOption('ranked');
  await page.getByRole('button', { name: 'Apply search', exact: true }).click();

  await page.getByRole('button', { name: 'Lock vault' }).click();
  await expect(page.locator('#workspace')).toBeHidden();
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Search retained listings')).toHaveValue('');
  await expect(page.getByLabel('Search coarse area')).toHaveValue('');
  await expect(page.getByLabel('Approximate radius')).toHaveValue('');
  await expect(page.getByLabel('Filter listing type')).toHaveValue('');
  await expect(page.getByLabel('Filter condition')).toHaveValue('');
  await expect(page.getByLabel('Peer listing order')).toHaveValue('retained');
  await expect(page.locator('#peer-search-status')).toHaveText('');

  await page.locator('[name="passphrase"]').fill('incorrect passphrase here');
  await page.getByRole('button', { name: 'Unlock', exact: true }).click();
  await expect(page.locator('#error')).toContainText(/Incorrect passphrase|damaged/);
  await expect(page.locator('[name="passphrase"]')).toHaveValue('');
  await expect(page.locator('#workspace')).toBeHidden();
  await unlock(page, 'local');
  await expect(page.locator('#listings')).toContainText('Retained chair');
});

test('local notification preferences survive reload, backup and lock without external delivery', async ({ page, context }) => {
  await create(page, 'inbox');
  await expect(page.locator('#notification-count')).toHaveText('0 unread notifications.');
  await expect(page.getByLabel('Security notifications (always enabled)')).toBeChecked();
  await expect(page.getByLabel('Security notifications (always enabled)')).toBeDisabled();
  await page.getByLabel('Barter updates', { exact: true }).uncheck();
  await page.getByRole('button', { name: 'Save notification preferences' }).click();
  await expect(page.locator('#status')).toHaveText('Local notification preferences saved.');
  await expect(page.getByLabel('Barter updates', { exact: true })).not.toBeChecked();
  await page.reload(); await unlock(page, 'inbox');
  await expect(page.getByLabel('Barter updates', { exact: true })).not.toBeChecked();
  await page.locator('#backup-password').fill(password);
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download encrypted backup' }).click();
  const path = await (await pending).path();
  if (!path) throw new Error('Missing backup download');
  const backup = await readFile(path);
  await page.getByRole('button', { name: 'Lock vault' }).click();
  await expect(page.locator('#notifications')).toBeEmpty();
  await page.locator('#access details summary').click();
  await page.locator('[name="restore-name"]').fill('restored-inbox');
  await page.locator('[name="restore-password"]').fill(password);
  await page.locator('#restore-file').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: backup });
  await page.getByRole('button', { name: 'Restore backup', exact: true }).click();
  await expect(page.locator('#status')).toContainText('Backup restored');
  await expect(page.getByLabel('Barter updates', { exact: true })).not.toBeChecked();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.getByLabel('Barter updates', { exact: true }).check();
  await page.getByRole('button', { name: 'Save notification preferences' }).click();
  await expect(page.locator('#status')).toHaveText('Local notification preferences saved.');
  await expect(page.locator('#notification-delivery-status')).toBeEmpty();
});

test('listing edits preserve exact amounts, publish public fields, and clear drafts on lock', async ({ page }) => {
  await create(page, 'editor');
  await listing(page, 'Original guitar', '900719925474099301');
  await page.getByRole('button', { name: 'Edit listing', exact: true }).click();
  await page.getByLabel('Edit title', { exact: true }).fill('Cancelled change');
  await page.getByRole('button', { name: 'Cancel editing', exact: true }).click();
  await expect(page.locator('#listings')).toContainText('Original guitar');
  await page.getByRole('button', { name: 'Edit listing', exact: true }).click();
  await page.getByLabel('Edit title', { exact: true }).fill('Edited guitar');
  await page.getByLabel('Edit condition', { exact: true }).selectOption('fair');
  await page.getByLabel('Edit declared value (minor units)', { exact: true }).fill('900719925474099302');
  await page.getByLabel('Private listing notes', { exact: true }).fill('Private seller detail');
  await page.getByRole('button', { name: 'Save listing changes', exact: true }).click();
  await expect(page.locator('#listing-editor')).toBeHidden();
  await expect(page.locator('#listings')).toContainText('Edited guitar');
  await expect(page.locator('#listings')).toContainText(/CAD\s*9,007,199,254,740,993\.02/);
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Publish signed file', exact: true }).click();
  const path = await (await pending).path();
  if (!path) throw new Error('Missing signed listing');
  const signed = await readFile(path, 'utf8');
  expect(signed).toContain('Edited guitar');
  expect(signed).toContain('900719925474099302');
  expect(JSON.parse(signed).payload.condition).toBe('fair');
  expect(signed).not.toContain('Private seller detail');
  await expect(page.getByRole('button', { name: 'Edit listing', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Unpublish', exact: true }).click();
  await page.getByRole('button', { name: 'Edit listing', exact: true }).click();
  await expect(page.getByLabel('Private listing notes', { exact: true })).toHaveValue('Private seller detail');
  await page.getByLabel('Edit title', { exact: true }).fill('Revised guitar');
  await page.getByLabel('Edit condition', { exact: true }).selectOption('good');
  await page.getByRole('button', { name: 'Save listing changes', exact: true }).click();
  const history = page.locator('#listings > article > details');
  await history.locator('summary').first().click();
  await history.getByRole('button', { name: 'Load revision history', exact: true }).click();
  await expect(history.getByRole('status')).toHaveText('2 local revision snapshots loaded.');
  await expect(history).toContainText('Material change');
  await expect(history).toContainText('Saved locally; not published');
  await expect(history).toContainText('Published locally');
  await expect(history).not.toContainText('Private seller detail');
  await page.getByRole('button', { name: 'Edit listing', exact: true }).click();
  await page.getByLabel('Edit title', { exact: true }).fill('Unsubmitted edit');
  await page.getByRole('button', { name: 'Lock vault', exact: true }).click();
  await expect(page.locator('#listing-editor')).toBeEmpty();
  await page.reload(); await unlock(page, 'editor');
  await expect(page.locator('#listings')).toContainText('Revised guitar');
  await expect(page.locator('#listings')).not.toContainText('Unsubmitted edit');
});

test('encrypted backup restores listings and identity into a new empty vault', async ({ page }) => {
  const principal = await create(page, 'source');
  await listing(page, 'Backup-only lamp');
  await page.locator('#backup-password').fill(password);
  const pending = page.waitForEvent('download', { timeout: 20000 });
  await page.getByRole('button', { name: 'Download encrypted backup' }).click();
  const path = await (await pending).path();
  if (!path) throw new Error('Backup download has no path');
  const backup = await readFile(path);
  expect(backup.toString()).not.toContain('Backup-only lamp');
  expect(backup.toString()).not.toContain(password);
  await expect(page.locator('#backup-password')).toHaveValue('');
  await page.getByRole('button', { name: 'Lock vault' }).click();
  await page.locator('#access details summary').click();
  await page.locator('[name="restore-name"]').fill('restored');
  await page.locator('[name="restore-password"]').fill(password);
  await page.locator('#restore-file').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: backup });
  await page.getByRole('button', { name: 'Restore backup', exact: true }).click();
  await expect(page.locator('#workspace')).toBeVisible();
  await expect(page.locator('#status')).toContainText('Backup restored');
  expect(await page.locator('#principal').textContent()).toBe(principal);
  await expect(page.locator('#listings')).toContainText('Backup-only lamp');
  await page.reload();
  await unlock(page, 'restored');
  await expect(page.locator('#listings')).toContainText('Backup-only lamp');
});

test('archive signs a withdrawal, survives encrypted backup and restores unpublished', async ({ page }) => {
  await create(page, 'archive-source');
  await listing(page, 'Restorable canoe');
  await downloadedAction(page, 'Publish signed file');
  page.once('dialog', dialog => dialog.accept());
  const withdrawal = JSON.parse((await downloadedAction(page, 'Archive')).toString());
  expect(withdrawal.type).toBe('classrup.alpha.tombstone/v1');
  await expect(page.locator('#listings')).toContainText('archived');
  await expect(page.getByRole('button', { name: 'Publish signed file', exact: true })).toHaveCount(0);
  await page.locator('#backup-password').fill(password);
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download encrypted backup' }).click();
  const path = await (await pending).path();
  if (!path) throw new Error('Backup unavailable');
  const backup = await readFile(path);
  expect(backup.toString()).not.toContain('Restorable canoe');
  await page.getByRole('button', { name: 'Lock vault' }).click();
  await page.locator('#access details summary').click();
  await page.locator('[name="restore-name"]').fill('archive-restored');
  await page.locator('[name="restore-password"]').fill(password);
  await page.locator('#restore-file').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: backup });
  await page.getByRole('button', { name: 'Restore backup', exact: true }).click();
  await expect(page.locator('#status')).toContainText('Backup restored');
  await page.getByRole('button', { name: 'Restore listing', exact: true }).click();
  await expect(page.locator('#listings')).toContainText('unpublished');
  await expect(page.getByRole('button', { name: 'Publish signed file', exact: true })).toBeVisible();
  await page.reload(); await unlock(page, 'archive-restored');
  await expect(page.locator('#listings')).toContainText('unpublished');
  const republished = JSON.parse((await downloadedAction(page, 'Publish signed file')).toString());
  expect(republished.seq).toBe(3); expect(republished.prev).toBe(withdrawal.cid);
});

test('owner listing pages expose records beyond 50 and reset after locking', async ({ page }) => {
  await create(page, 'listing-pages');
  page.on('dialog', dialog => dialog.accept());
  for (let index = 0; index < 51; index++) {
    await listing(page, `Archived page item ${index}`);
    const newest = page.locator('#listings > article').first();
    await newest.getByRole('button', { name: 'Archive', exact: true }).click();
    await expect(page.locator('#status')).toContainText('Archived locally');
  }
  await expect(page.locator('#listings > article')).toHaveCount(50);
  await page.getByRole('button', { name: 'Next listings', exact: true }).click();
  await expect(page.locator('#listings > article')).toHaveCount(1);
  await expect(page.locator('#listings')).toContainText('Archived page item 0');
  await expect(page.locator('#listings')).not.toContainText('Archived page item 50');
  await page.getByRole('button', { name: 'Previous listings', exact: true }).click();
  await expect(page.locator('#listings > article')).toHaveCount(50);
  await expect(page.locator('#listings')).toContainText('Archived page item 50');
  await page.getByRole('button', { name: 'Next listings', exact: true }).click();
  await expect(page.locator('#listings > article')).toHaveCount(1);
  await page.getByRole('button', { name: 'Lock vault', exact: true }).click();
  await unlock(page, 'listing-pages');
  await expect(page.locator('#listings > article')).toHaveCount(50);
  await expect(page.getByRole('button', { name: 'Previous listings', exact: true })).toHaveCount(0);
});

test('concurrent tabs cannot both acquire a vault writer', async ({ page, context }) => {
  await create(page, 'shared');
  const second = await context.newPage();
  await second.goto('/');
  await second.locator('[name="vault"]').fill('shared');
  await second.locator('[name="passphrase"]').fill(password);
  await second.getByRole('button', { name: 'Unlock', exact: true }).click();
  await expect(second.locator('#error')).toBeVisible();
  await expect(second.locator('#workspace')).toBeHidden();
  await expect(second.locator('[name="passphrase"]')).toHaveValue('');
  await second.locator('#access details summary').click();
  await second.locator('[name="restore-name"]').fill('shared');
  await second.locator('[name="restore-password"]').fill(password);
  await second.locator('#restore-file').setInputFiles({ name: 'unused-backup.json', mimeType: 'application/json', buffer: Buffer.from('{}') });
  await second.getByRole('button', { name: 'Restore backup', exact: true }).click();
  await expect(second.locator('#error')).toBeVisible();
  await expect(second.locator('[name="restore-password"]')).toHaveValue('');
  await expect(second.locator('#restore-file')).toHaveValue('');
  await listing(page, 'First writer remains valid');
  await page.getByRole('button', { name: 'Lock vault' }).click();
  await unlock(second, 'shared');
  await expect(second.locator('#listings')).toContainText('First writer remains valid');
});

test('rapid duplicate vault submissions preserve the first active session', async ({ page }) => {
  await page.goto('/');
  await page.locator('[name="vault"]').fill('duplicate');
  await page.locator('[name="passphrase"]').fill(password);
  await page.locator('#unlock-form').evaluate(formNode => {
    const form = formNode as HTMLFormElement;
    const submitter = form.querySelector<HTMLButtonElement>('button[value="create"]')!;
    form.requestSubmit(submitter); form.requestSubmit(submitter);
  });
  await expect(page.locator('#workspace')).toBeVisible();
  await expect(page.locator('#error')).toHaveText('Lock the current vault before opening another one.');
  await expect(page.locator('[name="passphrase"]')).toHaveValue('');
  await listing(page, 'Duplicate submission kept this vault');
  await expect(page.locator('#error')).toBeHidden();
  await page.getByRole('button', { name: 'Lock vault', exact: true }).click();
  await unlock(page, 'duplicate');
  await expect(page.locator('#listings')).toContainText('Duplicate submission kept this vault');
});

test('mobile layout stays within viewport and exposes keyboard error feedback', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await create(page, 'mobile');
  await listing(page, 'Long title for a neighbourhood listing which wraps on a small mobile screen');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const buttons = await page.getByRole('button').all();
  for (const button of buttons) {
    if (!await button.isVisible()) continue;
    const box = await button.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  await page.screenshot({ path: testInfo.outputPath('mobile390.png'), fullPage: true });
  await page.locator('#backup-password').fill('wrong passphrase for backup');
  await page.getByRole('button', { name: 'Download encrypted backup' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#error')).toBeVisible();
  await expect(page.locator('#error')).toBeFocused();
});

async function downloadedAction(page: Page, name: string): Promise<Buffer> {
  const pending = page.waitForEvent('download', { timeout: 20000 });
  await page.getByRole('button', { name, exact: true }).click();
  let downloaded;
  try { downloaded = await pending; }
  catch (error) { throw new Error(`${name}: download failed; visible error: ${await page.locator('#error').textContent()}`, { cause: error }); }
  const file = await downloaded.path();
  if (!file) throw new Error(`Missing download for ${name}`);
  await expect(page.locator('#error')).toBeHidden();
  return readFile(file);
}
async function importBarter(page: Page, buffer: Buffer) {
  await page.getByLabel('Import a signed want, proposal, consent, reservation or withdrawal JSON file', { exact: true }).setInputFiles({ name: 'statement.json', mimeType: 'application/json', buffer });
  await expect(page.locator('#status')).toHaveText('Signed statement verified and saved locally.');
  await expect(page.locator('#error')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Refresh barter records', exact: true })).toBeEnabled();
}
for (const count of [2, 3, 4]) {
  test(`${count} isolated principals explicitly agree to a real signed barter cycle and retain it after restart`, async ({ browser }) => {
    test.setTimeout(180000);
    const contexts = await Promise.all(Array.from({ length: count }, () => browser.newContext({ baseURL: 'http://127.0.0.1:4173' })));
    try {
      const pages = await Promise.all(contexts.map(context => context.newPage()));
      const start = Date.now();
      const listings: Buffer[] = [];
      for (const [i, page] of pages.entries()) {
        await page.clock.setFixedTime(new Date(start));
        await create(page, `party${i}`);
        await listing(page, `Cycle item ${i}`);
        listings.push(await downloadedAction(page, 'Publish signed file'));
      }
      for (const [i, page] of pages.entries()) {
        for (const [j, buffer] of listings.entries()) {
          if (i === j) continue;
          await page.locator('#peer-file').setInputFiles({ name: `listing${j}.json`, mimeType: 'application/json', buffer });
          await expect(page.locator('#status')).toHaveText('Peer statement verified and retained locally.');
          await expect(page.getByRole('button', { name: 'Refresh barter records', exact: true })).toBeEnabled();
        }
        await page.getByLabel('Include unfamiliar signing identities', { exact: false }).check();
      }
      const wants: Buffer[] = [];
      for (const [i, page] of pages.entries()) {
        const own = JSON.parse(listings[i]!.toString()) as { cid: string };
        const requested = JSON.parse(listings[(i + 1) % count]!.toString()) as { cid: string };
        await page.getByLabel('I offer my published item').selectOption(own.cid);
        await page.getByLabel('I want this retained peer item').selectOption(requested.cid);
        wants.push(await downloadedAction(page, 'Sign and download this want'));
      }
      for (const [i, page] of pages.entries()) {
        for (const [j, buffer] of wants.entries()) if (i !== j) await importBarter(page, buffer);
        // Virtual browser Date, explicitly advanced across the specification's aging interval.
        await page.clock.setFixedTime(new Date(start + 16 * 60000));
      }
      const coordinator = pages[0]!;
      await coordinator.getByRole('button', { name: 'Discover compatible cycles', exact: true }).click();
      // UX-2: dynamic matching results must be announced by an accessible live status, not only added visually.
      await expect(coordinator.locator('section[aria-label="Local barter coordination"] [role="status"]')).toContainText('matching suggestions');
      await expect(coordinator.getByRole('heading', { name: `${count}-party cycle`, exact: true })).toBeVisible();
      const proposal = await downloadedAction(coordinator, 'Propose this exact cycle');
      if (count === 2) await pages[1]!.evaluate(() => {
        const transaction = IDBDatabase.prototype.transaction;
        let fail = true;
        IDBDatabase.prototype.transaction = function (...args: Parameters<IDBDatabase['transaction']>) {
          const stores = typeof args[0] === 'string' ? [args[0]] : Array.from(args[0]);
          if (fail && args[1] === 'readwrite' && stores.includes('inbox')) {
            fail = false;
            throw new DOMException('Injected notification commit failure', 'UnknownError');
          }
          return transaction.apply(this, args);
        };
      });
      for (const page of pages.slice(1)) await importBarter(page, proposal);
      if (count === 2) {
        const peer = pages[1]!;
        await expect(peer.locator('#notification-delivery-status')).toContainText('Some local updates could not be processed');
        await expect(peer.locator('#notification-count')).toHaveText('0 unread notifications.');
        await peer.clock.setFixedTime(new Date(start + 17 * 60000));
        await peer.getByRole('button', { name: 'Refresh notifications', exact: true }).click();
        await expect(peer.locator('#notification-delivery-status')).toBeEmpty();
      }
      await expect(coordinator.locator('#notification-count')).toHaveText('0 unread notifications.');
      for (const page of pages.slice(1)) {
        await expect(page.locator('#notification-count')).toHaveText('1 unread notification.');
        await expect(page.locator('#notification-list')).toContainText('Barter coordination updated');
      }
      const reservations: Buffer[] = [];
      for (const page of pages) reservations.push(await downloadedAction(page, 'Reserve my item and download signed claim'));
      for (const [i, page] of pages.entries()) {
        for (const [j, buffer] of reservations.entries()) if (i !== j) await importBarter(page, buffer);
        await expect(page.getByRole('heading', { name: /Proposal .* · proposed/ })).toBeVisible();
      }
      const consents: Buffer[] = [];
      for (const page of pages) consents.push(await downloadedAction(page, 'I consent to this exact proposal'));
      for (const [i, page] of pages.entries()) {
        for (const [j, buffer] of consents.entries()) if (i !== j) await importBarter(page, buffer);
        await expect(page.getByRole('heading', { name: /Proposal .* · committed/ })).toBeVisible();
        await page.reload();
        await unlock(page, `party${i}`);
        await expect(page.getByRole('heading', { name: /Proposal .* · committed/ })).toBeVisible();
      }
      if (count === 2) {
        await pages[1]!.getByRole('button', { name: 'Mark all as read', exact: true }).click();
        await expect(pages[1]!.locator('#notification-count')).toHaveText('0 unread notifications.');
        await pages[1]!.getByLabel('Show notifications', { exact: true }).selectOption('all');
        await expect(pages[1]!.locator('#notification-list')).toContainText('Read');
        const withdrawal = await downloadedAction(coordinator, 'Withdraw from this proposal');
        await importBarter(pages[1]!, withdrawal);
        await expect(pages[1]!.locator('#notification-count')).toHaveText('1 unread notification.');
        await pages[1]!.getByRole('button', { name: 'Mark as read', exact: true }).click();
        await expect(pages[1]!.locator('#notification-count')).toHaveText('0 unread notifications.');
        for (const page of pages) {
          await expect(page.getByRole('heading', { name: /Proposal .* · cancelled/ })).toHaveCount(1);
          await expect(page.getByRole('button', { name: 'Release local hold', exact: true })).toHaveCount(0);
          await page.getByLabel('Include unfamiliar signing identities', { exact: false }).check();
        }
        // A fresh proposal receives no consent; advance the explicit virtual clock past its deadline.
        await coordinator.getByRole('button', { name: 'Discover compatible cycles', exact: true }).click();
        const unanswered = await downloadedAction(coordinator, 'Propose this exact cycle');
        await importBarter(pages[1]!, unanswered);
        for (const page of pages) {
          await page.clock.setFixedTime(new Date(start + 78 * 60000));
          await page.getByRole('button', { name: 'Refresh barter records', exact: true }).click();
          await expect(page.getByRole('heading', { name: /Proposal .* · cancelled/ })).toHaveCount(2);
          await expect(page.getByRole('heading', { name: /Proposal .* · proposed/ })).toHaveCount(0);
          await expect(page.locator('#barter')).toContainText('consent_timeout');
        }
      }
    } finally { await Promise.all(contexts.map(context => context.close())); }
  });
}
