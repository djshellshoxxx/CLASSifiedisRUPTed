# PS-001-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_archive. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (idempotency scope R03, revision R02, `recorded_at` R01), CTR-ERR-001 (retryable, `retry_after_ms`), CTR-ID-001 (`cor_`, `req_`), CTR-PRV-001 (RET-OPS, RET-EPH). **Decisions:** D08 (offline queue), D01 (dedupe of federated events), D04 (no compensation required) (defaults PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-001-06.R01 | Idempotency key scope = (actor, command type, key). Same key and digest within 7 days returns the original response with no new event. | MVP |
| PS-001-06.R02 | Same key, different digest → `EVT.IDEMPOTENCY_KEY_REUSED`. No state change. | MVP |
| PS-001-06.R03 | Client retries after ambiguous timeout use the same key. Retry does not create a second `listing.archived` event. Verified by fault injection (PS-001-09). | MVP |
| PS-001-06.R04 | Archive is reversible. No saga or compensation is needed; compensation of an accepted archive is an explicit restore. | MVP |
| PS-001-06.R05 | Offline archive and restore requests queue locally until relay acknowledgement (D08 default). Queue entries survive app restart. | MVP |
| PS-001-06.R06 | Server timeout 5 s per command. Client timeout 10 s, then queue retry with exponential backoff (1 s base, ×2, cap 60 s, ±20 % jitter, ASSUMPTION). | MVP |
| PS-001-06.R07 | Revision conflict is never auto-resolved. Client shows "listing changed" and re-reads before any new command. | MVP |

## Failure modes
| Failure | Detection | Behavior | Recovery |
|---|---|---|---|
| Commit ambiguous (timeout after write) | client no response | client retries same key | idempotency record returns original result |
| Server crash mid-transaction | DB rollback | no state, no event | client retry |
| Event append fails after state write | transaction boundary | rollback (single commit, PS-001-03 R02) | retry |
| Index update fails after commit | async indexer lag | listing stays hidden or visible per state; index reconciled | nightly reconcile job against aggregate (ASSUMPTION) |
| Offline with unknown-major queued command (CTR-SCH-001 R06) | version check | command kept pending, marked "client upgrade required" | never discarded |
| Pending queue full (limit 50 entries, ASSUMPTION) | client check | new archive blocked with local message; no drop of older entries | user action |
| Listing edited on second device while archive queued | `EVT.REVISION_CONFLICT` | queued command fails; not retried | user re-confirms on fresh revision |

## Concurrency
Writes serialize on the `lst_` lock. Archive vs. edit race: the revision check decides. Archive vs. cycle acceptance: the active-reference check (PS-001-02 R04) runs under the same lock, so exactly one wins.

## Recovery
Idempotency records are kept 7 days (RET-OPS). A key older than 7 days is treated as new, which is safe because the state guard (PS-001-03) still applies: a repeated archive on an ARCHIVED listing returns `ARCHIVE.INVALID_STATE`.
