# PS-017-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_four. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-SCH-001, CTR-EVT-001, CTR-PRV-001. Slot IDs `par_` owned by F02.S01.M02 (PROVISIONAL, see PS-017-09 notes).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-017-01.R01 | A four-party cycle has exactly 4 slots, `slot_index` 0..3, in canonical order. | MVP |
| PS-017-01.R02 | Canonical rotation: the slot whose participant ref sorts first is index 0; the order is then fixed for the cycle's life. | MVP |
| PS-017-01.R03 | Each slot has one `participant_ref` (`acc_`), one `offer_ref` (`var_` or `lst_`) and one `wants_ref` matched to the next slot's offer. | MVP |
| PS-017-01.R04 | `version` is an integer starting at 1; every change to slots or terms increments it. | MVP |
| PS-017-01.R05 | Four distinct `lst_` IDs are required across the cycle. | MVP |

## Data / schema
```json
{
  "cycle_id": "cyc_<26>",
  "length": 4,
  "version": "integer >= 1",
  "status": "enum(proposed, consented, locked, declined, expired, superseded)",
  "slots": "[{slot_index: 0..3, par_id: par_<26>, participant_ref: acc_<26>, offer_ref: var_|lst_, wants_ref: string, consent: enum(pending, consented, declined)}]",
  "feasibility_ref": "ccd_<26>",
  "value_gap_minor": "string, decimal, >= 0",
  "expires_at": "timestamp",
  "schema_version": "1.0.0"
}
```
Classes: all PUBLIC except `participant_ref` (PSEUDONYMOUS) and `value_gap_minor` (FINANCIAL_EVIDENCE when non-zero).

## Commands / queries / events
Shapes in PS-017-04.

## Validation & errors
Rules in PS-017-02.

## Authorization
Slot-scoped views in PS-017-05.

## Failure, idempotency, concurrency, offline
Version counter is the concurrency token (PS-017-06).

## Privacy, retention, abuse
Slot pseudonyms only; retention per PS-017-07.

## Observability & budgets
Proposal row ≤ 4 KB (ASSUMPTION).

## Tests
- TEST-PS-017-01-01 (unit): rotation of any 4-cycle yields one canonical sequence.
- TEST-PS-017-01-02 (property): version increments by exactly 1 per change.
- TEST-PS-017-01-03 (contract): record validates against 1.0.0.

## Acceptance criteria
1. Any input rotation produces the same canonical slot order.
2. Length other than 4 cannot be stored.
3. Version never decreases.

## Assumptions & open decisions
- PROVISIONAL (D02 default, unapproved): deterministic canonical form.
- PENDING CTR-ID-001: slot-level `par_` ownership confirmation with F02.S01.M02.
