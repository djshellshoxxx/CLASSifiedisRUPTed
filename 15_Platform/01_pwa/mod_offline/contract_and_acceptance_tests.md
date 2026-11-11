# PS-116-09 — Contract and acceptance tests: Offline outbox

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M01 Offline outbox](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/offline` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-116-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-116-09.R02** Logic is tested with fake-indexeddb through the F15.S02.M03 IndexedDB adapter, and the Web Locks, reconnect and UI flows with a real browser (Playwright, offline emulation).
- **PS-116-09.R03** Conformance with CTR-IDM-001 IDM-1, IDM-4, IDM-5 and IDM-7 is tested with a stub relay that injects network failures, 429 and 409 responses, signed relay receipts, key rotations, restore announcements and peer acknowledgements.

## Specification

See the module test table below (all processes).

**Fixtures:** fake-indexeddb 6.x with the F15.S02.M03 IndexedDB adapter; stub relay implementing Idempotency-Key replay (24 h), cid dedupe, classrup.platform.relay_receipt/v1 signing with keys k1 (retired), k2 (active), k3 (revoked), restore announcements and equivocating rotations; fixed clock 2026-11-04T10:00:00Z; principals P1 and P2 with Ed25519 keys; counterparties C1 and C2 (same cycle); statements offer/v1 (P2, acknowledger counterparty) and listing/v1 (P0, acknowledger destination_relay); relay commands index.put (deterministic_id) and profile.update (expected_revision).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-116-09.T01 | unit | PS-116-01.R01, PS-116-01.R03, PS-116-02.R01 | enqueue a locally signed listing statement for relay:r1 and a relay command with expectedRevision 4 inside a domain transaction | entries stored in state prepared, attempts 0, seq 1 and 2, cid set, acknowledger and privacyClass from the registry, expiresAt = createdAt + 7 d |
| TEST-PS-116-09.T02 | unit | PS-116-02.R01, PS-116-01.R03 | enqueue violating V01, V02, V03, V04, V05 in turn | each returns its documented code, nothing is stored and the enclosing domain record rolls back |
| TEST-PS-116-09.T03 | property | PS-116-03.R01, PS-116-01.R02 | random sequences of delivery results, acknowledgements, restore announcements and user actions on one entry | only declared transitions occur, terminal states never change, seq stays strictly increasing, expiresAt never exceeds createdAt + 30 d |
| TEST-PS-116-09.T04 | integration | PS-116-03.R02, PS-116-06.R01, PS-116-06.R03 | kill the tab after send and before receipt, restart within 1 h | entry resent with same cid or Idempotency-Key, stub relay applies once, entry ends transport_acknowledged |
| TEST-PS-116-09.T05 | integration | PS-116-03.R02, PS-116-02.R03 | relay receipt arrives, then an acknowledgement signed by a non-counterparty key, then the real one | forged ack rejected with PLATFORM_OUTBOX_ACK_MISMATCH; entry stays transport_acknowledged until the real ack gives peer_accepted |
| TEST-PS-116-09.T06 | integration | PS-116-03.R03, PS-116-02.R02 | entry 3 gets 409 CONFLICT_REVISION; entries 4 (same aggregate) and 5 (other aggregate) queued | 3 becomes conflict, 4 waits, 5 is sent; nothing merged |
| TEST-PS-116-09.T07 | integration | PS-116-06.R02, PS-116-02.R02 | stub relay returns network error, 429 retryAfterMs 3000, then 200 | delays follow full-jitter bounds, wait at least 3000 ms, delivered on third attempt; after 6 failures entry is failed with failureReason retry_exhausted |
| TEST-PS-116-09.T08 | unit | PS-116-04.R01, PS-116-04.R02 | all commands and queries called | contract of input/output holds, no domain event is produced and no network call is made by local-only commands |
| TEST-PS-116-09.T09 | contract | PS-116-04.R03, PS-116-02.R02 | stub returns an unknown error code with status 409 retryable false | classified as failed without code changes and shown with messageKey |
| TEST-PS-116-09.T10 | abuse | PS-116-05.R01, PS-116-07.R03 | principal P2 unlocks a vault profile holding P1 entries | list and delivery return none of P1's entries; P1 entries keep their state |
| TEST-PS-116-09.T11 | integration | PS-116-05.R02, PS-116-05.R03 | relay revokes access then answers 401 and 403; token store inspected | delivery obtains a fresh token per send via challenge-response; FORBIDDEN marks entry failed with failureReason relay_rejected; no token or private key in IndexedDB |
| TEST-PS-116-09.T12 | integration | PS-116-07.R02 | clock advanced 6 d, 7 d, then a transport_acknowledged entry advanced to createdAt + 30 d | day-6 prompt; unsent entry expired at 7 d and never sent; unconfirmed entry expired at createdAt + 30 d with its payload erased |
| TEST-PS-116-09.T13 | abuse | PS-116-08.R01, PS-116-07.R03 | inspect network traffic and script injection under CSP during a full session | no telemetry request; inline script blocked; diagnostics stay in the vault and are exportable |
| TEST-PS-116-09.T14 | e2e | PS-116-06.R03 | two tabs open, device offline, three actions queued, device reconnects, relay then stopped | exactly one tab delivers, order preserved, UI shows Reached relay for delivered entries and unknown for the rest, local data intact |
| TEST-PS-116-09.T15 | a11y | PS-116-03.R02 | outbox sheet, conflict dialog and storage panel scanned with axe | zero serious or critical issues; aria-live announces state changes with the documented accessible names; targets ≥ 44 px |
| TEST-PS-116-09.T16 | integration | PS-116-04.R01, PS-116-03.R03 | two vaults send conflicting acceptances for one reservation; receiving module reports the fork | entry becomes conflict, affected coordination frozen, no winner chosen |
| TEST-PS-116-09.T17 | load | PS-116-08.R02, PS-116-08.R03 | enqueue 200 entries then deliver against stub with 300 ms latency | enqueue p95 ≤ 30 ms, longest main-thread task ≤ 50 ms, total ≤ 60 s |
| TEST-PS-116-09.T18 | unit | PS-116-09.R01 | traceability tool run | every PS-116 requirement maps to a passing test |
| TEST-PS-116-09.T19 | contract | PS-116-09.R03, PS-116-06.R02 | IDM-1/IDM-4/IDM-5/IDM-7 conformance suite against the stub relay | all assertions pass including resend inside the 24 h window and the 23 h replay-safety rule |
| TEST-PS-116-09.T20 | integration | PS-116-09.R02, PS-116-10.R01, PS-116-10.R02, PS-116-10.R03 | upgrade the F15.S02.M03 schema with entries present; export vault; erase vault | entries preserved on upgrade; export section platform.outbox has counts and no payloads; erase removes them; suite identical on fake-indexeddb, Chromium, WebKit, Firefox |
| TEST-PS-116-09.T21 | integration | PS-116-04.R07, PS-116-08.R01 | storage status with persist() denied and last export 8 days ago; then persisted with last export 31 days ago; usage 85 percent and a missing storageMarker | threshold 7 and exportOverdue true; threshold 30 and exportOverdue true; evictionRisk true; data-loss warning with restore action; no entries fabricated |
| TEST-PS-116-09.T22 | integration | PS-116-01.R02, PS-116-01.R03, PS-116-07.R02 | entry reaches peer_accepted; another expires; clock advanced 60 s, 24 h and 31 d; every command tried on a stored payload | peer_accepted row deleted after 60 s; expired payload erased at expiry and stub deleted after 24 h; no row older than createdAt + 30 d + 24 h and no payload older than createdAt + 30 d; payload and cid never changed |
| TEST-PS-116-09.T23 | abuse | PS-116-02.R03, PS-116-03.R04 | after a rebase of entry E (old cid A, new cid B) C1 replays its ack over A for the new entry; C2 (same cycle) signs an ack over B; C1 signs over B with a key revoked before verification | all three rejected with PLATFORM_OUTBOX_ACK_MISMATCH; only C1's ack over B with an active key gives peer_accepted |
| TEST-PS-116-09.T24 | abuse | PS-116-02.R04, PS-116-07.R01 | enqueue a plaintext P2 offer for a relay mailbox, an E2E envelope whose recipients differ from the seller's mailbox keys, a statement with a P3 address field, and a correct E2E envelope | PLATFORM_OUTBOX_NOT_DELIVERABLE, PLATFORM_OUTBOX_NOT_DELIVERABLE, PLATFORM_OUTBOX_CLASS_FORBIDDEN, nothing stored for those; the correct envelope is stored |
| TEST-PS-116-09.T25 | integration | PS-116-02.R05, PS-116-06.R01 | relay command without expectedRevision first attempted, failed, retried by the user at 25 h; same with expectedRevision; same with deterministic resourceId; registration of a relay command without replay safety | first moves to conflict with unsafe_replay and the may-already-have-been-applied prompt; second and third are resent once; registration refused with PLATFORM_OUTBOX_NOT_DELIVERABLE |
| TEST-PS-116-09.T26 | integration | PS-116-03.R02 | direct:<did> entry exported as QR, then file; acknowledgement arrives while prepared; separately an ack arrives while a relay entry is sending | exportedAt set, state stays prepared, delivery loop never sends it; both acks give peer_accepted without a receipt |
| TEST-PS-116-09.T27 | integration | PS-116-03.R02, PS-116-04.R05 | publication with acknowledger destination_relay: receipt, then relay-signed index acceptance; second publication refused by the relay with a signed reason | first ends peer_accepted; second ends failed with failureReason relay_rejected and the reason cid that F01.S01.M03 shows as relay_rejected |
| TEST-PS-116-09.T28 | integration | PS-116-03.R04, PS-116-01.R03 | rebase a conflict entry and reroute a prepared entry to relay r2 | old entries discarded with reasons superseded and rerouted; new entries have new id and seq (new cid for the rebase, same cid for the reroute) and passed V04, V05, V10, V11 |
| TEST-PS-116-09.T29 | integration | PS-116-03.R05, PS-116-06.R04 | stub relay restores a backup and publishes a signed restore announcement covering receipt seq above 88000; another announcement is signed by an unknown key | covered transport_acknowledged entries return to prepared and are resent once with the same cid or Idempotency-Key; the unsigned announcement is ignored with PLATFORM_OUTBOX_RECEIPT_INVALID |
| TEST-PS-116-09.T30 | integration | PS-116-01.R04, PS-116-02.R01 | domain command whose enqueue fails V03 and one where IndexedDB aborts the transaction | neither the domain record nor the entry exists; PLATFORM_OUTBOX_FULL and PLATFORM_OUTBOX_STORAGE_UNAVAILABLE returned; no separate outbox database exists |
| TEST-PS-116-09.T31 | contract | PS-116-02.R02, PS-116-02.R06, PS-116-04.R04 | receipt for mailbox A presented for an entry to mailbox B; receipt with a wrong digest; receipt by retired key k1; receipt by k3 stored before and after its revocation; key history with two rotations from the same prevKeyId | wrong mailbox and wrong digest rejected with PLATFORM_OUTBOX_RECEIPT_INVALID; k1 verifies; k3 accepted only when stored before revokedAt; equivocation freezes the relay with PLATFORM_OUTBOX_RELAY_FROZEN |
| TEST-PS-116-09.T32 | integration | PS-116-07.R04, PS-116-04.R06 | export section, deletion plan and retention purge through the F10 ports, then privacy.deletion.completed for P1 | section platform.outbox lists counts only with field classes; deletion plan lists P1's entries and execution removes them; purge applies the retention rules; no P1 row remains |
| TEST-PS-116-09.T33 | unit | PS-116-02.R01, PS-116-04.R06 | LocalSettings.localLimits.maxOutboxEntries set to 50 and 50 entries queued | the 51st enqueue returns PLATFORM_OUTBOX_FULL and its domain record rolls back |

## Acceptance criteria

- All tests T01-T33 pass in CI on Chromium, WebKit and Firefox profiles.
- A statement queued offline is delivered at most once per destination after reconnect, in creation order, regardless of tab crashes or duplicate deliveries inside the relay's idempotency window, and a late relay command is never blindly re-applied.
- A conflicting queued action is never applied without the user's explicit choice, relay receipts are never presented as peer acceptance, and an acknowledgement counts only for the exact cid it signs.
- No P2 plaintext is ever queued for a relay and no P3/P4 data is ever queued.
- Storage status shows persistence, quota and a warning after 30 days without export (7 days without persistence); no queued data remains after the vault is erased.

## Dependencies

Module depends on: F15.S02.M02, F15.S02.M03, F15.S02.M01, F15.S04.M03, F11.S01.M01, F10.S02.M02, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-PRV-001, CTR-UX-001, CTR-OBS-001, CTR-CAP-001, CTR-FED-001, CTR-IOX-001, CTR-EVT-001. Predecessor: [domain_schema.md](domain_schema.md).
