# PS-088-09 — Contract and acceptance tests: Relay delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M01 Relay delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/delivery` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-088-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-088-09.R02** Chaos tests simulate relay outages, duplicated batches and partial batch failure.
- **PS-088-09.R03** Contract tests validate request, response, receipt and acknowledgement shapes against the registry schemas.

## Specification

See the module test table below (all processes).

**Fixtures:** Vault V1 (author), vault V2 (recipient), relays R1 and R2 (allowlisted peers), an F15.S01.M01 outbox and an F08 MailboxPort stub, fake clock 2026-11-04T10:00:00Z, fixed seeds for all keys.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-088-09.T01 | integration | PS-088-01.R01, PS-088-01.R02, PS-088-04.R01 | relay R1 accepts a public listing from a hosted device key and dispatches it to peer R2 | PeerOutbox entry prepared, then transport_acknowledged with verified receipt, then delivered; payload not copied into the entry |
| TEST-PS-088-09.T02 | unit | PS-088-02.R01, PS-088-02.R03 | enqueue with unknown cid, invalid destination, participants audience to peer_relay, public audience to a recipient mailbox | NOT_FOUND, FEDERATION_PEER_NOT_ALLOWED, FEDERATION_DESTINATION_INVALID twice |
| TEST-PS-088-09.T03 | abuse | PS-088-02.R02, PS-088-07.R01 | relay returns a forged receipt and a forged acknowledgement signed by a non-recipient | FEDERATION_RECEIPT_INVALID; state does not advance |
| TEST-PS-088-09.T04 | property | PS-088-03.R01, PS-088-03.R02 | random event sequences (receipt, outcome, failure, pause, reinstate, remove, cancel) with the clock advanced to expiresAt | states only advance along declared transitions; terminal states fixed; every entry is terminal by expiresAt |
| TEST-PS-088-09.T05 | e2e | PS-088-03.R03, PS-088-01.R03, PS-088-01.R04 | vault publishes a listing offline, reconnects, gets a receipt; sends an offer that the recipient acknowledges; sends another offer never acknowledged for 30 days | chips read Saved on this device, Queued, Relay received for the listing (never Recipient confirmed); Recipient confirmed only after the ack; Relay received, recipient not confirmed after the F15 expiry; receipt times labelled relay time |
| TEST-PS-088-09.T06 | integration | PS-088-04.R03 | author tombstone for a record delivered to R2; consent federation_publish withdrawn with entries prepared | tombstone queued to R2 only; prepared public entries cancelled and tombstones requested for delivered ones |
| TEST-PS-088-09.T07 | contract | PS-088-04.R01, PS-088-04.R02, PS-088-09.R03 | each command, the pull query, the transport adapter and the delivery.failed event | inputs, outputs, receipts and acknowledgements validate against registry schemas |
| TEST-PS-088-09.T08 | abuse | PS-088-05.R01, PS-088-05.R02, PS-088-05.R03 | other vault reads routes; peer without allowlist pulls; non-operator reads relay stats | NOT_FOUND or FEDERATION_PEER_NOT_ALLOWED or FORBIDDEN |
| TEST-PS-088-09.T09 | integration | PS-088-06.R01, PS-088-06.R02 | send the same batch twice with the same batchId; receiver replays | one set of results; the repeat answered from the Idempotency-Key store; no duplicate records |
| TEST-PS-088-09.T10 | chaos | PS-088-06.R03, PS-088-09.R02 | relay down for 2 h then back; kill process mid-batch | local record unchanged; entries retry with IDM-4 backoff; lease expires after 60 s; no loss |
| TEST-PS-088-09.T11 | integration | PS-088-03.R01, PS-088-09.R02 | batch of 100 with 3 rejected and 2 buffered | 95 delivered, 3 failed with receiver codes, 2 transport_acknowledged and delivered at expiry |
| TEST-PS-088-09.T12 | integration | PS-088-03.R02 | 6 attempts x 5 rounds exhausted | entry failed and federation.delivery.failed emitted once |
| TEST-PS-088-09.T13 | abuse | PS-088-07.R02, PS-088-07.R01 | inspect outgoing request, logs and a sealed wrapper; offer a participants statement to a relay inbox | no IP, reader or device identifiers; wrapper holds only {v, mailboxId, ciphertext, size, sentAt}; FEDERATION_DESTINATION_INVALID; relay push delay within 0-5 s |
| TEST-PS-088-09.T14 | abuse | PS-088-04.R04 | relay receives a public record from peer R2, and a hosted record while F11 is off; 5001st queued entry from one hosted vault | the peer record is never forwarded; nothing enqueued with F11 off; the 5001st RATE_LIMITED |
| TEST-PS-088-09.T15 | load | PS-088-08.R01, PS-088-08.R02 | 10 000 entries dispatched in batches of 100 across 5 destinations | batch build p95 ≤ 500 ms, metrics exported |
| TEST-PS-088-09.T16 | unit | PS-088-09.R01 | traceability tool run | every PS-088 requirement maps to a passing test |
| TEST-PS-088-09.T17 | integration | PS-088-10.R01, PS-088-10.R02, PS-088-10.R03 | relay operator export of 20 PeerOutbox entries and import into a fresh relay; vault export | non-terminal entries restored as prepared and re-sent; terminal ones kept as history; the vault export carries routes only and F15.S01.M01 exports its own entries |
| TEST-PS-088-09.T18 | integration | PS-088-03.R04 | peer suspended with 500 entries, then reinstated; another peer removed; flag F11 off then on | paused entries return to prepared on reinstate; removed peer's entries cancelled; flag on resumes flag_off entries |
| TEST-PS-088-09.T19 | integration | PS-088-02.R04 | consent federation_publish not granted for relay R; consent service unavailable; consent withdrawn between routing and dispatch | not routed (FEDERATION_NOT_OPTED_IN); DEPENDENCY_UNAVAILABLE and nothing sent; dispatch re-check stops the send |
| TEST-PS-088-09.T20 | integration | PS-088-02.R05, PS-088-04.R05 | participants statement to recipient Q; Q moves and publishes a new portable document with a new mailbox hint; Q moves with no resolvable mailbox | delivered through the MailboxPort stub, never /fed/v1/inbox; route re-resolved to the new mailbox; unresolved entries wait with FEDERATION_RECIPIENT_UNRESOLVED |
| TEST-PS-088-09.T21 | e2e | PS-088-07.R03 | user withdraws a statement already relay received | the no-recall notice is shown before the tombstone is signed and confirmed by the user |
| TEST-PS-088-09.T22 | integration | PS-088-08.R03 | oldest prepared PeerOutbox entry reaches 15 min 1 s; one peer fails 21 percent of deliveries over 15 minutes | both alerts fire |
| TEST-PS-088-09.T23 | integration | PS-088-04.R02, PS-088-04.R03 | recipient vault's ack arrives as federation.record.accepted; an ack signed by a non-recipient | federation.outbox.acknowledge records peer_accepted in F15.S01.M01; no statement signed by this module; the non-recipient ack is refused FEDERATION_RECEIPT_INVALID |
| TEST-PS-088-09.T24 | unit | PS-088-07.R04 | export, deletion and retention ports called by F10; field classification annotations | operator export section, deletion plan cancelling the principal's routes, terminal entries purged after 30 days |

## Acceptance criteria

- All tests T01–T24 pass in CI.
- The UI never shows a delivery state beyond the one recorded, and a public statement never shows 'Recipient confirmed' (e2e and unit tests).
- A relay cannot cause peer_accepted without a recipient's signature, and every PeerOutbox entry is terminal by its expiresAt (abuse and property tests).

## Dependencies

Module depends on: F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S03.M01, F11.S03.M02, F07.S02.M01, F15.S01.M01, F15.S04.M02, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-IDM-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-OBS-001, CTR-PRV-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
