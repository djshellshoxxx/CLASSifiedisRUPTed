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
  - barter: the trade-offers table sits in a focusable, named scroll region (keyboard reachable).
  - browse: focus stays on Save or Unsave after a toggle; Clear filters moves focus to the results region.
  - checks: layout check has no trivially true PASS lines (routes without a button check their first link in main, or SKIP with a reason); account check records console errors and warnings.
  - announcements: removal messages include the listing title on the account, browse, saved and detail pages.

## Verification (Chromium only, via Playwright)

- `npm test`: 31 unit tests pass (baseline 18).
- `npm run check:browser`: 5 check files pass (editor, account-browse, layout, barter, browse-focus).
- `npm run smoke`: 26 checks pass.
- Each wave's diffs were reviewed by a separate Haiku reviewer. Coordinator edits after review (guarded barter check
  (f); detail.js removal wording) were not re-reviewed; detail.js wording is covered by code reading only.
- The new checks were run against the defective code and fail there (editor middle-click and link focus; the
  placeholder contrast check fails without the CSS rule; account and browse focus checks fail on the baseline).

## Known gaps and open decisions

- Not implemented on purpose: localization (English only), service worker or offline behaviour, real authentication,
  real messaging, matching or settlement of barter (the barter page is read-only fixtures).
- Money: no maximum price was added. Choosing a cap is a product decision.
- Pagination: a fractional page is floored (2.7 becomes page 2), and a non-finite page becomes page 1.
- Barter: the outer section and the new scroll region both have the accessible name 'Trade offers', so screen
  readers may announce it twice. Fix by making the outer element a plain div (not verified with a screen reader).
- Browse: the fallback that focuses the results region when a saved listing leaves the page is code-only; the UI
  cannot reach it today.
- Saved page with items: the populated Unsave buttons are covered only by account-browse, not by layout.mjs.
- Summary focus after a failed submit has not been checked for a visible focus ring or for double announcements
  with screen readers.
- Only Chromium was run. Firefox and WebKit were not run.

## Restart handoff

1. `git log --oneline 52bed39..work/classrup-haiku-framework` shows the batch.
2. Run `npm test`, `npm start` on a free port, then `BASE=http://localhost:<port>/ npm run check:browser` and `BASE=... npm run smoke`.
3. Next candidate work: a Firefox or WebKit run (browsers not installed in this environment); the outer barter section
   naming fix; a checked decision on the Infinity page behaviour (it now returns page 1); a screen-reader pass on
   the editor summary focus.
