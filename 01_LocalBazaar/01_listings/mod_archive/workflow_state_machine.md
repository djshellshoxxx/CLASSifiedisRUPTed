# PS-001-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_archive. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (`listing.archived`, `listing.restored`, revision), CTR-CAP-001 (case scope), CTR-ERR-001. **Pending:** CTR-LST-001 (active references), CTR-NTF-001 (owner notice on moderator archive; not yet written). **Decisions:** D08, D04 (defaults PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-001-03.R01 | Only the transitions in the table below exist. Any other (state, event) pair is rejected with `ARCHIVE.INVALID_STATE`. | MVP |
| PS-001-03.R02 | Each accepted transition is one aggregate commit: state change, `revision` +1, one event, idempotency record. All or nothing. | MVP |
| PS-001-03.R03 | Owner archive and restore: at most 10 accepted transitions per listing per rolling 24 h (ASSUMPTION). Excess → `ARCHIVE.TRANSITION_RATE_LIMITED`. | MVP |
| PS-001-03.R04 | No terminal state. Owner-archived listings are restorable without limit other than R03. | MVP |
| PS-001-03.R05 | Archive removes listing from public discovery within 60 s p95 (ASSUMPTION). Restore re-indexes within 60 s p95. | MVP |
| PS-001-03.R06 | Time-based auto-expiry of archives is deferred. | Future |

## States & transitions
States: `PUBLISHED`, `ARCHIVED` (module view; other F01 states owned by mod_publish and not reachable from this module).

| From | Event (command) | Guard | To | Side effect |
|---|---|---|---|---|
| PUBLISHED | `archive_listing` (owner) | `lst.update`; revision match; reason valid; no active reference (PS-001-02 R04) | ARCHIVED | Set archive fields with `archived_by_kind=user`; emit `listing.archived`; de-index |
| PUBLISHED | `archive_listing_by_moderator` | `lst.moderate`; active case; reason `MODERATION_HOLD` | ARCHIVED | `archived_by_kind=mod`, `archive_case_ref` set; emit; owner notice (CTR-NTF-001 pending) |
| ARCHIVED | `restore_listing` (owner) | `archived_by_kind=user`; revision match; publish validators pass; R03 budget | PUBLISHED | Clear archive fields; emit `listing.restored`; re-index; `published_at` unchanged |
| ARCHIVED | `restore_listing` (owner) | validators fail | ARCHIVED | No write, no event; return `ARCHIVE.RESTORE_VALIDATION_FAILED` |
| ARCHIVED | `restore_listing` (owner) | `archived_by_kind=mod` | ARCHIVED | No write, no event; `ARCHIVE.MODERATION_LOCKED` |
| ARCHIVED | `restore_listing_by_moderator` | `lst.moderate`; case closed without sanction | PUBLISHED | As owner restore; event `actor_kind=mod` |
| any | command with same key and digest | key exists in window (PS-001-06) | unchanged | Return original result; no event |
| any | command with same key, different digest | key exists | unchanged | `EVT.IDEMPOTENCY_KEY_REUSED` |

## Concurrency and timing
- Transitions serialize on the `lst_` aggregate lock (CTR-EVT-001 R02). Second concurrent writer receives `EVT.REVISION_CONFLICT`.
- Server commit timeout: 5 s. On ambiguous outcome the client retries with the same key (PS-001-06).
- Offline: the client holds the command in a local pending queue (D08). The queued item has no server state until relay acknowledgement.
