# PS-122-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/03_operations/mod_recovery (F15.S03.M03). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-SCH-001, CTR-ID-001 (PENDING registration of prefix `rst` for restore runs and `drl` for drill records). **Canonical owner of record class "restore run and DR drill record":** F15.S03.M03. Account recovery (`rec_`, F07.S01.M03) and cycle recovery (F02.S03.M04) are different record classes.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-122-01.R01 | A restore run references exactly one `bkp_id` in status `complete` (PS-120) and one target environment. | MVP |
| PS-122-01.R02 | Restore run carries a change or case reference (`cas_` or change ticket ID) and two distinct approver IDs. | MVP |
| PS-122-01.R03 | Drill records reference a restore run, store measured RTO and RPO, and pass/fail per check. | MVP |
| PS-122-01.R04 | Runbook steps are versioned immutable records with owner role and rollback step. | MVP |
| PS-122-01.R05 | No record stores restored content; counts and digests only. | MVP |

## Data / schema
```json
{
  "rst_id": "rst_ + 26 chars (PENDING registration)",
  "bkp_id": "bkp_ ID (PS-120-01)",
  "target": "isolated | production",
  "change_ref": "cas_ ID or change ticket reference",
  "initiator_ref": "ope_ ID", "approver_refs": ["ope_ ID", "ope_ ID"],
  "status": "planned | approved | restoring | verifying | replaying_holds | indexing | read_only | promoted | aborted | failed",
  "runbook_version": "SemVer",
  "started_at": "RFC 3339 UTC ms", "ended_at": "RFC 3339 UTC ms or null",
  "digest_checks": {"events_chain": "pass|fail", "tombstones": "pass|fail", "holds": "pass|fail"},
  "measured_rto_s": "integer or null", "measured_rpo_s": "integer or null"
}
```
Constraints: `approver_refs` has two distinct values, neither equal to `initiator_ref` (CTR-CAP-001 R07); `promoted` requires `target = production` and a second run result `read_only`.

## Commands / queries / events
See PS-122-04.

## States & transitions
See PS-122-03.

## Validation & errors
See PS-122-02.

## Authorization
See PS-122-05.

## Failure, idempotency, concurrency, offline
A restore run is identified by (`bkp_id`, `target`, `change_ref`); repeat creation returns the same run.

## Privacy, retention, abuse
Records contain IDs, counts and digests only. Retention RET-AUD (12 months).

## Observability & budgets
Measured RTO and RPO are published per drill (PS-122-08).

## Tests
- TEST-PS-122-01-01 (schema): run with one approver is invalid.
- TEST-PS-122-01-02 (schema): `initiator_ref` equal to approver is invalid.
- TEST-PS-122-01-03 (lint): runbook versions are immutable (digest change without version bump refused).
- TEST-PS-122-01-04 (privacy scan): drill records contain no record content.

## Acceptance criteria
1. Schemas validate fixtures; prefixes registered before production use (PENDING).
2. TEST-PS-122-01-01 through -04 pass.

## Assumptions & open decisions
- PENDING: CTR-ID-001 MINOR change for `rst` and `drl` prefixes.
- PROVISIONAL (D07 default) for retention of drill records.
