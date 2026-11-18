# PS-061-10 — import export backup rollback
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/01_messaging/mod_threads. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R06, R07, R11, R12), CTR-SCH-001 (R07, R08), CTR-EVT-001 (R08)

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-061-10.R01 | Owner export (`thr.export`) returns own messages and attachments as JSON plus files, in ≤ 24 h of request (ASSUMPTION). | MVP |
| PS-061-10.R02 | Counterparty content in export is redacted to `prf_` and placeholder text; counterparty `acc_` never exported (CTR-PRV-001 R11). | MVP |
| PS-061-10.R03 | Backups are encrypted and expire on the backup schedule; restore replays redactions and deletions (CTR-PRV-001 R06). | MVP |
| PS-061-10.R04 | Schema migrations are additive within MAJOR 1; no in-place rewrite of stored messages (CTR-SCH-001 R07). | MVP |
| PS-061-10.R05 | Feature kill switch `threads.send.enabled` disables sends, keeps reads and redactions; never deletes data. | MVP |
| PS-061-10.R06 | Rollback restores previous schema reader within 15 min; forward-written `message.v1` rows remain readable. | MVP |

## Data / schema
Export manifest: `{"export_id":"…","threads":[…],"messages":[{"message_id":"msg_…","sent_at":"…","body_text":"…","sender":"prf_…|self"}],"attachments":[{"attachment_id":"att_…","sha256":"…","file":"…"}],"schema_version":"1.0.0"}`. Export format is `json-1.0.0` with a SHA-256 manifest digest.

## Commands / queries / events
`thr.export` emits `export.completed` (IDs and counts only). Import of threads from other platforms is out of scope (Future).

## States & transitions
Export job: `requested` → `building` → `ready` (link valid 24 h) → `expired`. Failure → `failed` (retry once).

## Validation & errors
| Code | Retryable | Category / HTTP | Note |
|---|---|---|---|
| THREADS.EXPORT_NOT_READY | true | precondition_failed / 412 | Job building. |
| THREADS.EXPORT_EXPIRED | false | gone / 410 | Link past 24 h. |

## Authorization
Export is `self` scope only (PS-061-05). Operators cannot export a user's threads without a case-scoped grant and dual control (CTR-PRV-001 R07, CTR-CAP-001 R07).

## Failure, idempotency, concurrency, offline
Export job idempotent per (account, request day). Backup restore into a state where a thread is `locked` keeps the lock. Rollback never re-opens a locked thread.

## Privacy, retention, abuse
Export files are PRIVATE_PERSONAL; delivered only through authenticated download; deleted 24 h after expiry. Backups: encrypted, RET-PRIV alignment, excluded from analytics restores.

## Observability & budgets
Metrics: `threads_export_duration_seconds`, `threads_restore_replayed_deletions_total`. Alert on any restore that re-exposes a deleted message (should be zero).

## Tests
- TEST-PS-061-10-01 (export): export contains own content; counterparty `acc_` absent (grep).
- TEST-PS-061-10-02 (backup): delete message, restore from pre-delete backup → message absent after replay.
- TEST-PS-061-10-03 (rollback): deploy rollback to previous reader; `message.v1` rows still read.
- TEST-PS-061-10-04 (kill switch): with `threads.send.enabled` off, `msg.send` returns `SYS.UNAVAILABLE`; reads succeed; no rows deleted.

## Acceptance criteria
1. Export excludes counterparty identifiers (TEST-PS-061-10-01).
2. Restore never resurrects deleted or redacted content (TEST-PS-061-10-02).

## Assumptions & open decisions
- ASSUMPTION: 24 h export window and link validity.
- D07 (retention): PROVISIONAL (D07 default, unapproved).
- OPEN: migration path to a successor schema MAJOR 2 (no owner yet; CTR-SCH-001).
