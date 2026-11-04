# PS-038-09 — Contract and acceptance tests: Anti-sniping soft close

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M02 Anti-sniping soft close](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/sniping` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-038-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-038-09.R02** Boundary and cap behaviour is covered by deterministic unit tests and by a property test against a reference model.
- **PS-038-09.R03** Contract tests validate the extension statement and event, and the host-signature check in vaults.

## Specification

See the module test table below (all processes).

**Fixtures:** Host H with injectable clock; auction A ending 2026-11-12T10:00:00Z; bidders B1, B2; fixed clock 2026-11-12T09:50:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-038-09.T01 | unit | PS-038-01.R01, PS-038-01.R02, PS-038-02.R01, PS-038-02.R02 | bids with 120001, 120000, 1 and 0 ms remaining | 120001 no; 120000 yes; 1 yes; 0 refused by bid path with AUCTIONS_NOT_OPEN, no extension |
| TEST-PS-038-09.T02 | unit | PS-038-02.R03, PS-038-01.R03 | extensionCount 29 then 30 and a bid in window | 30th extension created; next qualifying bid accepted without extension; constants equal softclose-v1 |
| TEST-PS-038-09.T03 | property | PS-038-01.R02, PS-038-03.R02 | random bid times and kinds against reference model for 100 000 sequences | end time equals model; total extension ≤ 3 600 000 ms; seq consecutive |
| TEST-PS-038-09.T04 | unit | PS-038-02.R01, PS-038-03.R01 | proxy auto entry, retraction, rejected bid and manual bid in window | only the manual bid extends |
| TEST-PS-038-09.T05 | integration | PS-038-03.R03, PS-038-06.R01 | extension commits before close lease; close worker started earlier | close re-reads end under lease and releases without closing |
| TEST-PS-038-09.T06 | chaos | PS-038-06.R02, PS-038-06.R03 | crash between extension insert and adjust_end; fail adjust_end | whole bid transaction rolls back; no extension row; bid not accepted |
| TEST-PS-038-09.T07 | integration | PS-038-02.R03, PS-038-06.R03, PS-038-04.R01 | two bids 50 ms apart inside the window | two sequential extensions; second counts from the moved end; unique seq holds |
| TEST-PS-038-09.T08 | contract | PS-038-04.R02, PS-038-04.R03, PS-038-09.R02, PS-038-09.R03 | apply, list, preview, event and statement | payloads and signature validate; vault rejects statement with wrong host key or wrong previous end |
| TEST-PS-038-09.T09 | abuse | PS-038-05.R01, PS-038-05.R02, PS-038-05.R03 | vault or principal calls apply; forged extension statement | FORBIDDEN or quarantine; end time unchanged |
| TEST-PS-038-09.T10 | integration | PS-038-07.R01, PS-038-07.R02 | clock step backwards and forged client times | hostTime stays non-decreasing; client time ignored |
| TEST-PS-038-09.T11 | abuse | PS-038-07.R03, PS-038-01.R01 | adversary bids minimum increments every 100 ms in each window | auction ends at scheduledEnd plus at most 60 minutes; alert at 25 extensions |
| TEST-PS-038-09.T12 | load | PS-038-08.R01, PS-038-08.R02, PS-038-08.R03 | 20 bids per second on one hot auction for 5 minutes | apply adds ≤ 5 ms p95; list p95 ≤ 50 ms |
| TEST-PS-038-09.T13 | unit | PS-038-09.R01 | traceability tool run | every PS-038 requirement maps to a passing test |
| TEST-PS-038-09.T14 | integration | PS-038-10.R01, PS-038-10.R02, PS-038-10.R03 | export history, import into fresh vault, restore host backup | extensions round-trip; signature chain verifies; unique seq preserved |
| TEST-PS-038-09.T15 | e2e | PS-038-01.R03, PS-038-03.R01 | mobile bidder watches countdown through two extensions | countdown follows host time, extension toasts announced, axe zero serious issues |

## Acceptance criteria

- All tests T01–T15 pass in CI.
- No auction ever ends later than its scheduled end plus 60 minutes.
- Every end-time change is a host-signed numbered extension that bidders can verify.

## Dependencies

Module depends on: F04.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
