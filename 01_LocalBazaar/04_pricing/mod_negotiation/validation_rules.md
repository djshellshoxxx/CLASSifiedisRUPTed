# PS-010-02 — Validation rules: Price negotiation

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S04.M02 Price negotiation](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/pricing/negotiation` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-010-02.R01** Every outgoing command and every incoming statement is validated for roles, turn, convergence, currency, listing revision and expiry before it changes state.
- **PS-010-02.R02** Statements that fail verification are quarantined with a reason and never change a negotiation.
- **PS-010-02.R03** Every violation maps to one stable error code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | signature verifies over JCS bytes, author is the stated buyer or seller key, schema version supported | VALIDATION_FAILED |
| V02 | it is the actor's turn (awaiting equals the actor) and status is open | CONFLICT_STATE |
| V03 | roundNo = lastRoundNo + 1 and roundNo <= 10 | BAZAAR_NEGOTIATION_ROUND_LIMIT |
| V04 | seller counter amount >= buyer's previous amount and <= seller's previous amount (or asking price at round 1); buyer counter symmetric | BAZAAR_NEGOTIATION_NOT_CONVERGING |
| V05 | amount is a positive integer string in a currency the listing accepts (bazaar.sell_terms.accepts) | VALIDATION_FAILED |
| V06 | listing is negotiable, published, and the cited listingRevision equals the current revision for accept | BAZAAR_NEGOTIATION_LISTING_CHANGED |
| V07 | round expiry between 1 h and 7 days and not later than hardDeadline | VALIDATION_FAILED |
| V08 | accept is made before the round expiresAt according to the receiving vault clock | EXPIRED |
| V09 | neither party blocks the other (F07.S02.M02) | BLOCKED_PARTY |
| V10 | note <= 280 code points | VALIDATION_FAILED |
| V11 | seller inventory check (bazaar.inventory.check) succeeds before confirmation | BAZAAR_NEGOTIATION_HOLD_FAILED |
| V12 | expectedRevision matches | CONFLICT_REVISION |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-010-09.T01 | unit | PS-010-01.R01, PS-010-01.R03, PS-010-02.R01 | S counters EUR 48.00 then B counters EUR 44.00 | rounds stored immutable with prev chain; ordering by roundNo not clock |
| TEST-PS-010-09.T03 | unit | PS-010-02.R02, PS-010-02.R03 | violate each rule V01-V12 in turn | documented error code returned or statement quarantined with reason; state unchanged |
| TEST-PS-010-09.T07 | integration | PS-010-03.R02, PS-010-02.R03 | last unit held for B2 while B's acceptance is in transit | S sends signed close superseded; B shows rejected superseded; no double hold |

## Dependencies

Module depends on: F01.S04.M01, F01.S03.M01, F01.S01.M01, F01.S02.M01, F09.S01.M01, F09.S03.M03, F07.S02.M02, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001, CTR-COM-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
