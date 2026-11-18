# PS-018-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_n. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-SCH-001, CTR-EVT-001, CTR-PRV-001. Search run prefix PENDING CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-018-01.R01 | A search run is bound to one sealed feasibility snapshot (`snapshot_id`) and one parameter set (`max_length` 5..8, `budget_steps`, `candidate_cap`). | MVP |
| PS-018-01.R02 | Output candidates have length 5..8 and distinct participants and listings. | MVP |
| PS-018-01.R03 | Candidates are ordered by (length ascending, value gap ascending, canonical sequence ascending); the order is part of the record. | MVP |
| PS-018-01.R04 | Routing record: `length` → owning module (2 → mod_two, 3 → mod_three, 4 → mod_four, 5–8 → mod_n). Exactly one owner per length. | MVP |
| PS-018-01.R05 | `candidate_cap` default 1,000 per run (ASSUMPTION); cap reached sets `truncated: true`. | MVP |

## Data / schema
```json
{
  "run_id": "srch_<26> (PENDING prefix)",
  "snapshot_id": "sha256 hex (64)",
  "algorithm_version": "1.0.0",
  "parameters": {"max_length": "5..8", "budget_steps": "integer", "candidate_cap": "integer"},
  "status": "enum(queued, running, completed, budget_exhausted, failed)",
  "candidates": "[{cycle_length: 5..8, canonical_sequence: [var_|lst_ refs], value_gap_minor: string, feasibility_ref: ccd_}]",
  "truncated": "boolean",
  "schema_version": "1.0.0"
}
```
Classes: candidate refs PUBLIC or PSEUDONYMOUS per source; `value_gap_minor` FINANCIAL_EVIDENCE when non-zero.

## Commands / queries / events
Shapes in PS-018-04.

## Validation & errors
Rules in PS-018-02.

## Authorization
Run records visible to the matcher only (PS-018-05).

## Failure, idempotency, concurrency, offline
Run is immutable once completed (PS-018-06).

## Privacy, retention, abuse
Candidate refs deleted with the snapshot (PS-018-07).

## Observability & budgets
Run record ≤ 256 KB with cap 1,000 candidates (ASSUMPTION).

## Tests
- TEST-PS-018-01-01 (unit): ordering is total and stable.
- TEST-PS-018-01-02 (unit): each length maps to exactly one owner.
- TEST-PS-018-01-03 (contract): record validates against 1.0.0.

## Acceptance criteria
1. Ordering identical across 1,000 shuffled inputs.
2. Length 2–4 never appears in mod_n output.
3. Truncated runs flag `truncated: true` in 100% of cases.

## Assumptions & open decisions
- PROVISIONAL (D02 default, unapproved): bounded deterministic search with explicit ordering.
- PENDING CTR-SCH-001 registry entry for search-run schema.
