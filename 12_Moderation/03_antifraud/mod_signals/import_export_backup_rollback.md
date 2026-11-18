# PS-101-10 — import export backup rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_signals (Trust&Safety Lead). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R07, R08), CTR-PRV-001 (R06, R07, R11), CTR-EVT-001 (R08), CTR-FED-001 (deferred).

**Decision labels:** Backup and retention interaction is PROVISIONAL (D07 default, unapproved). Federated import and export: deferred (D01, PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-101-10.R01 | No federated import of signals in MVP. Any import is rejected with `SIGNAL.FORBIDDEN_FIELD` until D01 and CTR-FED-001 apply. | Future |
| PS-101-10.R02 | Subject portability export excludes raw signals. Appeal decision reasons include signal type and bucket only. | MVP |
| PS-101-10.R03 | Audit export of aggregates (global scope, K_MIN = 5) is allowed for Trust&Safety Lead only. | MVP |
| PS-101-10.R04 | Backups are encrypted and include signal records; restore replays expiry and redaction events before serving reads. | MVP |
| PS-101-10.R05 | Rollback never deletes signal or audit records. Bad producers are disabled by flag; bad signals are neutralized by suppression events. | MVP |
| PS-101-10.R06 | Scoring weights are versioned configuration; rollback restores the previous version and records the change in an `aud_` record. | MVP |

## Data / schema
Export package (aggregate only): `schema_version`, `period`, `signal_type`, `count`, `k_threshold`, `generated_at`. No `subject_ref`.

## Commands / queries / events
Admin export runs as an audited `sys_` job; each export emits `aud_` with purpose and decision ID.

## States & transitions
Restore sets records to the state implied by replayed events (PS-101-03). Rollback emits events; it does not rewrite records.

## Validation & errors
Restore fails with `SYS.CONFLICT` if replayed revisions have gaps (CTR-EVT-001 R02; `EVT.REVISION_GAP` on replicas).

## Authorization
Export requires `sgn_aggregate.read` with `global` scope and purpose constraint (PS-101-05).

## Failure, idempotency, concurrency, offline
Restore is idempotent: replaying the same backup twice yields identical projections. Offline: not applicable.

## Privacy, retention, abuse
Backup expiry follows backup schedule; restore never resurrects REDACTED subject linkage (CTR-PRV-001 R06). Export contains no PSEUDONYMOUS identifiers.

## Observability and budgets
Restore duration and replay count recorded. Target: restore of 30 days of signals within 60 minutes (ASSUMPTION).

## Tests
- TEST-PS-101-25 (integration): restore a backup, replay deletions, confirm no `acc_` linkage for deleted subjects.
- TEST-PS-101-26 (integration): aggregate export contains no `subject_ref` and no cell below 5.
- TEST-PS-101-27 (integration): disabling a producer flag leaves existing records unchanged.
- TEST-PS-101-28 (property): replay twice gives identical projection checksum.

## Acceptance criteria
1. Restore drill passes with the documented procedure.
2. Export tests show no PSEUDONYMOUS identifiers.
3. Rollback drill: weight rollback recorded in `aud_`; no record deleted.

## Assumptions & open decisions
- ASSUMPTION: backup tooling supports per-table restore.
- D07 (PROVISIONAL, unapproved). D01 (PROVISIONAL, unapproved) for future federation.
