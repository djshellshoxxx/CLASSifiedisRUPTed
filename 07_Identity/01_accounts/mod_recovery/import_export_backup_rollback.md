# PS-053-10 — import, export, backup and rollback
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/01_accounts/mod_recovery. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-053-10.R01 | Owner export includes recovery method metadata (kind, status, masked contact, dates). It excludes hashes, OTPs, codes and request history older than 90 days. | MVP |
| PS-053-10.R02 | Recovery methods are never imported from another node or from a portability bundle (SECRET class). | MVP |
| PS-053-10.R03 | Restore from backup replays revocations, cancellations and expiries before serving; requests with `expires_at` in the past become `expired`. | MVP |
| PS-053-10.R04 | Schema migrations are additive. Hash format carries an explicit version prefix so parameters can change without re-hashing consumers. | MVP |
| PS-053-10.R05 | Feature-flag rollback disables new `start` calls only. In-flight requests finish under the rules in force when they started. | MVP |

## Data / schema
Argon2id stored string format: `$argon2id$v=19$m=65536,t=3,p=1$...`; version embedded.

## Commands / queries / events
Export is an owner-initiated query, emitted as an export event (`recovery_method.exported`) without content.

## States & transitions
Restore re-evaluates states under [workflow_state_machine](workflow_state_machine.md) timers.

## Validation & errors
Import of a recovery payload returns `MOD_RECOVERY.REQUEST_MALFORMED` (400).

## Authorization
Export requires owner session with step-up (PS-053-05.R04).

## Failure, idempotency, concurrency, offline
Export generation is idempotent per owner per day. Partial export is never delivered.

## Privacy, retention, abuse
Exports are deleted from the server 24 h after download (RET-EPH).

## Observability & budgets
Restore report: counts of replayed revocations and expiries.

## Tests
TEST-PS-053-21 (export contents vs R01), TEST-PS-053-22 (restore replays expiries), TEST-PS-053-23 (flag rollback keeps in-flight completion).

## Acceptance criteria
1. Export fixture contains no hash, OTP or code.
2. Restore test: expired OTP is not usable after restore.

## Assumptions & open decisions
- ASSUMPTION: 90-day history window in export.
- PROVISIONAL (D07 default, unapproved).
- PROVISIONAL (D10 default, unapproved): no cross-node recovery method transfer.
