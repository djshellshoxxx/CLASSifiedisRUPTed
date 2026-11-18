# PS-070-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/02_settlement/mod_disputes (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R06, R11), CTR-SCH-001 (migration), CTR-FED-001 (R03), CTR-COM-001 (R13). **Decisions:** D07 (PROVISIONAL default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-070-10.R01 | Owner export includes own disputes (`statement` as raised by the owner) and dispute status; counterparty statement redacted. | MVP |
| PS-070-10.R02 | No import of disputes in MVP; import attempts return `SYS.FORBIDDEN`. | MVP |
| PS-070-10.R03 | Backup restore reproduces dispute states and escalation timers at recorded `state_version`. | MVP |
| PS-070-10.R04 | Restore does not re-fire timers already `fired` (PS-070-06 timer table). | MVP |
| PS-070-10.R05 | Rollback disables new dispute commands via feature flag; open disputes continue to be escalated by timers. | MVP |
| PS-070-10.R06 | Export of a redacted dispute returns redaction markers and digest, not content. | MVP |

## Data / schema
Export manifest: `schema_version`, `exported_at`, `dispute_count`, `redaction_count`, `digest`.

## Commands / queries / events
Export is a query. Restore writes `aud_` completion record with counts. No domain events on restore.

## States & transitions
Rollback does not change states. Disabled commands return `SYS.UNAVAILABLE`.

## Validation & errors
Restore digest mismatch → `SCH.MIGRATION_FAILED`. Export of non-owned dispute → `SYS.NOT_FOUND`.

## Authorization
Owner export requires `dispute.read` on own disputes. Restore requires `ope_` with dual control.

## Failure, idempotency, concurrency, offline
Export idempotent on (owner, digest). Restore replays from event sequence; partial restore discarded and rerun.

## Privacy, retention, abuse
Export is PRIVATE_PERSONAL: encrypted, 24 h download link (ASSUMPTION), deleted after download or expiry. Exports exclude moderator notes.

## Observability & budgets
Export p95 ≤ 10 s for ≤ 100 disputes. Restore duration recorded.

## Tests
- TEST-PS-070-10-01 (integration): owner export includes own statement and redacts counterparty statement.
- TEST-PS-070-10-02 (contract): export validates against CTR-SCH-001.
- TEST-PS-070-10-03 (integration): backup-restore round trip digest equality.
- TEST-PS-070-10-04 (integration): fired timers are not re-fired after restore.
- TEST-PS-070-10-05 (negative): dispute import refused.

## Acceptance criteria
1. Round-trip digest equality in 100 of 100 fixture runs.
2. No duplicate escalations after restore.
3. Rollback drill keeps all open disputes escalating.

## Assumptions & open decisions
- ASSUMPTION: 24 h export link.
- D07 (PROVISIONAL default, unapproved).
