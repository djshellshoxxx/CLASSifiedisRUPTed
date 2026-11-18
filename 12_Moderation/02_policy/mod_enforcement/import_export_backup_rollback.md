# PS-096-10 — import export backup rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/02_policy/mod_enforcement. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R06, R07, R11), CTR-EVT-001 (R08), CTR-FED-001 (R07), CTR-CAP-001 (R07).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-096-10.R01 | Enforcement actions are not importable from other nodes. Inbound tombstones are handled by F11 under CTR-FED-001 R07. | MVP |
| PS-096-10.R02 | Owner export includes the owner's own action type, dates and reason category, not moderator IDs (CTR-PRV-001 R11). | MVP |
| PS-096-10.R03 | Operator export of actions is case-scoped with dual control; contains IDs and codes only. | MVP |
| PS-096-10.R04 | Backups are encrypted; restore replays `enf_event` in revision order and re-dispatches effects for `active` actions with `effect_status` ≠ confirmed. | MVP |
| PS-096-10.R05 | No rollback command exists. Corrections are reversals or supersessions with new events. | MVP |

## Data / schema
Owner export: JSON with schema_version, one object per action on the owner's targets. Operator export: JSON Lines, ≤ 10 000 rows per file. Export events `enf.exported` carry count and digest only.

## Commands / queries / events
`enf.export_owner` (`enf.read` self), `enf.export_case` (`enf.read`, dual control) → `enf.exported`.

## States & transitions
Restore inserts historical rows and re-dispatches effects; no transition events are re-emitted for historical rows.

## Validation & errors
Export over limit → `ENFORCE.EXPORT_TOO_LARGE` (400, non-retryable; use cursor). Restore with revision gap → restore aborted and alert.

## Authorization
Owner export: target owner only. Case export: dual control.

## Failure, idempotency, concurrency, offline
Exports idempotent by `export_id`; failed exports are discarded. Restore idempotent by backup ID; effect re-dispatch uses outbox dedupe (PS-096-06).

## Privacy, retention, abuse
Exports expire after 7 days. Owner export must not include the reason category of actions on which legal hold is active (holds apply to cases, so export shows "under review" instead; ASSUMPTION).

## Observability & budgets
Restore ≤ 30 min per 100 000 actions (ASSUMPTION). Metric `enforce_backup_last_success_timestamp`.

## Tests
- `TEST-PS-096-10-01` integration: backup → delete → restore → state and revision equal; effects re-dispatched once.
- `TEST-PS-096-10-02` negative: owner export excludes moderator IDs.
- `TEST-PS-096-10-03` negative: case export without dual control denied.
- `TEST-PS-096-10-04` drill: revision gap aborts restore without partial visibility.

## Acceptance criteria
1. Restore reproduces all actions and effects in test.
2. Owner export contains zero moderator identifiers.
3. No rollback path exists (code review gate).

## Assumptions & open decisions
- ASSUMPTION: RPO ≤ 15 min and RTO ≤ 4 h are shared defaults with F15.
- D07 (retention), PROVISIONAL default: legal-hold exceptions apply (unapproved).
