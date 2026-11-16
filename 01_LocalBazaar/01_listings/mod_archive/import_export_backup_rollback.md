# PS-001-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_archive. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R06 retention, R11 portability, R12 deletion record), CTR-FED-001 (import, export, R01, R05, R08), CTR-SCH-001 (R07 upcast on read, R08 lossless, R09 golden fixtures), CTR-EVT-001 (R08 hash chain).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-001-10.R01 | Owner portability export includes own archived listings with archive fields at PSEUDONYMOUS class. Case IDs are excluded. | MVP |
| PS-001-10.R02 | Backup restore preserves `lifecycle_state`, `revision`, `archived_at`. A restore that violates PS-001-01 invariants aborts entirely. | MVP |
| PS-001-10.R03 | Release rollback never rewrites stored event bytes (CTR-SCH-001 R07). Readers accept `listing.archived` v1.x under MINOR rules. | MVP |
| PS-001-10.R04 | Feature flag `archive.enabled` off: archived listings stay hidden; restore returns `SYS.UNAVAILABLE` (retryable). No state change. | MVP |
| PS-001-10.R05 | Federated archive events imported only when signed, deduped on (`origin_node`, `event_id`), and peer is trusted (CTR-FED-001 R01, R05). | Future |
| PS-001-10.R06 | Listing deletion produces `aud_` completion record with IDs and counts only (CTR-PRV-001 R12). | MVP |

## Data / schema
| Artifact | Format | Contents | Excludes |
|---|---|---|---|
| Owner portability export | JSON per CTR-SCH-001 | `listing_id`, `lifecycle_state`, `revision`, `archived_at`, `archive_reason_code` | `archive_case_ref`; moderator `archived_by_ref` |
| Federated archive update | signed envelope (CTR-EVT-001 R05) | `listing_id`, `revision`, `lifecycle_state` | owner `acc_`; reason code (ASSUMPTION) |

## Commands / queries / events
Export of archive state is a read path; no new command. Import uses the event contracts in [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Restore from backup replays events forward; state never moves backward without a new event. Revision is monotonic.

## Validation & errors
Import validation failure → `SCH.UNKNOWN_VERSION` for unknown MAJOR; invariant violation → abort with `SYS.INTERNAL` alert to F15.

## Authorization
Export is owner-only (CTR-CAP-001 R11). Operator access to backups requires dual control for PRIVATE_PERSONAL data (CTR-CAP-001 R07).

## Failure, idempotency, concurrency, offline
| Situation | Action |
|---|---|
| Restore invariant violation | abort; alert F15; no partial apply |
| Export after deletion | `SYS.NOT_FOUND`; deletion record only |
| Duplicate imported event | `duplicate` status; not reprocessed (CTR-FED-001 R05) |
| Migration `1.0.0` → `1.1.0` (MINOR, optional field) | golden fixtures both paths (CTR-SCH-001 R09); lossy migration forbidden for signed evidence |

Rollback plan: set `archive.enabled` off (R04), keep events, redeploy previous build. No deletion step.

## Privacy, retention, abuse
Backups follow RET-OPS and RET-AUD schedules (CTR-PRV-001 R06). Exports are logged as privileged reads only when operator-initiated.

## Observability & budgets
Restore and import counters by outcome; invariant-abort count alerts on any non-zero value.

## Tests
- TEST-PS-001-10-01 — integration: export contains no case ID and no moderator `acc_`.
- TEST-PS-001-10-02 — restore drill: archived and revision values survive backup restore.
- TEST-PS-001-10-03 — golden: `1.0.0` → `1.1.0` migration fixture both directions.
- TEST-PS-001-10-04 — flag-off drill: restore returns `SYS.UNAVAILABLE`, no state change.

## Acceptance criteria
1. Restore drill passes with zero invariant violations.
2. Golden fixtures exist for every supported migration path.
3. Flag-off rollback needs no data deletion.

## Assumptions & open decisions
- D07 PROVISIONAL: backup and export retention follow the defaults in PS-001-07.
- D01 PROVISIONAL: federated import rules (Future).
- ASSUMPTION: export integrity via hash of canonical JSON; method pending CTR-FED-001 review.
