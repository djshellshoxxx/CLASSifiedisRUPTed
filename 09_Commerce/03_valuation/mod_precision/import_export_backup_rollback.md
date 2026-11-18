# PS-074-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/03_valuation/mod_precision (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R05–R08), CTR-COM-001 (R08 quote_hash). **Decisions:** D03 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-074-10.R01 | Rule-set releases are published with version, vector-suite digest and library version pin. | MVP |
| PS-074-10.R02 | Rollback to a previous rule-set version is allowed only for replay, not for new quotes. | MVP |
| PS-074-10.R03 | Stored results are never recomputed under a different rule set without a new version record. | MVP |
| PS-074-10.R04 | No data import or export: library holds no data. | MVP |

## Data / schema
Release record: `rules_version`, `vector_sha256`, `library_version`, `released_at`.

## Commands / queries / events
None.

## States & transitions
Release states: `draft`, `published`, `replay_only`.

## Validation & errors
Attempt to create a new quote with `replay_only` version: `PREC.ROUNDING_UNSUPPORTED` or `SYS.PRECONDITION_FAILED` (policy: `SYS.PRECONDITION_FAILED`).

## Authorization
Release requires two approvers (PS-074-05).

## Failure, idempotency, concurrency, offline
Release is idempotent by version.

## Privacy, retention, abuse
Not applicable.

## Observability & budgets
Not applicable.

## Tests
- TEST-PS-074-10-01 (integration): replay of stored results under pinned version reproduces outputs.
- TEST-PS-074-10-02 (negative): new quote with replay-only version refused.
- TEST-PS-074-10-03 (unit): release without two approvers refused.

## Acceptance criteria
1. Replay determinism verified across releases.
2. Replay-only versions cannot mint quotes.

## Assumptions & open decisions
- D03 (PROVISIONAL default, unapproved).
