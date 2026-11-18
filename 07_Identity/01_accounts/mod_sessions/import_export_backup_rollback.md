# PS-054-10 — import, export, backup and rollback
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/01_accounts/mod_sessions. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-054-10.R01 | Sessions and token digests are never exported or included in portability bundles. Owner export lists session metadata for the last 90 days (device label, dates, end reason). | MVP |
| PS-054-10.R02 | Sessions are never imported from another node or restored into a different account. | MVP |
| PS-054-10.R03 | Restore from backup marks all sessions with `absolute_expires_at` in the past as expired and rebuilds the revocation list before serving. | MVP |
| PS-054-10.R04 | Restore replays every revocation issued after the backup snapshot before serving (CTR-PRV-001 R06 BT-04 pattern). | MVP |
| PS-054-10.R05 | Rollback of a session-format change keeps dual-read of old digest format for 24 h. | MVP |

## Data / schema
Digest format versioned by prefix (`v1:` SHA-256). Keyed-hash key identifier stored with each network digest.

## Commands / queries / events
Export is an owner query; emits `session.exported` without content.

## States & transitions
Restore re-evaluates timers per [workflow_state_machine](workflow_state_machine.md).

## Validation & errors
Import attempt returns `SYS.FORBIDDEN`.

## Authorization
Export requires owner step-up.

## Failure, idempotency, concurrency, offline
Restore is idempotent by snapshot ID; partial restore is not served.

## Privacy, retention, abuse
Export file deleted 24 h after download.

## Observability & budgets
Restore report counts: expired on restore, revocations replayed.

## Tests
TEST-PS-054-21 (export contents), TEST-PS-054-22 (restore replays revocation), TEST-PS-054-23 (dual-read during format rollback).

## Acceptance criteria
1. Export fixture has no token digest.
2. Revoked session is not valid after restore.

## Assumptions & open decisions
- ASSUMPTION: 90-day export window; 24 h dual-read.
- PROVISIONAL (D07 default, unapproved).
