# PS-016-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_feasibility. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-SCH-001, CTR-PRV-001 (R04), CTR-COM-001 (R04), CTR-EVT-001. Candidate prefix PENDING CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-016-01.R01 | Input is an immutable snapshot of at most 5,000 directed edges. `snapshot_id` = SHA-256 of JCS(snapshot). | MVP |
| PS-016-01.R02 | A candidate has length L in 2..8 and L distinct participant slots, each with one offered `var_`/`lst_` and one wanted reference. | MVP |
| PS-016-01.R03 | Verdict is one of FEASIBLE, INFEASIBLE, BUDGET_EXHAUSTED; a verdict has one or more reason codes from PS-016-02. | MVP |
| PS-016-01.R04 | Region data is a registered `region_cell` (LOCATION_COARSE) only; no coordinates, addresses or precise centres. | MVP |
| PS-016-01.R05 | Value terms reference a pinned `qte_` (CTR-COM-001 R04) and are stored as decimal strings in minor units. | MVP |

## Data / schema
```json
{
  "snapshot_id": "sha256 hex (64)",
  "algorithm_version": "1.0.0",
  "candidate_id": "ccd_<26> (PENDING prefix)",
  "length": "integer 2..8",
  "slots": "[{participant_ref: acc_, offer_ref: var_|lst_, want_ref: string, region_cell: string}]",
  "value_minor": "string|null, decimal, >= 0",
  "quote_ref": "qte_<26>|null",
  "verdict": "enum(FEASIBLE|INFEASIBLE|BUDGET_EXHAUSTED)",
  "reason_codes": "[FEASIBLE.*]",
  "schema_version": "1.0.0"
}
```
Classes: `participant_ref` PSEUDONYMOUS; `region_cell` LOCATION_COARSE; `value_minor` FINANCIAL_EVIDENCE (no federation; CTR-FED-001 R03). `offer_ref` and `want_ref` PUBLIC.

## Commands / queries / events
Shapes in PS-016-04.

## Validation & errors
Rules in PS-016-02.

## Authorization
Participant-scoped reads; see PS-016-05.

## Failure, idempotency, concurrency, offline
Snapshots are immutable; algorithm version is part of every verdict.

## Privacy, retention, abuse
Classes above; retention in PS-016-07.

## Observability & budgets
Snapshot size budget: ≤ 5,000 edges, ≤ 1 MiB serialised (ASSUMPTION).

## Tests
- TEST-PS-016-01-01 (unit): snapshot hash stable under key reordering in JCS.
- TEST-PS-016-01-02 (contract): candidate validates against 1.0.0.
- TEST-PS-016-01-03 (privacy lint): no field outside the classes above.

## Acceptance criteria
1. Snapshot of 5,000 edges is accepted; 5,001 is rejected (PS-016-02).
2. Candidate with L = 1 or L = 9 is rejected at schema level.
3. Lint shows no coordinate or address field.

## Assumptions & open decisions
- PROVISIONAL (D02 default, unapproved): bounded deterministic search over an immutable snapshot.
- PROVISIONAL (D05 default, unapproved): coarse public regions only.
- PENDING CTR-SCH-001 registry entry for candidate schema.
