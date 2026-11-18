# PS-018-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_n. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R05–R09), CTR-FED-001 (R03), CTR-PRV-001 (R11).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-018-10.R01 | Search runs are not exported to peers or participants; the matcher may export run metadata for audit. | MVP |
| PS-018-10.R02 | Replay with the same algorithm version reproduces every completed run byte-for-byte. | MVP |
| PS-018-10.R03 | Rollback sets `max_length` to 4 (disables 5–8 runs) without deleting run records. | MVP |
| PS-018-10.R04 | Algorithm changes are MAJOR when any golden fixture output changes. | MVP |

## Data / schema
Audit export: `{run_id, status, parameters, candidate_count, algorithm_version}`; no candidate content.

## Commands / queries / events
Replay is an internal tool, not a command.

## States & transitions
Rollback path: disable runs → existing completed runs remain immutable.

## Validation & errors
Unknown MAJOR returns SCH.UNKNOWN_VERSION.

## Authorization
Audit export by operator with purpose and dual control (CTR-CAP-001 R07).

## Failure, idempotency, concurrency, offline
Backup excludes snapshot content (RET-EPH). Restore keeps run status and truncated flag.

## Privacy, retention, abuse
Audit export omits all refs.

## Observability & budgets
Replay ≤ 2 s per fixture run (ASSUMPTION).

## Tests
- TEST-PS-018-10-01 (contract): audit export validates.
- TEST-PS-018-10-02 (golden): replay of golden fixtures matches.
- TEST-PS-018-10-03 (rollback): max_length set to 4 deletes zero runs.

## Acceptance criteria
1. Golden replay passes before any algorithm release.
2. Rollback deletes zero records.
3. Audit export contains no refs.

## Assumptions & open decisions
- PENDING: feature flag for generalised matching (F15 mod_flags).
- PROVISIONAL (D02 default, unapproved).
