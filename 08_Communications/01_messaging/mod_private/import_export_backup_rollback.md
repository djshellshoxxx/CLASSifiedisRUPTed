# PS-060-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/01_messaging/mod_private. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R11 export; RET-LEGAL), CTR-SCH-001, CTR-CAP-001, CTR-FED-001 (never federated).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-060-10.R01 | Owner export contains the owner's sent messages, received messages in threads where owner is participant, and thread state, as `messaging.export` 1.0.0. | MVP |
| PS-060-10.R02 | Export contains counterparty messages only as received content; counterparty per-participant state and block records are excluded. | MVP |
| PS-060-10.R03 | Backups encrypted; include threads, messages, blocks, purge state. | MVP |
| PS-060-10.R04 | Restore never restores bodies of messages deleted for all or purged. | MVP |
| PS-060-10.R05 | Restore preserves blocks; restored blocks are re-applied before any send is accepted. | MVP |
| PS-060-10.R06 | Import of messages from other platforms. | Future (not permitted in MVP) |

## Data / schema
`messaging.export`: `export_id` (opaque), `generated_at`, `threads[]` (`thread_id`, `participants`, `messages[]` with `msg_id`, `sender_prf_id`, `body`, `sent_at`), `schema_version`.

## Commands / queries / events
`RequestMessageExport` (owner, idempotent); event `messaging.export_ready` with `export_id` only.

## States & transitions
`queued` → `ready` (24 h) → `expired`.

## Validation & errors
| Code | `retryable` | `message_key` |
|---|---|---|
| `PRIVMSG.EXPORT_RATE_LIMIT` | true | `err.privmsg.export_rate_limit` |
| `PRIVMSG.RESTORE_PURGED_CONFLICT` | false | `err.privmsg.restore_conflict` |

## Authorization
Export: participant for own threads. Restore: operator with dual control; operators do not read bodies during restore (verification uses hashes).

## Failure, idempotency, concurrency, offline
Export idempotent per `export_id`. Restore staged; hash verification; blocks applied before cutover.

## Privacy, retention, abuse
Export file deleted at 24 h. Backups 35 days (ASSUMPTION); legal hold per RET-LEGAL.

## Observability & budgets
`privmsg_export_total{result}`; export p95 ≤ 5 min for 10,000 messages (ASSUMPTION).

## Tests
- TEST-PS-060-10-01 (contract): export validates.
- TEST-PS-060-10-02 (integration): export excludes counterparty per-participant state and blocks.
- TEST-PS-060-10-03 (integration): restore does not reinstate purged bodies.
- TEST-PS-060-10-04 (integration): blocks applied before first send after restore.

## Acceptance criteria
1. Export contains exactly the owner's permitted data.
2. Restore keeps purges and blocks.
3. Export link expires at 24 h.
4. Backup drill recorded.

## Assumptions & open decisions
- ASSUMPTION: backup retention 35 days.
- PROVISIONAL (D10 default, unapproved): encrypted export keyed to owner; recovery in mod_recovery.
