# PS-001-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_archive. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R06 retention, R11 portability, R12 deletion record), CTR-FED-001 (import and export, R08), CTR-SCH-001 (R07 upcast on read, R08 lossless, R09 golden fixtures), CTR-EVT-001 (R08 hash chain). **Decisions:** D01, D07 (defaults PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-001-10.R01 | Owner export (portability) includes own archived listings with archive fields at PSEUDONYMOUS class. Moderator case IDs are excluded. | MVP |
| PS-001-10.R02 | Backup restore preserves `lifecycle_state`, `revision`, `archived_at`. Restored archive state must pass PS-001-01 invariants or the restore aborts. | MVP |
| PS-001-10.R03 | Release rollback never rewrites stored event bytes (CTR-SCH-001 R07). Old readers accept `listing.archived` v1.x via MINOR rules. | MVP |
| PS-001-10.R04 | Feature flag `archive.enabled` off: archived listings stay hidden; restore returns `SYS.UNAVAILABLE` (retryable true). No state change. | MVP |
| PS-001-10.R05 | Federated archive events are imported only when signed, dedupe on (`origin_node`, `event_id`), and the peer is trusted (CTR-FED-001 R01, R05). | Future |
| PS-001-10.R06 | Deleted listing produces deletion completion record `aud_` with IDs and counts only (CTR-PRV-001 R12). | MVP |

## Export and import shape
| Artifact | Format | Contents | Excludes |
|---|---|---|---|
| Owner portability export | JSON per CTR-SCH-001 | `listing_id`, `lifecycle_state`, `revision`, `archived_at`, `archive_reason_code` | `archive_case_ref`, `archived_by_ref` of moderator |
| Federated archive update | signed envelope (CTR-EVT-001 R05) | `listing_id`, `revision`, state | owner `acc_`, reason code (ASSUMPTION) |

## Backup, rollback and migration
- Backups expire by RET-OPS/RET-AUD schedules. A restore to an earlier point replays events forward; state never moves backward without a new event (revision monotonic).
- Migration `1.0.0` → `1.1.0` (MINOR, add optional field) needs golden fixtures for both paths (CTR-SCH-001 R09). Lossy migration forbidden for signed evidence.
- Rollback plan: disable `archive.enabled` (R04), keep events, redeploy previous build. No data deletion step.

## Failure and reversal
| Situation | Action |
|---|---|
| Restore finds invariant violation | Abort restore; alert F15; do not partially apply |
| Export request after deletion | `SYS.NOT_FOUND`; deletion record only |
| Import of duplicate event | `duplicate` status, no reprocess (CTR-FED-001 R05) |

Assumption: export file integrity via hash of canonical JSON (ASSUMPTION; method pending CTR-FED-001 review).
