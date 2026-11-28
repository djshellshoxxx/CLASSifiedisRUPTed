# PS-038-03 — Workflow state machine: Anti-sniping soft close

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M02 Anti-sniping soft close](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/sniping` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-038-03.R01** Extensions are immutable facts; there is no lifecycle beyond creation, so no state machine applies.
- **PS-038-03.R02** The only effect of an extension is a new currentEndsAt on the auction, applied in the same transaction.
- **PS-038-03.R03** Closing re-reads currentEndsAt under the lease, so an extension committed before the lease is always honoured.

## Specification

**Note:** Extension rows are append-only facts created once and never changed; the auction lifecycle is owned by F04.S01.M01.

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-038-09.T03 | property | PS-038-01.R02, PS-038-03.R02 | random bid times and kinds against reference model for 100 000 sequences | end time equals model; total extension ≤ 3 600 000 ms; seq consecutive |
| TEST-PS-038-09.T04 | unit | PS-038-02.R01, PS-038-03.R01 | proxy auto entry, max-only update, retraction, rejected bid and manual bid in window | only the manual bid extends |
| TEST-PS-038-09.T05 | integration | PS-038-03.R03, PS-038-06.R01 | extension commits before close lease; close worker started earlier | close re-reads end under lease and releases without closing |
| TEST-PS-038-09.T15 | e2e | PS-038-01.R03, PS-038-03.R01 | mobile bidder watches countdown through two extensions | countdown follows host time, extension toasts announced, axe zero serious issues |

## Dependencies

Module depends on: F04.S01.M01, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F13.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
