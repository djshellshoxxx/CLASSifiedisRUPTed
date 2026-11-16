# PS-004-10 — import, export, backup and rollback
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_publish. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (owner export R11, backup restore R06, deletion R12), CTR-FED-001 (inbound import pipeline, tombstones R07), CTR-EVT-001 (immutability R08, upcast), CTR-SCH-001 (migration hooks R07, R09). **Pending:** PENDING CTR-LST-001 (listing aggregate export shape, F01).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-004-10.R01 | Owner export includes `state`, `published_at`, `expires_at`, `duration_days`, `hold.reason_code`, `hold.placed_at`. It excludes moderator identity, `case_id` and risk scores. | MVP |
| PS-004-10.R02 | Imported federated listings (`provenance.source_kind = federated_import`) are read-only `published` aggregates. `lst.publish` on them returns PUB.INVALID_STATE. | MVP |
| PS-004-10.R03 | Backup restore replays tombstones and holds before serving (CTR-PRV R06). A restored `held_review` stays held. A restored `published` listing past `expires_at` is not republished here. | MVP |
| PS-004-10.R04 | Publish can be disabled by feature flag `lst.publish.enabled` (owner F15 configuration, name PENDING). With the flag off, V0 returns SYS.UNAVAILABLE (retryable); drafts are untouched; no events are emitted. | MVP |
| PS-004-10.R05 | Wrongful publication is corrected by mod_archive (archive) or a hold where the state allows. The publish event stays; federated copies are tombstoned (CTR-FED-001 R07). | MVP |
| PS-004-10.R06 | `listing.published` 1.x → 2.0.0 uses a pure, idempotent upcast on read, with golden fixtures per supported from-version (CTR-SCH-001 R07, R09). | MVP |
| PS-004-10.R07 | Stored events are never rewritten. Account deletion redacts payloads to digest and keeps the envelope (CTR-EVT-001 R08; CTR-PRV-001 R12). | MVP |

## Export format
JSON, UTF-8, RFC3339 UTC with milliseconds, `schema_version` included on every object. One object per listing. Export is generated on owner request only (CTR-PRV-001 R11).

## Rollback and recovery
| Action | Effect | Data preserved |
|---|---|---|
| Disable publish flag | New `lst.publish` rejected; in-flight commits complete or roll back atomically | All events and drafts |
| Revert module release | Upcast hooks stay; no schema rewrite | All stored bytes |
| Restore from backup | Deletions and holds replayed first (BT-04) | Events after restore point replayed from log where available |

Backup RPO and RTO are owned by 15_Platform/03_operations/mod_backups (PENDING). This module adds no separate backup store.

## Assumptions & open decisions
- ASSUMPTION: feature flag name `lst.publish.enabled`; owner F15 configuration.
- PROVISIONAL (D01 default, unapproved): federated import via signed envelopes and F11 pipeline only.
- PROVISIONAL (D10 default, unapproved): export and portability keep the user's key-bound identity; no re-issue of `lst_` IDs.
- PROVISIONAL (D07 default, unapproved): deletion and export follow RET-ACC and RET-LEGAL.

## Tests
- TEST-PS-004-10-01 (export): owner export contains the R01 fields and no moderator or case field.
- TEST-PS-004-10-02 (import): `lst.publish` on a federated listing returns PUB.INVALID_STATE.
- TEST-PS-004-10-03 (restore): backup restored with a tombstone and a hold; tombstoned content absent; held listing still held.
- TEST-PS-004-10-04 (flag): flag off → SYS.UNAVAILABLE, no event, no draft change.
- TEST-PS-004-10-05 (migration): golden fixtures for 1.x → 2.0.0 upcast are idempotent and lossless.

## Acceptance criteria
1. TEST-PS-004-10-01 to -05 pass in CI.
2. No code path writes to or deletes a stored event (static check).
3. Rollback drill with the flag off leaves all drafts and events unchanged.
