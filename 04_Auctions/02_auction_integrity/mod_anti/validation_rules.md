# PS-036-02 — Validation rules: Anti-shill controls

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M01 Anti-shill controls](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/anti` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-036-02.R01** The eligibility check evaluates deterministic linkage first and heuristic scoring only afterwards and asynchronously.
- **PS-036-02.R02** Scoring inputs are bounded - the last 20 bids of the subject and the last 30 days of host data, taken from consumed host-local auctions.bid.* and auction result events - and the features, points, caps and thresholds are the fixed constants of scoring table shill-v1 in this specification.
- **PS-036-02.R03** Every violation maps to one stable error code; the bidder-facing code never discloses the reason.
- **PS-036-02.R04** Linkage evidence is limited to signed or host-recorded co-occurrence - identity documents, rotation chains, dual-signed attestations, one signed device-link or registration request, one relay access-token session - and never IP addresses, network ranges, time proximity or device fingerprints.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | subject key is not equal to the auction seller key; no allow-list entry overrides this rule | AUCTIONS_BIDDER_NOT_ELIGIBLE |
| V02 | subject key is not in the seller's identity document key set, rotation chain or revoked keys kept per 01.R04 (cache age at most 24 h) | AUCTIONS_BIDDER_NOT_ELIGIBLE |
| V03 | no same_owner attestation dual-signed by both keys (F07.S03.M02, N11) connects subject and seller keys within 3 hops; attestations revoked less than 30 days ago, or after this auction was scheduled, still count | AUCTIONS_BIDDER_NOT_ELIGIBLE |
| V04 | linked_host_registration - subject and seller keys do not appear together in one signed classrup.identity.device_link/v1 or handle registration request received by this host, nor in one relay access-token session of this host (F07.S01.M02); IP addresses, network ranges and time proximity are excluded | AUCTIONS_BIDDER_NOT_ELIGIBLE |
| V05 | score input window is at most 20 bids and 30 days and thresholds are 60 for flag and 85 for high priority per shill-v1 | VALIDATION_FAILED |
| V06 | host operator allow-list entries name one auction, one bidder key different from the seller key, a reason of 10..500 code points, and cover only linked_host_registration or linked_attestation reasons; the allow-list never overrides V01, V02 or V07 | VALIDATION_FAILED |
| V07 | subject key is not revoked as known to this host (classrup.identity.device_revocation/v1 statements or identity documents it holds) | AUCTIONS_BIDDER_NOT_ELIGIBLE |

Scoring table shill-v1 (fixed constants). Window W is the subject's last 20 bids on this host within the last 30 days, built only from consumed host-local auctions.bid.placed, auctions.bid.outbid, auctions.bid.retracted, auctions.auction.closed and auctions.auction.won events; S is the subject, X the seller of the scored auction A; retractions count as bids of S. concentration - share of S's bids in W placed on X's auctions with at least 5 bids in W; at least 0.6 gives 25 points, at least 0.9 gives 35; cap 35. alternation - in A, S and one other bidder alternate as consecutive leader-changing entries at least 6 times in a row; 25 points; cap 25. probing - in A within 10 minutes, S placed bids at exactly the minimum next bid that were each followed by an auto entry for the leader; 3 such bids give 20 points, 5 give 30; cap 30. price_pump - on at least 3 of X's auctions closed in the last 30 days, S was the last bidder outbid before close and did not win; 25 points; cap 25. new_key - S's first bid on this host is less than 7 days old and S bid on no seller other than X; 10 points; cap 10. never_wins - S bid on at least 5 auctions on this host closed in the last 30 days and won none; 10 points; cap 10. Damping - when the host had fewer than 5 distinct sellers with auctions in the last 30 days, concentration and price_pump points are halved and rounded down. Total - the sum of feature points capped at 99; flag at 60 or more; high priority at 85 or more.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-036-09.T01 | unit | PS-036-01.R01, PS-036-01.R03, PS-036-02.R01 | evaluate seller key, K2, K0, attested B3 and B4 | all denied with the right internal reasons (seller_self, linked_identity_doc, linked_attestation, linked_host_registration); B1 allowed; allow leaves no record |
| TEST-PS-036-09.T02 | unit | PS-036-02.R02, PS-036-02.R03 | each rule V01–V07 violated or satisfied | documented outcome and generic error code |
| TEST-PS-036-09.T05 | unit | PS-036-04.R01, PS-036-02.R02 | shill-v1 totals - alternation only; concentration 0.6 plus alternation plus new_key; damped concentration 0.9 plus damped price_pump plus probing 5; concentration 0.9 plus probing 5 plus price_pump; every feature at its maximum | 25 no flag; 60 flag; 17 + 12 + 30 = 59 no flag; 35 + 30 + 25 = 90 flag at high priority; 135 capped at 99 |
| TEST-PS-036-09.T16 | unit | PS-036-07.R03, PS-036-02.R04 | allowlist test of the scorer and linkage inputs; two keys bid from one IP address in the same second; two keys in one relay access-token session | scorer reads only the shill-v1 event fields and linkage only the listed evidence; the same-IP bidders are both allowed; the session pair is denied as linked_host_registration |
| TEST-PS-036-09.T17 | abuse | PS-036-02.R01 | allow_pair(seller, seller) and allow_pair covering a seller_self or linked_identity_doc denial | refused with VALIDATION_FAILED; the denial stays |

## Dependencies

Module depends on: F04.S01.M01, F07.S01.M01, F07.S01.M02, F07.S02.M01, F07.S03.M02, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
