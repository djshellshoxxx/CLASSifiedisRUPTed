# PS-008-10 — import export backup rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [01_LocalBazaar/03_inventory/mod_availability](SPEC.md) (F01.S03.M01; accountable role: Platform Lead for backup and rollback, Marketplace Lead for owner). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001 (migration, no in-place rewrite), CTR-PRV-001 (export and backup classes), CTR-EVT-001 (compensating events).

**Decisions:** Backup retention follows D07 default (PROVISIONAL, unapproved). Compensating reversal of committed units follows D04 default (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-008-10.R01 | Owner export returns own records and holds, with counterparty `holder_ref` redacted, in JSON 1.0.0. | MVP |
| PS-008-10.R02 | Restore replays deletions and holds before serving. Restored PLACED holds past `expires_at` become EXPIRED. | MVP |
| PS-008-10.R03 | Restore recomputes counters and rejects any state violating R02 of PS-008-01. | MVP |
| PS-008-10.R04 | Rollback is by compensating event only. Stored events are never deleted or rewritten. | MVP |
| PS-008-10.R05 | Executed holds are not reversible by hold rollback. Reversal is `availability.committed` with negative correction, allowed within 14 d (ASSUMPTION). | MVP |

## Export
- Format: JSON, `schema_version` 1.0.0, one file per owner. Classes PUBLIC and PSEUDONYMOUS only.
- Excludes other parties' `holder_ref` and any event payload beyond the record.
- Import: none in MVP. Federation import of a listing's counts is deferred (FED.DATA_CLASS_NOT_ALLOWED is not triggered; counts are PUBLIC but federation is off by default).

## Backup and restore
- Backups are encrypted and expire on the schedule of CTR-PRV-001 (Y for PUBLIC and PSEUDONYMOUS).
- Restore order: deletions, holds, then counts. Withdrawn holds are never resurrected.
- Restore verification: invariant check (TEST-02) before traffic is routed.

## Rollback
- Bad bulk configure: reverse with compensating `availability.configured` (reason `rollback`), never delete.
- Schema change: MINOR additions only in rollout. Breaking change needs a MAJOR with lossless upcast (CTR-SCH-001 R07).
- Reversal of executed holds: PS-008-10 R05 above; disputes route to F09 dispute process by reference.

## Tests
- TEST-PS-008-10-01 (export): owner export contains no other party's `holder_ref`.
- TEST-PS-008-10-02 (restore): backup with stale PLACED hold → EXPIRED after restore; withdrawn hold stays withdrawn.
- TEST-PS-008-10-03 (restore invariant): corrupted counter in backup → restore refuses to serve.
- TEST-PS-008-10-04 (rollback): bulk configure reversed by compensating event; original event bytes unchanged.
- TEST-PS-008-10-05 (reversal): executed-hold reversal allowed within 14 d and rejected after.

## Acceptance criteria
1. TEST-PS-008-10-01 to -05 pass in CI.
2. Zero event rows deleted in rollback drill.
3. Restore drill meets RTO and RPO set by F15 (PENDING).

## Assumptions & open decisions
- ASSUMPTION: 14-day reversal window.
- PROVISIONAL (D07 and D04 defaults, unapproved).
- PENDING: F15 RTO and RPO values.
