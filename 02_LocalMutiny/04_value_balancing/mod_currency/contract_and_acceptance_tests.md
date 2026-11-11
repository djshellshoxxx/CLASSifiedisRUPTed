# PS-025-09 — Contract and acceptance tests: Barter currency normalization

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S04.M02 Barter currency normalization](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/value_balancing/currency` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-025-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-025-09.R02** Conversion arithmetic is tested against a reference implementation for 10 000 random cases including negative exponents and zero-decimal currencies.
- **PS-025-09.R03** Expiry, refresh and mismatch behavior is tested with injected clocks.

## Specification

See the module test table below (all processes).

**Fixtures:** Valuations v1 12000 EUR, v2 10000 GBP, v3 10990 CHF; quotes GBP->EUR 117/100, CHF->EUR 1043/1000, purpose barter_normalization, issued 2026-11-04T10:00:00Z and expiring 2026-11-05T10:00:00Z; EUR->JPY 163/1 reference quote; JPY settlement variant; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-025-09.T01 | unit | PS-025-01.R01, PS-025-01.R02, PS-025-02.R02, PS-025-09.R03 | compute the 3-currency example | converted amounts 12000, 11700, 11463 EUR minor; normalizationHash stable |
| TEST-PS-025-09.T02 | property | PS-025-01.R02, PS-025-02.R02 | 10 000 random conversions vs reference | identical results with single HALF_EVEN rounding; no floating point |
| TEST-PS-025-09.T03 | unit | PS-025-02.R01, PS-025-02.R03 | each rule V01..V09 violated in turn | documented error code and nothing stored |
| TEST-PS-025-09.T04 | unit | PS-025-01.R03, PS-025-02.R03 | JPY settlement with EUR items | exponent difference applied exactly as in MNY-4 |
| TEST-PS-025-09.T05 | integration | PS-025-03.R01, PS-025-03.R02 | quote expires before commit with injected clock | record expired, mutiny.normalization.expired emitted, coordinator must create quote_refresh revision |
| TEST-PS-025-09.T06 | integration | PS-025-03.R02, PS-025-03.R03 | subject commits then quote expires | record frozen and expiry ignored |
| TEST-PS-025-09.T07 | contract | PS-025-04.R01, PS-025-04.R02, PS-025-09.R02 | commands and events | outputs and events validate against classrup.mutiny.normalization_record/v1 and registry; no statement produced |
| TEST-PS-025-09.T08 | integration | PS-025-04.R02, PS-025-06.R02 | rate source down | MUTINY_QUOTE_UNAVAILABLE, no guessed rate, no partial record |
| TEST-PS-025-09.T09 | abuse | PS-025-05.R01, PS-025-05.R02, PS-025-07.R02 | peer revision with altered converted amount by one minor unit | MUTINY_NORMALIZATION_MISMATCH and consent blocked |
| TEST-PS-025-09.T10 | abuse | PS-025-05.R03, PS-025-07.R01, PS-025-07.R03 | manual rate presented as signed; request payload inspected | MUTINY_QUOTE_SOURCE_UNLABELLED; request contains only pair and lifetime |
| TEST-PS-025-09.T11 | integration | PS-025-06.R01, PS-025-06.R03 | replay compute; crash mid-transaction | one current record; no partial state |
| TEST-PS-025-09.T12 | integration | PS-025-04.R03, PS-025-06.R02 | valuation.declared after compute | record superseded and recomputed before the next revision |
| TEST-PS-025-09.T13 | load | PS-025-08.R02 | 16 items 4 quotes on emulated Moto G | p95 ≤ 60 ms |
| TEST-PS-025-09.T14 | unit | PS-025-08.R01, PS-025-08.R03, PS-025-09.R01 | diagnostics and traceability tool | no amounts or DIDs in diagnostics; every PS-025 requirement maps to a passing test |
| TEST-PS-025-09.T15 | integration | PS-025-10.R01, PS-025-10.R02, PS-025-10.R03 | export, import, rollback | records round-trip and keep hash; imported current records are marked expired when quotes lapsed |
| TEST-PS-025-09.T16 | contract | PS-025-04.R04, PS-025-02.R03 | compute for the 3-currency example with consent deadlines of 23 h 30 min and 72 h | quote requests carry purpose barter_normalization and validForMs ≤ 86400000; 23 h 30 min accepted with every rate labelled 'pinned rate agreed by all parties'; 72 h refused with MUTINY_QUOTE_TOO_SHORT |
| TEST-PS-025-09.T17 | integration | PS-025-03.R01, PS-025-04.R04 | mutiny.proposal.withdrawn, mutiny.revision.forked and mutiny.lock.conflict_detected for subjects with current records | each record closed; later compute for a new subject creates a new record |
| TEST-PS-025-09.T18 | unit | PS-025-01.R01, PS-025-02.R01 | single-currency JPY subject | no NormalizationRecord referenced, no 24 h cap, toleranceRef EUR->JPY 163/1 returned |
| TEST-PS-025-09.T19 | integration | PS-025-07.R04 | F10 export, deletion and retention sweep | section mutiny.normalizations exported; erased DID pseudonymized in local metadata; normalizationHash unchanged |

## Acceptance criteria

- All tests T01–T19 pass in CI.
- Every converted amount matches the MNY-4 formula with one HALF_EVEN rounding, and every record names its quote sources.
- No cycle can be consented with an expired quote and expiry before commit always requires a new revision and fresh consent from everyone.

## Dependencies

Module depends on: F02.S04.M03, F09.S03.M01, F09.S03.M02, F09.S03.M03, F16.S02.M03, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
