# Framework demo status — 2026-10-30

Mock-only, synthetic-data framework. No product implementation, specification approval, security certification,
release or deployment is claimed. The specification gate remains NO-GO. Roadmap M2 (foundational specifications)
is still blocked on the security/source/policy evidence recorded in the root decision register.

## Integration

- Demo integration: work/classrup-haiku-framework, as designated by the previous handoff.
- This milestone preserves PR #5 continuation history and adds reproducible verification via PR #7.
- Main remains gated. Existing draft PRs #1–#6 are preserved; no duplicate-history PR is silently closed.

## Verification tooling

- Exact development dependency: @playwright/test 1.64.1 and its locked dependencies. No runtime dependencies.
- npm ci, install browser binaries, npm test, then npm run verify:browser (see README).
- Managed server on port 4173 with reuse disabled; each script has a 150-second child timeout, each case 180 seconds,
  full run 15 minutes, one worker, no retries. Failure output includes script, engine, signal and captured assertions.
- All eight existing detailed check files plus smoke run as nine journeys per browser: Chromium, Firefox, WebKit.
  Journey passes are not counts of individual assertions. Existing explicit focus SKIPs remain visible in attached output.
- Checks cover listing detail/demo messaging announcements, browse/account/saved toggles, editor validation/drafts/
  double-submit/discard, keyboard focus, narrow layouts (320/390/768/1280), contrast, and reduced motion.
- Browser-specific HTML reports and script output are retained as CI artifacts for seven days.
- The specification auditor excludes generated dependencies/reports from all source evidence and module discovery.
  Registered specifications and approval requirements are unchanged.

## Verification evidence

- Local unit suite: 33 passed; audit tooling: 16 passed; structural audit: PASS, zero errors.
- Semantic audit: NO-GO remains expected (1,450 DRAFT, 30 SPECIFIED_REVIEW_PENDING, zero APPROVED).
- First Linux CI matrix: all three browser jobs and audit passed:
  https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/41165843722
- Updated-source CI and final integration evidence are recorded in the dated post-merge handoff linked from HANDOFF.md.
- Local Chromium: eight detailed journey files passed. Smoke exposed an ambiguous pagination locator (navigation and
  live region contained identical text); the assertion now scopes to the visible pagination navigation.
- Local Windows Firefox: isolated launch timed out before a page was opened. Linux Firefox CI passed; Windows Firefox
  compatibility is not certified by that result. Browser binaries installed locally are not committed.
- Independent review identified an unfiltered module discovery path; fixed with a failing-then-passing regression.
  Review disposition: no remaining findings, conditional on verification. Follow-up changes remain test tooling only.

## Remaining limits and next work

- Real assistive-technology testing remains unperformed: editor summary announcements, barter region naming and browse focus.
  DOM/keyboard checks do not certify screen-reader speech behavior.
- This is Linux engine coverage, not real iOS/Safari/Android device certification or broad WCAG compliance.
- No service worker/offline product behavior, auth, real messaging, matching, consent, settlement, payments or federation.
- Submitted listings are memory-only; saved listings/drafts use browser storage; account and barter are fixtures.
- English only. No maximum price was selected. Existing Infinity-to-page-1 pagination behavior is unchanged.
- Follow ROADMAP.md M2 and DECISIONS.md: obtain actual reviewed D01/D07/D10/D11 security protocol evidence,
  D05 region taxonomy, D14 omitted source descriptions and D15 owner policy/jurisdiction input. Complete dependency-ready
  foundational contracts and source-bound independent reviews without inventing approvals. Main needs evidence-backed GO.

Use app/HANDOFF.md for historical checkpoints and the latest dated continuation handoff.
