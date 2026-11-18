# PS-066-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/03_meetups/mod_safe (Platform Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R05–R07), CTR-PRV-001 (R06, R07), CTR-FED-001 (R03). **Decisions:** D07 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-066-10.R01 | No import path. Plans are never imported from federation or third parties (CTR-FED-001 R03). | MVP |
| PS-066-10.R02 | Owner export (JSON, schema `meetup_plan` 1.0.0) includes the owner's own plans only, with status, window and venue reference. | MVP |
| PS-066-10.R03 | Owner export excludes the counterparty's trusted-contact hash and all code hashes. | MVP |
| PS-066-10.R04 | Backups are encrypted at rest; restore replays purge and revocation events (CTR-PRV-001 R06). | MVP |
| PS-066-10.R05 | Rollback disables new plan creation only. Active plans continue to expire by timers; no data is deleted on rollback. | MVP |
| PS-066-10.R06 | Export generation is rate-limited to 1 per 24 h per account (ASSUMPTION). | MVP |

## Data / schema
Export manifest: `schema_version`, `generated_at` (minute precision), `plan_count`, `sha256`. Export file: array of plan objects per PS-066-01 minus excluded fields.

## Commands / queries / events
Export is a `meetup.export` action (CTR-CAP-001 verb `export`) and emits `meetup_plan.exported` with count only.

## States & transitions
Export job states: `queued`, `generated`, `downloaded`, `expired` (download link valid 24 h).

## Validation & errors
`SYS.RATE_LIMITED` on export frequency breach. Missing plans are never reported as errors in export.

## Authorization
Only the owner may export; moderators cannot export on a user's behalf.

## Failure, idempotency, concurrency, offline
Export job retries are idempotent by export ID. Restore runs in revision order and reconciles against purge log.

## Privacy, retention, abuse
Export files are deleted 24 h after generation. Export contents are PRIVATE_PERSONAL and are never sent by email.

## Observability & budgets
Export duration p95 ≤ 10 s for up to 500 plans (ASSUMPTION).

## Tests
- TEST-PS-066-10-01 (contract): export contains no trusted-contact hash or code hash.
- TEST-PS-066-10-02 (integration): restore from backup removes plans purged after backup time.
- TEST-PS-066-10-03 (integration): rollback blocks `meetup.propose` and leaves timers running.
- TEST-PS-066-10-04 (unit): export deleted at 24 h.

## Acceptance criteria
1. Export matches R02 and R03 exactly.
2. Restore never resurrects purged plans (test).
3. Rollback test passes with no data loss.

## Assumptions & open decisions
- ASSUMPTION: export limit 1 per 24 h; export file retention 24 h.
- D07 (PROVISIONAL default, unapproved).
