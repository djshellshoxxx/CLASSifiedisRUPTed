# Framework demo status (app/)

Scope: mock-backed, synthetic-data demo only. It is not a product implementation of the specifications in this
repository, and no security, privacy or production readiness is claimed. The repository's specification gate is
not passed (see the root README).

## Baseline and integration

- Baseline: PR #3 head `52bed39dda52c680a4299e20aaefe0f4695b2d58` (`feat(app): mock-backed ClassRup framework demo`).
- Integration branch: `work/classrup-haiku-framework`, based on that baseline. Commits after the baseline:
  - test harness: `npm run check:browser` runs every `scripts/checks/*.mjs` file.
  - domain and money: exact integers for unsafe amounts (rejected); non-finite or fractional pages handled in pagination.
  - editor: error-summary links focus their field; their href is `#/sell/<field>`, so a new tab lands on the sell page.
  - account and browse: the account page Save buttons toggle saved state; paging moves focus to the results region.
  - styles: responsive overflow, 24px touch-target minimum, and placeholder and dark-mode contrast fixes.

## Verification (Chromium only, via Playwright)

- `npm test`: 31 unit tests pass (baseline 18).
- `npm run check:browser`: 3 check files pass (editor, account-browse, layout).
- `npm run smoke`: 26 checks pass.
- The new checks were run against the defective code and fail there (editor middle-click and link focus; the
  placeholder contrast check fails without the CSS rule; account and browse focus checks fail on the baseline).

## Known gaps and open decisions

- Not implemented on purpose: localization (English only), service worker or offline behaviour, real authentication,
  real messaging, matching or settlement of barter (the barter page is read-only fixtures).
- Money: no maximum price was added. Choosing a cap is a product decision.
- Pagination: a fractional page is floored (2.7 becomes page 2), and a non-finite page becomes page 1.
- Focus: pressing Save on a browse card and pressing Clear filters still leave focus on the body (pre-existing).
- Barter: the wide table scrolls, but keyboard reach to the scroller depends on the browser. A markup change
  (tabindex on a wrapper) is needed for a guaranteed keyboard path; `barter.js` was out of scope for this batch.
- Summary focus after a failed submit has not been checked for a visible focus ring or for double announcements
  with screen readers.
- Only Chromium was run. Firefox and WebKit were not run.
- `layout.mjs` prints PASS for routes without buttons ("nothing to check"); that is a trivially true pass.
- Announcement wording differs between the saved and account pages ("Listing removed from saved." versus a title suffix).

## Restart handoff

1. `git log --oneline 52bed39..work/classrup-haiku-framework` shows the batch.
2. Run `npm test`, `npm start` on a free port, then `BASE=http://localhost:<port>/ npm run check:browser` and `BASE=... npm run smoke`.
3. Next candidate work, in order: barter keyboard markup fix; the save-on-browse focus fix; a Firefox or WebKit run;
   a checked decision on the Infinity page behaviour (it now returns page 1).
