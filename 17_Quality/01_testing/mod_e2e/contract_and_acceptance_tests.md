# PS-134-09 — Contract and acceptance tests: E2E testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M04 E2E testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/e2e` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-134-09.R01** Every requirement of this module is covered by at least one automated test using the mapping in section 09.
- **PS-134-09.R02** Self-tests plant a missing label and a failing console error to prove the gate fails.
- **PS-134-09.R03** Both device projects must run every test tagged smoke; the report lists project coverage.

## Specification

See the module test table below (all processes).

**Fixtures:** Pixel 7 and iPhone 14 Playwright device descriptors on pinned Chromium; relay on random port with seeded tenant per worker, started in-process by the e2e relay entry; principals Alice (seller) and Bob (buyer), each a locally created identity with its own vault in its own browser context; time driven by Playwright page.clock from 2026-11-04T10:00:00Z in both profiles, and the relay FakeClock advanced through the in-process relay handle only for relay-side expiry in the with-relay profile; a recovery kit file for Alice; a non-author acceptance envelope signed by a third key; a recorded reports/e2e-history.json of 20 runs.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-134-09.T01 | e2e | PS-134-01.R01, PS-134-01.R02, PS-134-06.R02 | two workers run journeys in parallel | separate tenants and databases; no cross-test interference |
| TEST-PS-134-09.T02 | e2e | PS-134-01.R03, PS-134-07.R01 | force a failing test | artifacts only under test-results/, and Authorization headers are redacted in the trace |
| TEST-PS-134-09.T03 | unit | PS-134-02.R01, PS-134-02.R03 | validate Playwright config with wrong version, one project, missing Chromium path | QUALITY_E2E_CONFIG_INVALID or QUALITY_E2E_ENV_MISSING and exit 3 |
| TEST-PS-134-09.T04 | a11y | PS-134-02.R02, PS-134-09.R02 | visit a screen with an unlabeled input | QUALITY_E2E_A11Y_VIOLATION with the selector and exit 2 |
| TEST-PS-134-09.T05 | e2e | PS-134-03.R01, PS-134-03.R02 | buyer makes offer, seller accepts on a second browser context (with-relay profile, and no-relay profile with direct file transfer) | buyer and seller vaults both hold the accepted offer (same cid and revision, verified signer) and the Deal, and each UI matches its own vault; the buyer OutboxEntry is peer_accepted bound to that cid; the relay holds only ciphertext envelopes and receipts for that thread and no relay query returns offer plaintext |
| TEST-PS-134-09.T06 | e2e | PS-134-03.R03, PS-134-06.R01 | go offline, create offer, reload page, go online, seller acknowledges | one OutboxEntry with the original cid survives the reload; the seller vault applies the offer once (dedupe by cid); labels move Saved on this device, then Delivered to relay, peer has not confirmed, then Confirmed by peer and never ahead of the reached state |
| TEST-PS-134-09.T07 | unit | PS-134-04.R01, PS-134-04.R02, PS-134-04.R03 | invoke documented scripts | exit codes as documented and PWA_DIST missing yields exit 3 |
| TEST-PS-134-09.T08 | e2e | PS-134-05.R01, PS-134-05.R02 | unlock vault; select relay and obtain a relay access token via challenge-response; non-owner opens seller controls and a direct URL | token issued without any account; non-owner sees no accept control; direct URL shows the not-found screen |
| TEST-PS-134-09.T09 | abuse | PS-134-05.R03, PS-134-07.R02 | scan trace and DOM of public page for token, exact address canary | none found; public pages show max L2 location |
| TEST-PS-134-09.T10 | e2e | PS-134-06.R03 | history artifact reports/e2e-history.json where test A needed a retry in 4 of the last 20 runs and test B in 3, plus a new run where A fails on its first attempt | the run marks A flaky; the job fails with QUALITY_E2E_FLAKY naming test A only; test B passes the rule |
| TEST-PS-134-09.T11 | e2e | PS-134-07.R03 | view public listing page | no P3 value in DOM or URL |
| TEST-PS-134-09.T12 | e2e | PS-134-08.R01, PS-134-08.R03 | load home and listing on 4G profile with 4x CPU throttle, then open a listing and tap Make offer | LCP at most 2.5 s, INP at most 200 ms, CLS at most 0.1, initial JS at most 150 KiB gzip; reports/pwa-budgets.json written with commitSha and profile |
| TEST-PS-134-09.T13 | load | PS-134-08.R02 | run smoke and full suites on 2 vCPU | 90 s and 8 min budgets met |
| TEST-PS-134-09.T14 | e2e | PS-134-09.R01, PS-134-09.R03 | run suite and read report | both device projects ran every smoke test; each requirement maps to a test |
| TEST-PS-134-09.T15 | e2e | PS-134-09.R02 | plant a console error and a missing label | run fails with QUALITY_E2E_CONSOLE_ERROR and QUALITY_E2E_A11Y_VIOLATION |
| TEST-PS-134-09.T16 | a11y | PS-134-03.R03 | walk prepared, sending, transport_acknowledged, peer_accepted plus conflict, failed and expired with a screen-reader live region check | each change announced via aria-live polite with the F15.S01.M01 label; conflict uses role=alertdialog |
| TEST-PS-134-09.T17 | e2e | PS-134-10.R01, PS-134-10.R02, PS-134-10.R03 | export report, upgrade Playwright in a branch, revert | report contains no user data; versions pinned 1.63.0 and 4.14.0 after revert |
| TEST-PS-134-09.T18 | e2e | PS-134-03.R04 | block all network, create identity, publish listing locally, search, export and restore the vault | journey completes with zero network requests; status Saved on this device; QUALITY_E2E_RELAY_REQUIRED never raised |
| TEST-PS-134-09.T19 | a11y | PS-134-02.R04 | create identity, set a new passphrase, lock and unlock, restore from a recovery kit file, then scan every visited screen for wording | autocomplete new-password and current-password present, paste allowed, show/hide toggle works, kit import by file works; no sign-up, sign-in, log-in or account wording; a planted paste block fails with QUALITY_E2E_AUTH_UX_INVALID |
| TEST-PS-134-09.T20 | abuse | PS-134-05.R02 | inject a correctly signed acceptance by a non-author key into the buyer vault by direct file import | shown in the quarantine list with reason signer not authorized; the offer is never shown as accepted and no Deal appears |
| TEST-PS-134-09.T21 | abuse | PS-134-07.R04 | start the production relay build and probe the clock and seed routes; scan the relay bundle | 404 on both routes; no test hook in the bundle; a planted route fails with QUALITY_E2E_TEST_ENDPOINT_IN_PROD |

## Acceptance criteria

- The buyer and seller offer journey passes on Pixel 7 and iPhone 14 profiles.
- An offer queued offline is applied exactly once by the recipient vault after reconnect, and the UI never shows more than the reached sync state.
- No journey depends on an account, sign-up or login, and the relay is never the oracle for domain state.
- Every visited screen has zero serious or critical axe violations.
- Smoke subset finishes within 90 s and OBS-5 PWA budgets (LCP, INP, CLS, initial JS) hold and are written to reports/pwa-budgets.json.

## Dependencies

Module depends on: CTR-TST-001, CTR-UX-001, CTR-OBS-001, CTR-IDM-001, CTR-CAP-001, CTR-PRV-001, F17.S01.M01, F15.S01.M01, F15.S01.M02, F14.S01.M03, F07.S01.M01, F07.S01.M02, F07.S01.M03, F11.S01.M02, F01.S04.M01. Predecessor: [domain_schema.md](domain_schema.md).
