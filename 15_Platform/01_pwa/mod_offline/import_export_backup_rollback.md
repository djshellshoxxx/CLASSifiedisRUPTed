# PS-116-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/01_pwa/mod_offline (F15.S01.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-SCH-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-116-10.R01 | Queue is not exported in owner data export (CTR-PRV-001 R11); it is device-local and not portable. | MVP |
| PS-116-10.R02 | Device migration (new device) does not copy the queue; the user is shown pending counts before the old device is wiped. | MVP |
| PS-116-10.R03 | Rollback of a client release keeps queue schema readable: the previous client reads entries with a higher MINOR as opaque and keeps them pending. | MVP |
| PS-116-10.R04 | Forward migration of stored entries runs as a pure, idempotent upcast on read (CTR-SCH-001 R07); stored ciphertext is never rewritten in place. | MVP |
| PS-116-10.R05 | Server-side backups do not include device queues; restore does not depend on queues. | MVP |
| PS-116-10.R06 | Export of the local diagnostic bundle (PS-116-08 R05) is counts and codes only. | MVP |

## Data / schema
Migration hook (CTR-SCH-001) for `offline_entry`: kinds `upcast`, `pure`, `deterministic`, `idempotent`, `lossless`. Fixtures synthetic.

## Commands / queries / events
No export command. Rollback and migration run at app start.

## States & transitions
Migration failure keeps the original entry and sets `not_applied` with `OFFLINE.MIGRATION_FAILED` (internal, not retryable), per CTR-SCH-001 quarantine rule.

## Validation & errors
`OFFLINE.MIGRATION_FAILED` added to the module catalog.

## Authorization
Diagnostic bundle is user-initiated and contains no account reference.

## Failure, idempotency, concurrency, offline
Rollback during `sending` returns entries to `queued` (PS-116-06 R05). Migration runs once per entry; repeat is a no-op.

## Privacy, retention, abuse
Diagnostic bundle is reviewed for identifiers by the F10 checklist before release (ASSUMPTION).

## Observability & budgets
Migration time <= 500 ms for 500 entries (ASSUMPTION).

## Tests
- TEST-PS-116-10-01 (migration golden): every supported `from` version upcasts to expected output.
- TEST-PS-116-10-02 (idempotency): applying migration twice yields identical bytes.
- TEST-PS-116-10-03 (rollback): previous client keeps higher-MINOR entries pending.
- TEST-PS-116-10-04 (export): owner data export contains no queue entries.

## Acceptance criteria
1. Migration fixtures pass for each supported path.
2. TEST-PS-116-10-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: 500 entries migrate in under 500 ms on the reference device.
- PROVISIONAL (D08 default, unapproved).
- OPEN (D10): key continuity across device migration.
