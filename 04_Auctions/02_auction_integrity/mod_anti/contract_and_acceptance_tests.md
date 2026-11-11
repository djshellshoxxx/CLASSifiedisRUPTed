# PS-036-09 — Contract and acceptance tests: Anti-shill controls

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M01 Anti-shill controls](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/anti` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-036-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-036-09.R02** Linkage and scoring are covered by fixture-based unit tests and a labelled synthetic dataset with measured precision and recall.
- **PS-036-09.R03** Contract tests validate the event payload and that no check data leaks into bidder-facing payloads.

## Specification

See the module test table below (all processes).

**Fixtures:** Host H; seller S whose key set (identity.portable_doc.key_set) lists K1 and K2 active and K0 revoked with reason superseded; bidders B1 (unlinked), B2 (holds K2), B3 (same_owner attestation dual-signed with S), B4 (registered with S in one signed device-link request), B5 (unlinked, flagged); synthetic dataset of 500 auctions with 25 labelled shill patterns; fixed clock 2026-11-05T12:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-036-09.T01 | unit | PS-036-01.R01, PS-036-01.R03, PS-036-02.R01 | evaluate seller key, K2, K0, attested B3 and B4 | all denied with the right internal reasons (seller_self, linked_identity_doc, linked_attestation, linked_host_registration); B1 allowed; allow leaves no record |
| TEST-PS-036-09.T02 | unit | PS-036-02.R02, PS-036-02.R03 | each rule V01–V07 violated or satisfied | documented outcome and generic error code |
| TEST-PS-036-09.T03 | property | PS-036-03.R01 | random check, review and sweep event sequences | only declared transitions succeed; terminal states never change |
| TEST-PS-036-09.T04 | integration | PS-036-03.R02, PS-036-03.R03 | flagged bidder wins; review opened then closed without the check in confirmedCheckIds | result unchanged by the flag; check dismissed; confirmed only when listed |
| TEST-PS-036-09.T05 | unit | PS-036-04.R01, PS-036-02.R02 | shill-v1 totals - alternation only; concentration 0.6 plus alternation plus new_key; damped concentration 0.9 plus damped price_pump plus probing 5; concentration 0.9 plus probing 5 plus price_pump; every feature at its maximum | 25 no flag; 60 flag; 17 + 12 + 30 = 59 no flag; 35 + 30 + 25 = 90 flag at high priority; 135 capped at 99 |
| TEST-PS-036-09.T06 | contract | PS-036-04.R02, PS-036-04.R03, PS-036-09.R02 | check, score, allow_pair, queries and the event | payloads validate against registry schemas; no check data in bid errors; no event for linkage_stale flags |
| TEST-PS-036-09.T07 | abuse | PS-036-05.R01, PS-036-05.R02, PS-036-05.R03 | bidder, seller and non-moderator try to read checks; allow_pair without operator role | FORBIDDEN or NOT_FOUND; no data returned |
| TEST-PS-036-09.T08 | chaos | PS-036-06.R01, PS-036-06.R02, PS-036-06.R03 | F07 cache 23 h old, 25 h old and missing; host database unreadable; scoring job crashes; duplicate events | 23 h - linkage denies; 25 h and missing - the seller key and a revoked key are still denied, other linkage allows with a linkage_stale flag, counter and alert; unreadable - DEPENDENCY_UNAVAILABLE; scoring retried; duplicates skipped |
| TEST-PS-036-09.T09 | abuse | PS-036-07.R01, PS-036-07.R02 | compare response time and body for denial and allow paths | identical error body family and timing within 5 ms; no reason leaked |
| TEST-PS-036-09.T10 | integration | PS-036-09.R03 | run synthetic dataset | precision at least 0.7 and recall at least 0.5 at threshold 60, report stored; no deny from heuristics |
| TEST-PS-036-09.T11 | load | PS-036-08.R01, PS-036-08.R02, PS-036-08.R03 | 10 000 cache entries, 50 bids per second for 5 minutes | check p95 ≤ 40 ms, score lag p95 ≤ 5 s, metrics exported without key labels |
| TEST-PS-036-09.T12 | unit | PS-036-09.R01 | traceability tool run | every PS-036 requirement maps to a passing test |
| TEST-PS-036-09.T13 | integration | PS-036-10.R01, PS-036-10.R02, PS-036-10.R03 | operator export for audit, restore host backup | checks round-trip; restore keeps the open-check unique index |
| TEST-PS-036-09.T14 | integration | PS-036-01.R04, PS-036-03.R01 | same_owner attestation revoked after a denial; seller revokes K2 and bids with it; auction scheduled before the revocation | within 30 days the attestation still denies; K2 denied as revoked_key; for the earlier auction the link is permanent; after 30 days a later auction allows the attested key; past denial kept as history |
| TEST-PS-036-09.T15 | integration | PS-036-01.R02 | inspect public projections, bidder errors and events, seller views, logs, federation outbox and user exports | no ShillCheck field appears outside host moderator views and the operator export |
| TEST-PS-036-09.T16 | unit | PS-036-07.R03, PS-036-02.R04 | allowlist test of the scorer and linkage inputs; two keys bid from one IP address in the same second; two keys in one relay access-token session | scorer reads only the shill-v1 event fields and linkage only the listed evidence; the same-IP bidders are both allowed; the session pair is denied as linked_host_registration |
| TEST-PS-036-09.T17 | abuse | PS-036-02.R01 | allow_pair(seller, seller) and allow_pair covering a seller_self or linked_identity_doc denial | refused with VALIDATION_FAILED; the denial stays |
| TEST-PS-036-09.T18 | integration | PS-036-03.R03 | review with flagged bidders B2 and B5 closes with only B2's check in confirmedCheckIds | B2's check confirmed with RET-EVIDENCE; B5's check dismissed with RET-SHORT |
| TEST-PS-036-09.T19 | integration | PS-036-07.R04 | operator export, export of the subject's user vault, deletion applied on the host, retention sweep | checks only in the operator export; subject pseudonymized; dismissed checks purged after 30 days, confirmed after RET-EVIDENCE |
| TEST-PS-036-09.T20 | integration | PS-036-04.R04 | bid with a key revoked by a classrup.security.keyrevocation/v1 statement the host holds | check returns deny with internal reason revoked_key; the bidder sees AUCTIONS_BIDDER_NOT_ELIGIBLE; never DEPENDENCY_UNAVAILABLE |
| TEST-PS-036-09.T21 | contract | PS-036-04.R05, PS-036-02.R04 | linkage reads against F07 conformance stubs for key_set, find_by_key, key_status, list_linkage and linked_keys; a same_owner attestation with only one signature; a stub that also offers a rotation chain | the check calls exactly the named in-process reads; only links signed by both DIDs count; no rotation-chain read is made |

## Acceptance criteria

- All tests T01–T21 pass in CI.
- Deterministic linkage and revoked keys always deny and heuristics never deny.
- Denials are generic and indistinguishable in body and timing from other ineligibility.
- No IP address, network range, timing or device fingerprint is ever used as linkage evidence.

## Dependencies

Module depends on: F04.S01.M01, F07.S01.M01, F07.S01.M02, F07.S02.M01, F07.S03.M02, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
