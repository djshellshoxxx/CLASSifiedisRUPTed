# PS-088-09 — Contract and acceptance tests: Relay delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M01 Relay delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/delivery` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-088-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-088-09.R02** Chaos tests simulate relay outages, duplicated batches and partial batch failure.
- **PS-088-09.R03** Contract tests validate request, response, receipt and acknowledgement shapes against the registry schemas.

## Specification

See the module test table below (all processes).

**Fixtures:** Vault V1 (author), vault V2 (recipient), relays R1 and R2 (allowlisted peers), fake clock 2026-11-04T10:00:00Z, fixed seeds for all keys.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-088-09.T01 | integration | PS-088-01.R01, PS-088-01.R02, PS-088-04.R01 | enqueue a committed listing statement for R1 and dispatch | entry prepared then transport_acknowledged with verified receipt; payload not copied into the entry |
| TEST-PS-088-09.T02 | unit | PS-088-02.R01, PS-088-02.R03 | enqueue with unknown cid, invalid destination, participants audience to peer_relay | NOT_FOUND, FEDERATION_PEER_NOT_ALLOWED, FEDERATION_DESTINATION_INVALID |
| TEST-PS-088-09.T03 | abuse | PS-088-02.R02, PS-088-03.R01, PS-088-07.R01 | relay returns a forged receipt and a forged peer ack | FEDERATION_RECEIPT_INVALID; state does not advance |
| TEST-PS-088-09.T04 | property | PS-088-03.R01, PS-088-03.R02 | random event sequences (receipt, ack, failure, pause, cancel) | states only advance along declared transitions; terminal states fixed; peer_accepted always has peerAck |
| TEST-PS-088-09.T05 | e2e | PS-088-03.R03, PS-088-01.R03 | publish offline, reconnect, receipt, recipient ack | UI wording progresses Saved on this device, Queued, Relay received, Recipient confirmed and never skips ahead |
| TEST-PS-088-09.T06 | integration | PS-088-04.R02, PS-088-04.R03 | tombstone for a delivered record; account moved; consent withdrawn | tombstone queued to every destination that received the record; entries redirected; prepared entries cancelled |
| TEST-PS-088-09.T07 | contract | PS-088-04.R01, PS-088-04.R02, PS-088-09.R02 | each command and the pull query | inputs, outputs and the delivery.failed event validate against registry schemas |
| TEST-PS-088-09.T08 | abuse | PS-088-05.R01, PS-088-05.R02, PS-088-05.R03 | other vault reads queue; peer without allowlist pulls; non-operator reads relay stats | NOT_FOUND or FEDERATION_PEER_NOT_ALLOWED or FORBIDDEN |
| TEST-PS-088-09.T09 | integration | PS-088-06.R01, PS-088-06.R02 | send the same batch twice with the same batchId; receiver replays | one set of results; no duplicate records |
| TEST-PS-088-09.T10 | chaos | PS-088-06.R03, PS-088-08.R03 | relay down for 2 h then back; kill app mid-batch | local record unchanged; entries retry with IDM-4 backoff; lease expires after 60 s; no loss |
| TEST-PS-088-09.T11 | integration | PS-088-06.R03, PS-088-03.R01 | batch of 100 with 3 rejected and 2 buffered | 95 advance, 3 failed with receiver codes, 2 stay prepared with 30 min recheck |
| TEST-PS-088-09.T12 | integration | PS-088-03.R01, PS-088-06.R03 | 6 attempts x 5 rounds exhausted | entry failed and federation.delivery.failed emitted once |
| TEST-PS-088-09.T13 | abuse | PS-088-07.R01, PS-088-07.R02 | inspect outgoing request and logs for IP, reader or device identifiers; participants audience to public peer | none present; refused by V03; relay push delay within 0-5 s |
| TEST-PS-088-09.T14 | abuse | PS-088-07.R03, PS-088-07.R01 | 1001 queued entries to one destination | 1001st RATE_LIMITED |
| TEST-PS-088-09.T15 | load | PS-088-08.R01, PS-088-08.R02 | 10 000 entries dispatched in batches of 100 across 5 destinations | batch build p95 ≤ 500 ms, metrics exported, alert at 15 min age |
| TEST-PS-088-09.T16 | unit | PS-088-09.R01, PS-088-09.R03 | traceability tool run | every PS-088 requirement maps to a passing test |
| TEST-PS-088-09.T17 | integration | PS-088-10.R01, PS-088-10.R02, PS-088-10.R03 | export vault with 20 queued entries, import into fresh vault | non-terminal entries restored as prepared and re-sent; terminal ones kept as history |

## Acceptance criteria

- All tests T01–T17 pass in CI.
- The UI never shows a delivery state beyond the one recorded (e2e and unit tests).
- A relay cannot cause peer_accepted without the recipient's signature (abuse test).

## Dependencies

Module depends on: F11.S01.M02, F11.S01.M03, F11.S03.M01, F11.S03.M02, F07.S02.M01, F15.S01.M01, F15.S04.M02, CTR-FED-001, CTR-IDM-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-OBS-001, CTR-PRV-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
