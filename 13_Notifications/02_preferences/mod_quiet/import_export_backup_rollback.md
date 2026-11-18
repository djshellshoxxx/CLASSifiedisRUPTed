# PS-108-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_quiet. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-SCH-001, CTR-FED-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-108-10.R01 | Export includes the active period (if any) and the last ended period, with absolute times. Class PRIVATE_PERSONAL. | MVP |
| PS-108-10.R02 | Import of pause state is not supported; restored backups never restore an active pause. | MVP |
| PS-108-10.R03 | Pause state is not federated. | MVP |
| PS-108-10.R04 | Rollback: flag `quiet_gating` off stops holding; held items are released immediately if within 24 h, dropped otherwise. | MVP |

## Data / schema
Export: `{ "quiet_period": { "preset", "starts_at", "ends_at", "end_reason" } | null, "schema_version": "1.0.0" }`.

## Commands / queries / events
`account.export` includes section `quiet_period.export` (self).

## States & transitions
Restore sets any active period to `ended` with reason `restored`.

## Validation & errors
Import attempts return QUIET.IMPORT_NOT_SUPPORTED.

## Authorization
Export self; rollback operator global dual control.

## Failure, idempotency, concurrency, offline
Export read-only and repeatable.

## Privacy, retention, abuse
Backups hold periods for 30 days max per backup policy.

## Observability & budgets
Export ≤ 1 s p95.

## Tests
- TEST-PS-108-10-01 (contract): export validates; contains absolute times only.
- TEST-PS-108-10-02 (integration): restore yields no active period.
- TEST-PS-108-10-03 (integration): rollback releases held items within 24 h and drops the rest.
- TEST-PS-108-10-04 (negative): import attempt returns QUIET.IMPORT_NOT_SUPPORTED.

## Acceptance criteria
1. Export lossless.
2. Restore never reactivates a pause.
3. Rollback drill recorded (not yet run).

## Assumptions & open decisions
- ASSUMPTION: restored pauses end.
- D07 PROVISIONAL (D07 default, unapproved).
