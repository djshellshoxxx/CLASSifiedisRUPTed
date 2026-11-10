import { expect, test } from '@playwright/test';

/** UX-2 / local-first: a disabled script must not permit vault passphrases to be sent as form navigation. */
test('without JavaScript, vault access is inert and an explicit offline-safe explanation is shown', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/');
    await expect(page.locator('#requires-javascript')).toBeVisible();
    await expect(page.locator('#requires-javascript')).toContainText('JavaScript');
    await expect(page.locator('#access')).toHaveAttribute('inert', '');
    await expect(page.getByRole('button', { name: 'Create a new vault' })).toHaveCount(0);
    await expect(page.locator('#workspace')).toBeHidden();
  } finally {
    await context.close();
  }
});

test('after startup, access forms are interactable and the no-script warning is absent', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#access')).not.toHaveAttribute('inert', '');
  await expect(page.getByRole('button', { name: 'Create a new vault' })).toBeEnabled();
  await expect(page.locator('#requires-javascript')).toHaveCount(0);
});
