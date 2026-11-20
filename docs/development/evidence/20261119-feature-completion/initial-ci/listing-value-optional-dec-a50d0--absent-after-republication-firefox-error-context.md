# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: listing-value.spec.ts >> optional declared value is removed only after an explicit saved edit and stays absent after republication
- Location: tests/browser/listing-value.spec.ts:4:1

# Error details

```
TimeoutError: locator.selectOption: Timeout 20000ms exceeded.
Call log:
  - waiting for locator('#listing-form').getByLabel('Listing type', { exact: true })

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - link "Skip to content" [ref=e2] [cursor=pointer]:
    - /url: "#main"
  - banner [ref=e3]:
    - generic [ref=e4]:
      - text: ClassRup
      - generic [ref=e5]: Local exchange, held by you.
    - generic [ref=e6]: Development alpha
  - main [ref=e7]:
    - heading "Your neighbourhood. Your own vault." [level=1] [ref=e8]: Your neighbourhood.Your own vault.
    - paragraph [ref=e9]: Create listings and exchange signed files directly. Your identity stays in this browser. No account service or relay is required.
    - status [ref=e10]: Vault unlocked. Local changes are persisted in this browser.
    - generic [ref=e11]:
      - generic [ref=e12]:
        - generic [ref=e13]:
          - heading "Your vault" [level=2] [ref=e14]
          - button "Lock vault" [ref=e15] [cursor=pointer]
        - paragraph [ref=e16]: did:key:z6Mkf9axYpUC3vjtEBniUD2XUxC4UXy3kySRqTgwzRtoFkpe
        - paragraph [ref=e17]: Local mode · no relay configured. Files are shared only when you choose.
        - generic [ref=e18]: Lock after inactivity
        - combobox "Lock after inactivity" [ref=e19]:
          - option "1 minute"
          - option "5 minutes"
          - option "15 minutes" [selected]
          - option "30 minutes"
          - option "60 minutes"
        - paragraph [ref=e20]: This session locks after inactivity or 5 minutes in a hidden tab. Keep an encrypted backup of saved records.
      - region [ref=e21]:
        - heading "Your approximate area" [level=2] [ref=e22]
        - paragraph [ref=e23]: These preferences stay in your encrypted vault and encrypted backup. Saving does not publish or change any listing. You may change the home tile three times in a rolling 24 hours; hiding and clearing remain available.
        - form "Location preferences" [ref=e24]:
          - generic [ref=e25]: Home area tile (5-character geohash)
          - textbox "Home area tile (5-character geohash)" [ref=e26]
          - paragraph [ref=e27]: Enter a coarse geohash tile, or use your device position once. Only the approximately 5 km tile is kept; no address or exact coordinates are saved. Tile dimensions vary by latitude.
          - generic [ref=e28]: Area visible when you copy it to a new listing
          - combobox "Area visible when you copy it to a new listing" [ref=e29]:
            - option "Hidden" [selected]
            - option "Region (coarser tile)"
            - option "Area (approximately 5 km tile)"
          - paragraph [ref=e30]: "Visible area: hidden."
          - generic [ref=e31]:
            - button "Use device position once" [ref=e32] [cursor=pointer]
            - button "Save area preferences" [ref=e33] [cursor=pointer]
        - status [ref=e34]: No home area is saved.
      - region [ref=e35]:
        - heading "Create a listing" [level=2] [ref=e36]
        - generic [ref=e37]:
          - generic [ref=e38]:
            - text: Title
            - textbox "Title" [ref=e39]: Optional-value guitar
          - generic [ref=e40]:
            - text: Description
            - textbox "Description" [active] [ref=e41]: A giveaway with an optional exact declared value.
          - generic [ref=e42]:
            - generic [ref=e43]:
              - text: Listing type
              - combobox "Listing type" [ref=e44]:
                - option "Offer an item" [selected]
                - option "Wanted"
                - option "Give away"
            - generic [ref=e45]:
              - text: Condition
              - combobox "Condition" [ref=e46]:
                - option "Good" [selected]
                - option "New"
                - option "Fair"
          - generic [ref=e47]:
            - generic [ref=e48]:
              - text: Declared value (CAD minor units)
              - textbox "Declared value (CAD minor units)" [ref=e49]: "0"
            - generic [ref=e50]:
              - text: Coarse area (4–5 character geohash)
              - textbox "Coarse area (4–5 character geohash)" [ref=e51]: c2b2
          - generic [ref=e52]:
            - checkbox "Allow this listing to participate in barter" [ref=e53]
            - text: Allow this listing to participate in barter
          - button "Save local draft" [ref=e54] [cursor=pointer]
        - paragraph [ref=e55]: "Alpha policy: one general-items category, one item per listing, CAD only. Publishing creates a signed public file; it does not send it to anyone."
      - generic [ref=e56]:
        - heading "Your listings" [level=2] [ref=e57]
        - status [ref=e58]: Local listing lifecycle checked. 0 expired; 0 archived.
        - paragraph [ref=e59]: While your vault is open, expired and closed listings are maintained locally. Closed or expired listings archive after 30 days. Share their signed withdrawals with peers; nothing is sent automatically.
        - generic [ref=e60]:
          - paragraph [ref=e61]: No listings yet. Save your first local draft above.
          - navigation "My listing pages" [ref=e62]
      - generic [ref=e63]:
        - heading "Peer listings" [level=2] [ref=e64]
        - paragraph [ref=e65]: Import a peer's signed listing file. Signature, author, expiry and revision checks run locally.
        - generic [ref=e66]:
          - text: Signed listing file
          - button "Signed listing file" [ref=e67]
        - form "Filter retained peer listings" [ref=e68]:
          - generic [ref=e69]:
            - text: Search retained listings
            - searchbox "Search retained listings" [ref=e70]
          - generic [ref=e71]:
            - generic [ref=e72]:
              - text: Filter listing type
              - combobox "Filter listing type" [ref=e73]:
                - option "All types" [selected]
                - option "Offer an item"
                - option "Wanted"
                - option "Give away"
            - generic [ref=e74]:
              - text: Filter condition
              - combobox "Filter condition" [ref=e75]:
                - option "All conditions" [selected]
                - option "New"
                - option "Like new"
                - option "Good"
                - option "Fair"
                - option "Poor"
                - option "For parts"
          - generic [ref=e76]:
            - generic [ref=e77]:
              - text: Search coarse area
              - textbox "Search coarse area" [ref=e78]:
                - /placeholder: Optional geohash
            - generic [ref=e79]:
              - text: Approximate radius
              - combobox "Approximate radius" [ref=e80]:
                - option "Any area" [selected]
                - option "5 km"
                - option "10 km"
                - option "25 km"
                - option "50 km"
                - option "100 km"
          - paragraph [ref=e81]: A radius needs a coarse area. Results include overlapping regions, not exact distances. Searching does not request device location.
          - generic [ref=e82]:
            - text: Peer listing order
            - combobox "Peer listing order" [ref=e83]:
              - option "Default retained order" [selected]
              - option "Recent + coarse-distance ranking"
          - paragraph [ref=e84]: Ranking uses when this vault first saw a listing and, if supplied, your coarse area. Text is a match filter; paid placement is not used.
          - generic [ref=e85]:
            - button "Apply search" [ref=e86] [cursor=pointer]
            - button "Reset search" [ref=e87] [cursor=pointer]
        - status [ref=e88]: 0 matching retained peer listings.
        - paragraph [ref=e90]: No matching retained peer listings. Import a signed file to start.
      - generic [ref=e91]:
        - heading "Backup and restore" [level=2] [ref=e92]
        - generic [ref=e93]:
          - text: Original vault passphrase
          - textbox "Original vault passphrase" [ref=e94]
        - button "Download encrypted backup" [ref=e95] [cursor=pointer]
        - paragraph [ref=e96]: Restore is allowed only into an empty vault. Imports fail without partially replacing existing data.
      - region "Barter coordination" [ref=e97]:
        - region "Local barter coordination" [ref=e98]:
          - heading "Local barter coordination" [level=2] [ref=e99]
          - paragraph [ref=e100]: Exchange signed listing, want and coordination files with each participant. Nothing is delivered automatically. Local reservations do not guarantee global inventory exclusivity.
          - generic [ref=e101]:
            - checkbox "Include unfamiliar signing identities in cycle discovery (a signature does not establish a person’s identity)." [ref=e102]
            - text: Include unfamiliar signing identities in cycle discovery (a signature does not establish a person’s identity).
          - generic [ref=e103]:
            - text: Blocked signing identities (one did:key per line, current session)
            - textbox "Blocked signing identities (one did:key per line, current session)" [ref=e104]
          - generic [ref=e105]:
            - generic [ref=e106]:
              - text: I offer my published item
              - combobox "I offer my published item" [ref=e107]:
                - option "Select your offered item" [selected]
            - generic [ref=e108]:
              - text: I want this retained peer item
              - combobox "I want this retained peer item" [ref=e109]:
                - option "Select the peer item you want" [selected]
            - button "Sign and download this want" [ref=e110] [cursor=pointer]
          - paragraph [ref=e111]: Wants become eligible after the specification’s 15-minute aging period. Each want expires after seven days. Import every referenced listing before discovering cycles.
          - generic [ref=e112]:
            - text: Import a signed want, proposal, consent, reservation or withdrawal JSON file
            - button "Import a signed want, proposal, consent, reservation or withdrawal JSON file" [ref=e113]
          - status [ref=e114]: 0 signed wants retained. Listings and wants remain local until you share their files.
          - button "Refresh barter records" [ref=e115] [cursor=pointer]
          - button "Discover compatible cycles" [ref=e116] [cursor=pointer]
          - generic [ref=e117]:
            - heading "Proposals and coordination" [level=3] [ref=e118]
            - paragraph [ref=e119]: No proposals. Discover a cycle or import a proposal that names your principal.
          - heading "Local inventory reservations" [level=3] [ref=e121]
      - region [ref=e122]:
        - heading "Notifications" [level=2] [ref=e123]
        - status [ref=e124]: 0 unread notifications.
        - paragraph [ref=e125]: Updates come from signed barter evidence accepted by this vault. Review the current exchange before acting. No push or email is sent.
        - generic [ref=e126]:
          - generic [ref=e127]: Show notifications
          - combobox "Show notifications" [ref=e128]:
            - option "Unread" [selected]
            - option "All notifications"
        - paragraph [ref=e130]: No notifications in this view.
        - button "Refresh notifications" [ref=e132] [cursor=pointer]
        - form "Notification preferences" [ref=e133]:
          - heading "Local preferences" [level=3] [ref=e134]
          - generic [ref=e135]:
            - checkbox "Barter updates" [checked] [ref=e136]
            - text: Barter updates
          - generic [ref=e137]:
            - checkbox "Security notifications (always enabled)" [checked] [disabled] [ref=e138]
            - text: Security notifications (always enabled)
          - button "Save notification preferences" [ref=e139] [cursor=pointer]
        - paragraph [ref=e140]: Notifications expire after 30 days. Turning off barter updates removes unread barter notifications.
      - status
  - contentinfo [ref=e141]: Local-first alpha · No payment custody · No automatic delivery
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | import { readFile } from 'node:fs/promises';
  3  | 
  4  | test('optional declared value is removed only after an explicit saved edit and stays absent after republication', async ({ page }) => {
  5  |   const passphrase = 'correct horse optional value 2026';
  6  |   const amount = '900719925474099301';
  7  |   await page.goto('/');
  8  |   await page.getByLabel('Vault name', { exact: true }).fill('optional-value');
  9  |   await page.locator('[name="passphrase"]').fill(passphrase);
  10 |   await page.getByRole('button', { name: 'Create a new vault', exact: true }).click();
  11 |   await expect(page.locator('#workspace')).toBeVisible();
  12 |   const create = page.locator('#listing-form');
  13 |   await create.getByLabel('Title', { exact: true }).fill('Optional-value guitar');
  14 |   await create.getByLabel('Description', { exact: true }).fill('A giveaway with an optional exact declared value.');
> 15 |   await create.getByLabel('Listing type', { exact: true }).selectOption('giveaway');
     |                                                            ^ TimeoutError: locator.selectOption: Timeout 20000ms exceeded.
  16 |   await create.getByLabel('Declared value').fill(amount);
  17 |   await create.getByRole('button', { name: 'Save local draft', exact: true }).click();
  18 |   await expect(page.locator('#listings')).toContainText('Optional-value guitar');
  19 |   const firstDownload = page.waitForEvent('download');
  20 |   await page.getByRole('button', { name: 'Publish signed file', exact: true }).click();
  21 |   const originalPath = await (await firstDownload).path();
  22 |   if (!originalPath) throw new Error('Missing original listing');
  23 |   const original = JSON.parse(await readFile(originalPath, 'utf8'));
  24 |   expect(original.payload.value).toEqual({ amount, currency: 'CAD' });
  25 |   const withdrawal = page.waitForEvent('download');
  26 |   await page.getByRole('button', { name: 'Unpublish', exact: true }).click();
  27 |   await withdrawal;
  28 |   await page.getByRole('button', { name: 'Edit listing', exact: true }).click();
  29 |   const remove = page.getByLabel('Remove declared value', { exact: true });
  30 |   const input = page.getByLabel('Edit declared value (minor units)', { exact: true });
  31 |   await expect(remove).not.toBeChecked();
  32 |   await input.fill('');
  33 |   await page.getByRole('button', { name: 'Save listing changes', exact: true }).click();
  34 |   await expect(page.locator('#listing-editor')).toBeVisible();
  35 |   expect(await input.evaluate(element => (element as HTMLInputElement).validity.valueMissing)).toBe(true);
  36 |   await input.fill(amount);
  37 |   await remove.check();
  38 |   await expect(input).toBeDisabled();
  39 |   await expect(input).toHaveValue(amount);
  40 |   await remove.uncheck();
  41 |   await expect(input).toBeEnabled();
  42 |   await expect(input).toHaveValue(amount);
  43 |   await remove.check();
  44 |   await page.getByRole('button', { name: 'Cancel editing', exact: true }).click();
  45 |   await page.getByRole('button', { name: 'Edit listing', exact: true }).click();
  46 |   await expect(remove).not.toBeChecked(); await expect(input).toHaveValue(amount);
  47 |   await remove.check();
  48 |   await page.getByRole('button', { name: 'Lock vault', exact: true }).click();
  49 |   await expect(page.locator('#listing-editor')).toBeEmpty();
  50 |   await page.locator('[name="passphrase"]').fill(passphrase);
  51 |   await page.getByRole('button', { name: 'Unlock', exact: true }).click();
  52 |   await page.getByRole('button', { name: 'Edit listing', exact: true }).click();
  53 |   await expect(remove).not.toBeChecked(); await expect(input).toHaveValue(amount);
  54 |   await remove.check();
  55 |   await page.getByRole('button', { name: 'Save listing changes', exact: true }).click();
  56 |   await expect(page.locator('#listing-editor')).toBeHidden();
  57 |   await expect(page.locator('#listings > article > p').filter({ hasText: 'Declared value:' })).toHaveCount(0);
  58 |   const history = page.locator('#listings > article > details').filter({ has: page.getByText('Local revision history', { exact: true }) });
  59 |   await history.getByText('Local revision history', { exact: true }).click();
  60 |   await history.getByRole('button', { name: 'Load revision history', exact: true }).click();
  61 |   await expect(history).toContainText('Material change');
  62 |   const nextDownload = page.waitForEvent('download');
  63 |   await page.getByRole('button', { name: 'Publish signed file', exact: true }).click();
  64 |   const replacementPath = await (await nextDownload).path();
  65 |   if (!replacementPath) throw new Error('Missing replacement listing');
  66 |   const replacement = JSON.parse(await readFile(replacementPath, 'utf8'));
  67 |   expect(replacement.payload.kind).toBe('giveaway');
  68 |   expect(replacement.payload).not.toHaveProperty('value');
  69 |   expect(replacement.seq).toBe(3);
  70 |   expect(original.payload.value.amount).toBe(amount);
  71 |   await page.reload();
  72 |   await page.locator('[name="vault"]').fill('optional-value');
  73 |   await page.locator('[name="passphrase"]').fill(passphrase);
  74 |   await page.getByRole('button', { name: 'Unlock', exact: true }).click();
  75 |   await expect(page.locator('#listings')).toContainText('published');
  76 |   await expect(page.locator('#listings > article > p').filter({ hasText: 'Declared value:' })).toHaveCount(0);
  77 | });
  78 | 
```