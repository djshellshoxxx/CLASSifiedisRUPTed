# PS-007-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/02_listing_types/mod_wanted. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (verification order, R02, R05–R08, R10), CTR-EVT-001 (R05 signatures), CTR-SCH-001 (R07–R08 migration rules), CTR-PRV-001 (R07, R11), CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-007-10.R01 | Owner export: own posts in all states except `tombstoned`, as one JSON document with `schema_id` and version, plus SHA-256 digest. Other users' data is never included. | MVP |
| PS-007-10.R02 | Federated import: only from a trusted peer, each event signed (CTR-EVT R05). Unsigned or unverifiable events are rejected. Imported posts get `provenance.source_kind = federated_import`. | MVP |
| PS-007-10.R03 | Federated export: `published` posts with `federate = true` only. `owner_account_id` and `idempotency_key` omitted; `actor_ref` replaced per audience. | MVP |
| PS-007-10.R04 | Backups daily, encrypted, RPO ≤ 24 h. Restore drill quarterly. Restored posts run expiry sweep before serving. | MVP |
| PS-007-10.R05 | No schema rollback for signed records. Schema change is forward-fix only (CTR-SCH R07). | MVP |
| PS-007-10.R06 | Tombstones propagate to federation peers through `listing.tombstoned`. | MVP |
| PS-007-10.R07 | Cross-node search sync of wanted posts. | Future |

## Data / schema
Export document:
```json
{"schema_id":"listing.wanted_fields","schema_version":"1.0.0","exported_at":"2026-11-16T09:00:00.000Z",
 "items":[{"id":"lst_…","status":"paused","title":"…"}],"sha256":"…"}
```
Maximum 10 000 items per file; larger exports are chunked with a cursor. Import batches ≤ 100 events and ≤ 1 MiB (CTR-FED R10).

## Commands / queries / events
Export: `wanted.export(scope, cursor)` (owner, `cap.wanted.export`). Federated import and export use CTR-FED-001 verification order. Duplicates use `(origin_node, event_id)` (CTR-FED R05). Equivocation returns the FED code defined in CTR-FED-001 R06.

## States & transitions
Imported posts enter the state given in their event. A federated post never enters `published` without the local expiry check (`expires_at` > now).

## Validation & errors
Imported fields pass the PS-007-02 rules as if local. Extra fields return `WANTED.FIELD_NOT_ALLOWED`. Signature and peer errors use FED codes from CTR-FED-001.

## Authorization
Owner export: owner only. Federated export: peer must be `trusted` and the feature flag enabled (CTR-FED R01). Restore: operator with dual control (ASSUMPTION).

## Failure, idempotency, concurrency, offline
Export jobs are idempotent per (owner, request ID) and resumable by cursor. Import is idempotent by dedupe key.

Rollback plan:
| Scenario | Action | Target |
|---|---|---|
| Bad validation release | Disable new publishes with feature flag; existing posts unchanged | RTO 15 min |
| Corrupt rows | Restore backup to point T; replay outbox events after T (events are immutable) | RTO 4 h (ASSUMPTION) |
| Bad federated batch | Quarantine peer; origin tombstones | Immediate |

## Privacy, retention, abuse
Export contains only the owner's data. Federated export is PUBLIC or PSEUDONYMOUS per-audience only. Backups encrypted; backups excluded from analytics restores (CTR-PRV matrix).

## Observability & budgets
Metrics: export job duration; import rejects by code; restore drill result; backup age. Export of 10 000 items ≤ 60 s p95 (ASSUMPTION).

## Tests
- TEST-PS-007-10-01 (integration): export → import into empty database yields identical canonical JSON digest.
- TEST-PS-007-10-02 (negative): unsigned federated event rejected per CTR-FED verification order.
- TEST-PS-007-10-03 (integration): federated export omits `owner_account_id` and `idempotency_key`; correlation re-keyed.
- TEST-PS-007-10-04 (restore drill): restore to T − 1 h; sweep; no post served past `expires_at`.
- TEST-PS-007-10-05 (e2e): tombstone propagates to peer and removes post from imported index.

## Acceptance criteria
1. Export round trip digest equal.
2. Zero `owner_account_id` in federated outputs.
3. Restore drill meets RPO and RTO above; result recorded.
4. Feature-flag rollback tested before release.

## Assumptions & open decisions
- D01 PROVISIONAL (Dxx default, unapproved): versioned signed envelopes; explicit opt-in.
- D07 PROVISIONAL (Dxx default, unapproved): retention applies to backups and exports.
- D10 PROVISIONAL (Dxx default, unapproved): owner-held keys for signed exports; recovery per F07.
