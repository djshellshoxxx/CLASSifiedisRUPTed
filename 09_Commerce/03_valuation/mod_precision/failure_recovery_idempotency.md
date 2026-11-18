# PS-074-06 — failure, recovery, idempotency and rule-set versioning

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/03_valuation/mod_precision (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (quote `quote_hash`), CTR-SCH-001 (R02, R07). **Decisions:** D03 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-074-06.R01 | Calls are idempotent: same inputs yield the same output. | MVP |
| PS-074-06.R02 | Rule-set version is pinned per claim or quote; a newer version never changes an existing `quote_hash` result. | MVP |
| PS-074-06.R03 | Rule-set change is a new version with a new vector-suite digest; old versions remain in the library for replay. | MVP |
| PS-074-06.R04 | Library panic or unexpected error maps to `PREC.INTERNAL` and the caller refuses the operation (no default value). | MVP |

## Data / schema
Rule-set reference `rules_version` stored by callers with the result.

## Commands / queries / events
None.

## States & transitions
None.

## Validation & errors
`PREC.INTERNAL` (non-retryable) is refused, never retried silently.

## Authorization
Not applicable.

## Failure, idempotency, concurrency, offline
Pure; offline-safe.

## Privacy, retention, abuse
Not applicable.

## Observability & budgets
Counter of `PREC.INTERNAL`: must be 0 in production.

## Tests
- TEST-PS-074-06-01 (property): repeated calls identical.
- TEST-PS-074-06-02 (integration): replay of stored quote with old rules version reproduces `quote_hash` result.
- TEST-PS-074-06-03 (unit): injected internal error returns `PREC.INTERNAL`, no value.

## Acceptance criteria
1. Determinism and replay verified.
2. No silent default values.

## Assumptions & open decisions
- D03 (PROVISIONAL default, unapproved).
