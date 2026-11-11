# PS-116-09 — Contract and acceptance tests: Offline outbox

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M01 Offline outbox](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/offline` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-116-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-116-09.R02** Logic is tested with fake-indexeddb, and the Web Locks, reconnect and UI flows with a real browser (Playwright, offline emulation).
- **PS-116-09.R03** Conformance with CTR-IDM-001 IDM-1, IDM-4, IDM-5 and IDM-7 is tested with a stub relay that injects network failures, 429 and 409 responses, relay receipts and peer acknowledgements.

## Specification

See the module test table below (all processes).

**Fixtures:** fake-indexeddb 6.x database classrup-outbox; stub relay implementing Idempotency-Key replay, cid dedupe and signed receipts; fixed clock 2026-11-04T10:00:00Z; principals P1 and P2 with Ed25519 keys; statement offer_statement and relay command index.put.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-116-09.T01 | unit | PS-116-01.R01, PS-116-01.R03, PS-116-02.R01 | enqueue a locally signed offer statement for relay:r1 and a relay command with expectedRevision 4 | entries stored in state prepared, attempts 0, seq 1 and 2, cid set, expiresAt = createdAt + 7 d |
| TEST-PS-116-09.T02 | unit | PS-116-02.R01, PS-116-01.R03 | enqueue violating V01, V02, V03, V04, V05 in turn | each returns its documented code and nothing is stored |
| TEST-PS-116-09.T03 | property | PS-116-03.R01, PS-116-01.R02 | random sequences of delivery results, acknowledgements and user actions on one entry | only declared transitions occur, terminal states never change, seq stays strictly increasing |
| TEST-PS-116-09.T04 | integration | PS-116-03.R02, PS-116-06.R01, PS-116-06.R03 | kill the tab after send and before receipt, restart | entry resent with same cid or Idempotency-Key, stub relay applies once, entry ends transport_acknowledged or completed |
| TEST-PS-116-09.T05 | integration | PS-116-03.R02, PS-116-02.R03 | relay receipt arrives, then a forged acknowledgement signed by a non-counterparty key, then the real one | forged ack rejected with PLATFORM_OUTBOX_ACK_MISMATCH; entry stays transport_acknowledged until the real ack gives peer_accepted |
| TEST-PS-116-09.T06 | integration | PS-116-03.R03, PS-116-02.R02 | entry 3 gets 409 CONFLICT_REVISION; entries 4 (same aggregate) and 5 (other aggregate) queued | 3 becomes conflict, 4 waits, 5 is sent; nothing merged |
| TEST-PS-116-09.T07 | integration | PS-116-06.R02, PS-116-02.R02 | stub relay returns network error, 429 retryAfterMs 3000, then 200 | delays follow full-jitter bounds, wait at least 3000 ms, delivered on third attempt; after 6 failures entry is failed |
| TEST-PS-116-09.T08 | unit | PS-116-04.R01, PS-116-04.R02 | all commands and queries called | contract of input/output holds, no domain event is produced and no network call is made by local-only commands |
| TEST-PS-116-09.T09 | contract | PS-116-04.R03, PS-116-02.R02 | stub returns an unknown error code with status 409 retryable false | classified as failed without code changes and shown with messageKey |
| TEST-PS-116-09.T10 | abuse | PS-116-05.R01, PS-116-07.R03 | principal P2 unlocks a vault profile holding P1 entries | list and delivery return none of P1's entries; P1 entries keep their state |
| TEST-PS-116-09.T11 | integration | PS-116-05.R02, PS-116-05.R03 | relay revokes access then answers 401 and 403; token store inspected | delivery obtains a fresh token per send via challenge-response; FORBIDDEN marks entry failed; no token or private key in IndexedDB |
| TEST-PS-116-09.T12 | integration | PS-116-07.R01, PS-116-07.R02 | clock advanced 6 d, 7 d, then a transport_acknowledged entry advanced 30 d | day-6 prompt; unsent entry expired at 7 d and never sent; unconfirmed entry expired at 30 d |
| TEST-PS-116-09.T13 | abuse | PS-116-07.R01, PS-116-07.R03 | inspect network traffic and script injection under CSP during a full session | no telemetry request; inline script blocked; P3/P4 fields rejected at enqueue |
| TEST-PS-116-09.T14 | e2e | PS-116-03.R03, PS-116-06.R03 | two tabs open, device offline, three actions queued, device reconnects, relay then stopped | exactly one tab delivers, order preserved, UI shows Reached relay for delivered entries and unknown for the rest, local data intact |
| TEST-PS-116-09.T15 | a11y | PS-116-08.R01 | outbox sheet, conflict dialog and storage panel scanned with axe | zero serious or critical issues; aria-live announces state changes; targets ≥ 44 px |
| TEST-PS-116-09.T16 | integration | PS-116-04.R01, PS-116-07.R03, PS-116-03.R03 | two vaults send conflicting acceptances for one reservation; receiving module reports the fork | entry becomes conflict, affected coordination frozen, no winner chosen |
| TEST-PS-116-09.T17 | load | PS-116-08.R02, PS-116-08.R03 | enqueue 200 entries then deliver against stub with 300 ms latency | enqueue p95 ≤ 30 ms, longest main-thread task ≤ 50 ms, total ≤ 60 s |
| TEST-PS-116-09.T18 | unit | PS-116-09.R01 | traceability tool run | every PS-116 requirement maps to a passing test |
| TEST-PS-116-09.T19 | contract | PS-116-09.R03, PS-116-06.R02 | IDM-1/IDM-4/IDM-5/IDM-7 conformance suite against the stub relay | all assertions pass including 24 h old sending entry check |
| TEST-PS-116-09.T20 | integration | PS-116-09.R02, PS-116-10.R01, PS-116-10.R02, PS-116-10.R03 | upgrade database version 1 to 2 with entries; export vault; erase vault | entries preserved on upgrade; export bundle has no outbox section; erase removes them; suite identical on fake-indexeddb, Chromium, WebKit, Firefox |
| TEST-PS-116-09.T21 | integration | PS-116-01.R02, PS-116-08.R01 | storage status with persist() denied, usage 85 percent, last export 31 days ago, and a missing storageMarker | evictionRisk true, exportOverdue true, data-loss warning shown with restore action, no entries fabricated |

## Acceptance criteria

- All tests T01-T21 pass in CI on Chromium, WebKit and Firefox profiles.
- A statement queued offline is delivered at most once per destination after reconnect, in creation order, regardless of tab crashes or duplicate deliveries, and the UI shows only the state actually reached.
- A conflicting queued action is never applied without the user's explicit choice, and relay receipts are never presented as peer acceptance.
- Storage status shows persistence, quota and a warning after 30 days without export; no queued data remains after the vault is erased.

## Dependencies

Module depends on: F15.S02.M02, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-PRV-001, CTR-UX-001, CTR-OBS-001, CTR-CAP-001, CTR-FED-001, CTR-IOX-001, CTR-EVT-001. Predecessor: [domain_schema.md](domain_schema.md).
