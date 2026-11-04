# PS-036-02 — Validation rules: Anti-shill controls

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M01 Anti-shill controls](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/anti` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-036-02.R01** The eligibility check evaluates deterministic linkage first and heuristic scoring only afterwards and asynchronously.
- **PS-036-02.R02** Scoring inputs are bounded - the last 20 bids of the subject and the last 30 days of host data - and thresholds are fixed constants in this specification.
- **PS-036-02.R03** Every violation maps to one stable error code; the bidder-facing code never discloses the reason.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | subject key is not equal to the auction seller key | AUCTIONS_BIDDER_NOT_ELIGIBLE |
| V02 | subject key is not in the seller's identity document key set or rotation chain (cache age at most 24 h) | AUCTIONS_BIDDER_NOT_ELIGIBLE |
| V03 | no non-revoked same-owner attestation connects subject and seller keys within 3 hops | AUCTIONS_BIDDER_NOT_ELIGIBLE |
| V04 | host registration or session data does not show subject and seller keys registered or authenticated together | AUCTIONS_BIDDER_NOT_ELIGIBLE |
| V05 | score input window is at most 20 bids and 30 days and thresholds are 60 for flag and 85 for high priority | VALIDATION_FAILED |
| V06 | host operator allow-list entries name one auction, one pair and a reason of 10..500 code points | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-036-09.T01 | unit | PS-036-01.R01, PS-036-01.R03, PS-036-02.R01 | evaluate seller key, K2, K0 and attested B3 | all denied with the right internal reasons; B1 allowed; allow leaves no record |
| TEST-PS-036-09.T02 | unit | PS-036-02.R02, PS-036-02.R03 | each rule V01–V06 violated or satisfied | documented outcome and generic error code |
| TEST-PS-036-09.T05 | unit | PS-036-04.R01, PS-036-02.R02 | alternation, probing, concentration, price pump features at their thresholds | scores add as specified; 59 does not flag, 60 flags, 85 marks high priority |

## Dependencies

Module depends on: F04.S01.M01, F07.S01.M01, F07.S02.M01, F07.S03.M02, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
