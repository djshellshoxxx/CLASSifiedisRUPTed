# PS-134-09 — Contract and acceptance tests: E2E testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M04 E2E testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/e2e` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-134-09.R01** Every requirement of this module is covered by at least one automated test using the mapping in section 09.
- **PS-134-09.R02** Self-tests plant a missing label and a failing console error to prove the gate fails.
- **PS-134-09.R03** Both device projects must run every test tagged smoke; the report lists project coverage.

## Specification

See the module test table below (all processes).

**Fixtures:** Pixel 7 and iPhone 14 Playwright device descriptors on pinned Chromium; relay on random port with seeded tenant per worker; accounts Alice (seller) and Bob (buyer); FakeClock offset via test-only clock endpoint 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-134-09.T01 | e2e | PS-134-01.R01, PS-134-01.R02, PS-134-06.R02 | two workers run journeys in parallel | separate tenants and databases; no cross-test interference |
| TEST-PS-134-09.T02 | e2e | PS-134-01.R03, PS-134-07.R01 | force a failing test | artifacts only under test-results/, and Authorization headers are redacted in the trace |
| TEST-PS-134-09.T03 | unit | PS-134-02.R01, PS-134-02.R03 | validate Playwright config with wrong version, one project, missing Chromium path | QUALITY_E2E_CONFIG_INVALID or QUALITY_E2E_ENV_MISSING and exit 3 |
| TEST-PS-134-09.T04 | a11y | PS-134-02.R02, PS-134-09.R02 | visit a screen with an unlabeled input | QUALITY_E2E_A11Y_VIOLATION with the selector and exit 2 |
| TEST-PS-134-09.T05 | e2e | PS-134-03.R01, PS-134-03.R02 | buyer makes offer, seller accepts on a second context | UI and relay state agree on accepted |
| TEST-PS-134-09.T06 | e2e | PS-134-03.R03, PS-134-06.R01 | go offline, create offer, reload page, go online | pending shown, then replayed once with the same Idempotency-Key; no duplicate |
| TEST-PS-134-09.T07 | unit | PS-134-04.R01, PS-134-04.R02, PS-134-04.R03 | invoke documented scripts | exit codes as documented and PWA_DIST missing yields exit 3 |
| TEST-PS-134-09.T08 | e2e | PS-134-05.R01, PS-134-05.R02 | login via challenge-response; non-owner opens seller controls and direct URL | no accept control; not-found screen shown |
| TEST-PS-134-09.T09 | abuse | PS-134-05.R03, PS-134-07.R02 | scan trace and DOM of public page for token, exact address canary | none found; public pages show max L2 location |
| TEST-PS-134-09.T10 | e2e | PS-134-06.R03 | run the same flaky test repeatedly with an injected failure on first attempt | reported as flaky; job fails after 3 retried tests in 20 runs |
| TEST-PS-134-09.T11 | e2e | PS-134-07.R03 | view public listing page | no P3 value in DOM or URL |
| TEST-PS-134-09.T12 | e2e | PS-134-08.R01, PS-134-08.R03 | load home and listing on 4G profile with 4x CPU throttle | LCP at most 2.5 s, CLS at most 0.1, initial JS at most 150 KiB gzip |
| TEST-PS-134-09.T13 | load | PS-134-08.R02 | run smoke and full suites on 2 vCPU | 90 s and 8 min budgets met |
| TEST-PS-134-09.T14 | e2e | PS-134-09.R01, PS-134-09.R03 | run suite and read report | both device projects ran every smoke test; each requirement maps to a test |
| TEST-PS-134-09.T15 | e2e | PS-134-09.R02 | plant a console error and a missing label | run fails with QUALITY_E2E_CONSOLE_ERROR and QUALITY_E2E_A11Y_VIOLATION |
| TEST-PS-134-09.T16 | a11y | PS-134-03.R03 | walk offline states with a screen-reader live region check | status changes announced via aria-live polite |
| TEST-PS-134-09.T17 | e2e | PS-134-10.R01, PS-134-10.R02, PS-134-10.R03 | export report, upgrade Playwright in a branch, revert | report contains no user data; versions pinned 1.63.0 and 4.14.0 after revert |
| TEST-PS-134-09.T18 | e2e | PS-134-03.R04 | block all network, create identity, publish listing locally, search, export and restore the vault | journey completes with zero network requests; status local committed; QUALITY_E2E_RELAY_REQUIRED never raised |

## Acceptance criteria

- The buyer and seller offer journey passes on Pixel 7 and iPhone 14 profiles.
- An action queued offline is delivered exactly once after reconnect.
- Every visited screen has zero serious or critical axe violations.
- Smoke subset finishes within 90 s and OBS-5 PWA budgets hold.

## Dependencies

Module depends on: CTR-TST-001, CTR-UX-001, CTR-OBS-001, CTR-IDM-001, F17.S01.M01, F15.S01.M01, F15.S01.M02, F14.S01.M03. Predecessor: [domain_schema.md](domain_schema.md).
