# F17.S01.M04 — E2E testing

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F17.S01](../SPEC.md). **Process IDs:** PS-134-01…PS-134-10. **Code:** `tests/e2e`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Browser end-to-end tests with @playwright/test 1.63.0 pinned to the preinstalled Chromium, run on Pixel 7 and iPhone 14 device profiles against the built PWA. The PWA is the product: its vault lives in IndexedDB, so the first profile runs with no relay configured and must work fully offline. A second profile adds a self-hosted relay on an in-memory SQLite database. There are no accounts or logins (ADR-0016, CTR-UX-001 UX-5): journeys create an identity locally, unlock the vault and optionally obtain a relay access token. A journey passes only when each participant's UI matches that participant's own vault and the vaults agree on the signed statements they exchanged; the relay is never the oracle. Covers core journeys, offline and reconnect behaviour along the F15.S01.M01 sync states, PWA budgets (LCP, INP, CLS, initial JS) and axe-core accessibility checks (@axe-core/playwright 4.14.0) with zero serious or critical violations.

## Responsibilities

- Provide Playwright configuration with two projects (Pixel 7, iPhone 14 viewport and user agent, both on pinned Chromium), traces on first retry, video off, 30 s test timeout and 1 retry only in CI.
- Serve the already-built PWA artifact (built once by CI) on a random free port. Run two profiles: no-relay (no relay configured, network blocked) and with-relay (a test relay started on a random port with in-memory SQLite, then selected by the user in settings); each worker has an isolated browser context and vault.
- Provide journey specs: create identity (local device-key generation) and unlock vault, restore from a recovery kit, then optionally select a relay and obtain a relay access token by challenge-response (CTR-CAP-001 CAP-10); publish listing, make and accept offer, propose barter, offline create and reconnect along the sync states, install prompt and update flow, and language switch.
- Run axe on every screen visited by a journey and fail on any serious or critical violation; record minor ones in the report.
- Prove that the PWA works offline with no relay configured: create identity, draft and publish a listing locally, search local records, export and restore the vault, all with the network blocked.

## Not responsible for

- Relay-level flows without a browser (F17.S01.M03).
- Real WebKit and Firefox engines: the browser matrix is checked by F17.S03.M03; this module runs on the pinned Chromium with device emulation only.
- Application accessibility fixes (F14).
- Future: visual regression snapshots and real-device cloud runs.

## User stories

- As a developer, I run pnpm test:e2e and watch the buyer and seller journey pass on both device profiles with a trace for any failure.
- As an accessibility lead, I see axe results per screen and the build fails on a serious violation.
- As a tester, I toggle offline in a test and verify that queued actions replay once the connection returns.

## Edge cases

- The browser goes offline mid-submit; the offer is local committed and its OutboxEntry stays prepared (Saved on this device); on reconnect it is sent with the same cid and the seller vault applies it once (dedupe by cid).
- Service worker update arrives during a test; the update-available prompt appears and the page does not reload without consent.
- Two workers use the same port; ports are allocated from the OS and recorded in the worker fixture to avoid clashes.
- A screen is correct visually but has an unlabeled input; axe reports a serious violation and the test fails with the node selector.
- Slow 4G emulation with CPU throttle 4x; the app shell still loads offline after the first visit.
- Chromium preinstalled path differs per runner; the config resolves it from PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH and fails clearly if absent.
- No relay is configured and the network is blocked; every core journey still completes and shows delivery as unknown rather than failed or sent.
- A correctly signed acceptance made by a key that is not the listing author is injected into the buyer vault; it appears in the quarantine list with its reason and the offer never shows as accepted.
- A production relay build is started; the e2e clock and seeding hooks are absent and their routes answer 404.
- A screen shows sign-up, sign-in, log-in or account wording, or blocks paste in the passphrase field; the run fails.

## UX and accessibility



Headless runner. Output is the Playwright HTML report, traces for failed tests, JUnit XML, reports/e2e-axe.json listing violations per screen and impact, and reports/pwa-budgets.json. Covered contract notes: CTR-UX-001 UX-1 and UX-5 (accessible authentication without accounts or logins, N20 and N23), CTR-OBS-001 OBS-5, CTR-IDM-001 IDM-7, CTR-CAP-001 CAP-8 and CAP-10.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

CTR-TST-001, CTR-UX-001, CTR-OBS-001, CTR-IDM-001, CTR-CAP-001, CTR-PRV-001, F17.S01.M01, F15.S01.M01, F15.S01.M02, F14.S01.M03, F07.S01.M01, F07.S01.M02, F07.S01.M03, F11.S01.M02, F01.S04.M01

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-134-01 | [Domain schema](domain_schema.md) | 3 |
| PS-134-02 | [Validation rules](validation_rules.md) | 4 |
| PS-134-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-134-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-134-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-134-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-134-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-134-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-134-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-134-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `tests/e2e/index.ts`.

## Acceptance criteria

- The buyer and seller offer journey passes on Pixel 7 and iPhone 14 profiles.
- An offer queued offline is applied exactly once by the recipient vault after reconnect, and the UI never shows more than the reached sync state.
- No journey depends on an account, sign-up or login, and the relay is never the oracle for domain state.
- Every visited screen has zero serious or critical axe violations.
- Smoke subset finishes within 90 s and OBS-5 PWA budgets (LCP, INP, CLS, initial JS) hold and are written to reports/pwa-budgets.json.
