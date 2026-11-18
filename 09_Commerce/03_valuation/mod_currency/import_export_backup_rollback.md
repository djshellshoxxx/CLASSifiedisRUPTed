# PS-073-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/03_valuation/mod_currency (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R05–R08), CTR-PRV-001 (R06). **Decisions:** D03 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-073-10.R01 | Registry import only from a signed registry release reviewed by two operators; no third-party registry import. | MVP |
| PS-073-10.R02 | Export: full registry with versions and digests (public). | MVP |
| PS-073-10.R03 | Rollback to a previous registry release keeps all versions referenced by existing claims available. | MVP |
| PS-073-10.R04 | Backups preserve versions and digests. | MVP |

## Data / schema
Release manifest: `release_id`, `entries[]` with `version` and `sha256`, `iso_list_version`.

## Commands / queries / events
`currency.released` event (count and digest only).

## States & transitions
Release states: `drafted`, `approved`, `published`, `rolled_back`.

## Validation & errors
`SYS.CONFLICT` on digest mismatch in import.

## Authorization
Release by two operators.

## Failure, idempotency, concurrency, offline
Import idempotent by `release_id`.

## Privacy, retention, abuse
Public.

## Observability & budgets
Import p95 ≤ 30 s for 10,000 entries (ASSUMPTION).

## Tests
- TEST-PS-073-10-01 (contract): export digests verify.
- TEST-PS-073-10-02 (integration): rollback keeps referenced versions resolvable.
- TEST-PS-073-10-03 (negative): import with digest mismatch refused.

## Acceptance criteria
1. Export verifies.
2. Rollback leaves referenced versions available.

## Assumptions & open decisions
- D03 (PROVISIONAL default, unapproved).
