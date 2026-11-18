# PS-020-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_three. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-SCH-001, CTR-EVT-001, CTR-PRV-001. Slot IDs `par_` owned by F02.S01.M02 (PROVISIONAL).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-020-01.R01 | A three-party cycle has exactly 3 slots, `slot_index` 0..2. | MVP |
| PS-020-01.R02 | Canonical rotation: the slot with the lowest `participant_ref` is index 0; the order is then fixed. | MVP |
| PS-020-01.R03 | Slot k's `offer_ref` satisfies slot (k+1 mod 3)'s `wants_ref`. | MVP |
| PS-020-01.R04 | Each `lst_` in the cycle has status not locked at proposal time (pre-check against mod_lock state). | MVP |
| PS-020-01.R05 | `version` starts at 1 and increases by 1 per change. | MVP |

## Data / schema
```json
{
  "cycle_id": "cyc_<26>",
  "length": 3,
  "version": "integer >= 1",
  "status": "enum(proposed, consented, locked, declined, expired, superseded)",
  "slots": "[{slot_index: 0..2, par_id: par_<26>, participant_ref: acc_<26>, offer_ref: var_|lst_, wants_ref: string, consent: enum(pending, consented, declined)}]",
  "feasibility_ref": "ccd_<26>",
  "value_gap_minor": "string, decimal, >= 0",
  "expires_at": "timestamp",
  "schema_version": "1.0.0"
}
```
Classes: `participant_ref` PSEUDONYMOUS; `value_gap_minor` FINANCIAL_EVIDENCE when non-zero; others PUBLIC.

## Commands / queries / events
Shapes in PS-020-04.

## Validation & errors
Rules in PS-020-02.

## Authorization
Slot-scoped views (PS-020-05).

## Failure, idempotency, concurrency, offline
Version is the concurrency token (PS-020-06).

## Privacy, retention, abuse
Pseudonyms only (PS-020-07).

## Observability & budgets
Row ≤ 3 KB (ASSUMPTION).

## Tests
- TEST-PS-020-01-01 (unit): rotation yields one canonical sequence for all 3 rotations.
- TEST-PS-020-01-02 (property): version increments by exactly 1.
- TEST-PS-020-01-03 (contract): schema validates.

## Acceptance criteria
1. Any input rotation gives the same canonical order.
2. Length other than 3 cannot be stored.
3. A cycle containing a locked listing cannot be stored as proposed.

## Assumptions & open decisions
- PROVISIONAL (D02 default, unapproved): deterministic canonical form.
