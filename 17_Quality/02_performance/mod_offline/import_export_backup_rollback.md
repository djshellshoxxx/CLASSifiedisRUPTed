# PS-140-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/02_performance/mod_offline. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001 (schema versions and migration), CTR-PRV-001 (export classes).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-140-10.R01 | Scenario definitions are imported only from repository files reviewed by pull request and validated against CTR-SCH-001. | MVP |
| PS-140-10.R02 | Export includes scenario definitions and run summaries only (`PUBLIC` class). Fixture bodies are never exported. | MVP |
| PS-140-10.R03 | Backups follow the platform schedule; restoring a backup replays no test runs and triggers no side effects. | MVP |
| PS-140-10.R04 | A scenario rollback is a new version that points to the earlier content; no in-place edit. | MVP |

## Import, export and backup
- Import: pull request with schema validation and synthetic-fixture scan (PS-140-07). Import of an invalid file fails the whole batch.
- Export: JSON, one file per scenario and per build; ASSUMPTION: export is for QA and gate review only.
- Backup: run records are included in platform backups and expire under PS-140-07 retention.

## Rollback
- Scenario rollback: activate an earlier version as a new version (`version` + 1). History is kept.
- Run rollback: runs are never deleted to correct a result; a corrected result is a new attempt with a reason code.
- Schema rollback: forbidden in place (CTR-SCH-001); requires a new contract version.

## Assumptions & open decisions
- ASSUMPTION: run records can be restored from backup without re-sending events.
- D07 (retention) affects backup expiry: PROVISIONAL (D07 default, unapproved).
