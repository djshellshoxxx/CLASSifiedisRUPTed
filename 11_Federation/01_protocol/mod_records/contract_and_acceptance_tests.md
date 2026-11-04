# PS-084-09 — Contract and acceptance tests: Federated records

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M02 Federated records](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/records` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-084-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-084-09.R02** An adversarial suite covers forged provenance, replay, flood, fork and metadata leakage against a two-relay test harness.
- **PS-084-09.R03** Contract tests validate envelopes, results, events and mirror views against the schema registry and the CTR-FED-001 vectors.

## Specification

See the module test table below (all processes).

**Fixtures:** Two in-memory relays A and B with allowlist A<->B, authors X (homed at B) and Y (homed at C), device keys from fixed seeds, fixed clock 2026-11-04T10:00:00Z, blocklist empty unless stated.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-084-09.T01 | contract | PS-084-01.R01, PS-084-01.R03, PS-084-04.R01 | ingest valid listing envelope from B | FederatedRecord accepted with provenance originRelay B, via [], verifiedAt set, status readable, schema valid |
| TEST-PS-084-09.T02 | unit | PS-084-02.R03, PS-084-02.R01, PS-084-09.R01 | each rule V01–V13 violated in turn | documented code per rule and nothing beyond a stub stored |
| TEST-PS-084-09.T03 | integration | PS-084-02.R01, PS-084-02.R02 | blocked author, blocked cid and blocked peer envelopes | stored count unchanged, response is FEDERATION_NOT_ACCEPTED for all three with the same shape |
| TEST-PS-084-09.T04 | property | PS-084-03.R01, PS-084-03.R03 | random sequences of arrivals, gaps, tombstones and conflicts | only declared transitions occur; terminal states never change; only accepted records are readable |
| TEST-PS-084-09.T05 | integration | PS-084-03.R02, PS-084-01.R02 | seq 7 before seq 6, then seq 6 | seq 7 buffered then both accepted in order; events emitted in seq order |
| TEST-PS-084-09.T06 | integration | PS-084-03.R01, PS-084-07.R01 | seq 7 buffered and 24 h pass | record dropped with reason gap_timeout and one origin fetch attempted |
| TEST-PS-084-09.T07 | integration | PS-084-01.R02, PS-084-03.R03, PS-084-07.R02 | valid owner tombstone for accepted record | content purged within 1 h, tombstone applied with expiresAt = appliedAt + 180 days, event emitted |
| TEST-PS-084-09.T08 | abuse | PS-084-03.R03, PS-084-07.R01 | resend the tombstoned envelope, and an envelope dated 181 days ago | FEDERATION_TOMBSTONED and FEDERATION_RECORD_TIME_INVALID; no resurrection |
| TEST-PS-084-09.T09 | integration | PS-084-03.R01, PS-084-07.R02 | tombstone arrives before target | pending_target then applied after 24 h; later target rejected FEDERATION_TOMBSTONED |
| TEST-PS-084-09.T10 | abuse | PS-084-05.R02, PS-084-07.R01 | third party signs tombstone for X's record | FEDERATION_TOMBSTONE_UNAUTHORIZED and record remains accepted |
| TEST-PS-084-09.T11 | abuse | PS-084-02.R01, PS-084-07.R01 | relay B sends record by author Y homed at C; then valid signed move record | FEDERATION_ORIGIN_MISMATCH; after federation.account.moved rebind the same sender is accepted |
| TEST-PS-084-09.T12 | abuse | PS-084-02.R01, PS-084-07.R01 | 7000 valid envelopes from one peer within an hour and 11 batches in a minute | FEDERATION_QUOTA_EXCEEDED with retryAfterMs; stored count capped at 6000 |
| TEST-PS-084-09.T13 | integration | PS-084-03.R01, PS-084-07.R01, PS-084-08.R02 | two envelopes same author and seq with different cids | both quarantined, hidden from reads, federation.conflict.detected consumed |
| TEST-PS-084-09.T14 | abuse | PS-084-02.R01, PS-084-07.R02, PS-084-07.R03 | payload with homeAddress, lat/lon, geohash 7 and a script tag | FEDERATION_PAYLOAD_INVALID; nothing stored; escaped render for allowed text |
| TEST-PS-084-09.T15 | integration | PS-084-04.R01, PS-084-04.R02, PS-084-06.R02 | batch of 100 with 3 invalid envelopes | 97 accepted, 3 rejected with codes, results in request order, 97 accepted events and 3 rejected events |
| TEST-PS-084-09.T16 | contract | PS-084-04.R02, PS-084-04.R03, PS-084-09.R02, PS-084-09.R03 | each command and event | payload and results validate against registry schemas; consumed events handled per effect table |
| TEST-PS-084-09.T17 | abuse | PS-084-05.R01, PS-084-05.R02, PS-084-05.R03 | unsigned and unknown-peer requests to the relay inbox; relay reads provenance without operator role; vault publish with a key not in the principal's document | FEDERATION_PEER_NOT_ALLOWED or FEDERATION_REQUEST_SIGNATURE_INVALID, FORBIDDEN, FEDERATION_AUTHOR_NOT_OWNED |
| TEST-PS-084-09.T25 | integration | PS-084-01.R04, PS-084-02.R01, PS-084-03.R01 | vault receives accept-offer statement signed by a key that is not the listing author | quarantined with statusReason signer_role_invalid, no domain event, user can discard |
| TEST-PS-084-09.T26 | integration | PS-084-06.R01, PS-084-01.R04 | publish while relay is down, then relay returns receipt, then peer acknowledgement | UI states local committed, transport_acknowledged, peer_accepted in order and never more than reached |
| TEST-PS-084-09.T18 | integration | PS-084-05.R02, PS-084-06.R01 | local publish with own key, then with another principal's did; relay ingest batch replayed with the same Idempotency-Key | first accepted, second FEDERATION_AUTHOR_NOT_OWNED, replay returns original response |
| TEST-PS-084-09.T19 | chaos | PS-084-06.R02, PS-084-06.R03 | kill relay mid-batch; blocklist service down; media fetch fails | restart leaves each envelope committed or absent; DEPENDENCY_UNAVAILABLE stores nothing; record accepted with mediaStatus pending |
| TEST-PS-084-09.T20 | integration | PS-084-07.R03, PS-084-01.R03 | media from origin with hot-link URL and 6 MiB image | fetched by relay only, oversize skipped, no client request reaches origin |
| TEST-PS-084-09.T21 | load | PS-084-08.R01, PS-084-08.R02 | 10 batches/s of 100 envelopes for 5 minutes | batch p95 ≤ 800 ms, metrics exported |
| TEST-PS-084-09.T22 | integration | PS-084-08.R03, PS-084-08.R04, PS-084-03.R03 | 10 000 tombstoned mirrors and delayed purge | sweep ≤ 10 s; purge_lag alert fires when lag exceeds 1 h |
| TEST-PS-084-09.T23 | unit | PS-084-09.R01 | traceability tool run | every PS-084 requirement maps to a passing test |
| TEST-PS-084-09.T24 | integration | PS-084-10.R01, PS-084-10.R02, PS-084-10.R03 | export, import to fresh relay, restore backup | records and tombstones round trip; imported records are re-verified; tombstones remain effective |

## Acceptance criteria

- All tests T01–T24 pass in CI.
- Adversarial suite shows forged provenance, replay, flood, fork and metadata leakage are each blocked.
- No record above P0 or finer than L2 is ever stored or served (privacy suite).
- Tombstoned content is gone from reads within 1 h and from storage within 24 h in the chaos test.

## Dependencies

Module depends on: F11.S01.M01, F11.S01.M03, F11.S02.M02, F11.S02.M03, F11.S03.M01, F11.S03.M02, F07.S02.M01, F15.S04.M02, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-FLG-001, CTR-OBS-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
