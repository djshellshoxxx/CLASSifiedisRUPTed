# PS-001-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_archive. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R01 `recorded_at`, R02 revision, R03 idempotency), CTR-ERR-001 (retryable, `retry_after_ms`), CTR-SCH-001 (R06 unknown MAJOR), CTR-PRV-001 (RET-OPS, RET-EPH).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-001-06.R01 | Idempotency scope = (actor, command type, key). Same key and digest within 7 days returns the original response; no new event. | MVP |
| PS-001-06.R02 | Same key, different digest → `EVT.IDEMPOTENCY_KEY_REUSED`. No state change. | MVP |
| PS-001-06.R03 | Retry after ambiguous timeout reuses the key. Exactly one `listing.archived` event results (fault-injection test PS-001-09). | MVP |
| PS-001-06.R04 | Archive is reversible. No saga: compensation of an accepted archive is an explicit restore. | MVP |
| PS-001-06.R05 | Offline archive and restore queue locally until relay acknowledgement (D08 PROVISIONAL). Queue survives app restart. | MVP |
| PS-001-06.R06 | Server command timeout 5 s. Client timeout 10 s, then retry with backoff: 1 s base, ×2, cap 60 s, ±20 % jitter (ASSUMPTION). | MVP |
| PS-001-06.R07 | Revision conflict is never auto-resolved. Client shows "listing changed" and re-reads before any new command. | MVP |

## Data / schema
Idempotency record: key, actor, command type, request digest, original response, created_at. Retained per RET-OPS (7 days).

## Commands / queries / events
Retry semantics apply to all four commands in [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Retries cannot cause a transition twice: a repeated archive on ARCHIVED returns `ARCHIVE.INVALID_STATE` (PS-001-03).

## Validation & errors
Retryable flags per code in [validation_rules.md](validation_rules.md). Only `ARCHIVE.ACTIVE_REFERENCE` and `ARCHIVE.TRANSITION_RATE_LIMITED` are retryable.

## Authorization
Authorization is re-checked on every retry (CTR-CAP-001 R09; no cache for writes).

## Failure, idempotency, concurrency, offline
| Failure | Behavior | Recovery |
|---|---|---|
| Timeout after commit | client retries same key | idempotency record returns original result |
| Crash mid-transaction | rollback; no state, no event | client retry |
| Event append fails after state write | single commit rolls back (PS-001-03 R02) | retry |
| Index update fails after commit | state is authoritative; index lags | reconcile job against aggregate (ASSUMPTION, nightly) |
| Unknown MAJOR in queued command (CTR-SCH-001 R06) | kept pending, "client upgrade required" | never discarded |
| Queue full (50 entries, ASSUMPTION) | new archive blocked locally; older entries kept | user action |
| Second device edits listing while archive queued | `EVT.REVISION_CONFLICT` | queued command fails; not retried silently |
| Key older than 7 days | treated as new | safe: state guard still applies |

Concurrency: writes serialize on the `lst_` lock. Archive vs. cycle acceptance: the active-reference check runs under the same lock, so exactly one wins (D04 PROVISIONAL).

Backup, rollback and migration rules: [import_export_backup_rollback.md](import_export_backup_rollback.md).

## Privacy, retention, abuse
Idempotency records hold no content, only digests. Queue entries are RET-EPH and purged on logout or account switch (S3-10 in CTR-PRV-001).

## Observability & budgets
`archive_pending_queue_depth` (PS-001-08 R04); retry counts by code.

## Tests
- TEST-PS-001-06-01 — integration: replay returns original response; one event.
- TEST-PS-001-06-02 — fault injection: timeout after commit, retry, one event.
- TEST-PS-001-06-03 — offline: queue survives restart and flushes once.
- TEST-PS-001-06-04 — integration: 8-day-old key treated as new; state guard rejects duplicate.

## Acceptance criteria
1. Duplicate delivery never creates a second event (test -01 and -02 pass 100 %).
2. Queue entries survive restart in the test harness.
3. No auto-resolution of revision conflicts.

## Assumptions & open decisions
- D08 PROVISIONAL: local queue until relay acknowledgement.
- D04 PROVISIONAL: no compensation needed; active-reference guard.
- D01 PROVISIONAL: federated dedupe on (`origin_node`, `event_id`).
- ASSUMPTION: backoff parameters, 50-entry queue, 9-day reconcile window.
