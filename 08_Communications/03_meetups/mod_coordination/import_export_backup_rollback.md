# PS-064-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/03_meetups/mod_coordination. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R11 export: LOCATION_PRECISE only on explicit owner request; RET-LOC), CTR-SCH-001, CTR-CAP-001, CTR-FED-001 (never federated).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-064-10.R01 | Owner export includes owner's meetup windows, states and place text; LOCATION_PRECISE points are excluded unless the owner explicitly requests them. | MVP |
| PS-064-10.R02 | Counterparty points, counterparty place text and moderator notes are never exported. | MVP |
| PS-064-10.R03 | Backups encrypted; include meetup records; point ciphertext backed up only within RET-LOC and purged with the rest. | MVP |
| PS-064-10.R04 | Restore never re-activates an expired point; expired disclosures are not restored. | MVP |
| PS-064-10.R05 | Restore re-runs expiry sweep before the service accepts traffic. | MVP |
| PS-064-10.R06 | Import of meetup records from other platforms. | Future (not permitted in MVP) |

## Data / schema
`meetup.export` 1.0.0: `export_id`, `generated_at`, `meetups[]` (`meetup_id`, `exchange_ref`, `window_start`, `window_end`, `state`, `venue_ref`, `place_text`, optional `points[]` only when explicitly requested), `schema_version`.

## Commands / queries / events
`RequestMeetupExport` (owner; `include_points` boolean, default false); event `meetup.export_ready` with `export_id` only.

## States & transitions
`queued` → `ready` (24 h) → `expired`.

## Validation & errors
| Code | `retryable` | `message_key` |
|---|---|---|
| `COORD.EXPORT_RATE_LIMIT` | true | `err.coord.export_rate_limit` |
| `COORD.RESTORE_EXPIRED_POINT` | false | `err.coord.restore_expired` |

## Authorization
Export: owner (`meetup.read`); `include_points` requires explicit confirmation step. Restore: operator with dual control.

## Failure, idempotency, concurrency, offline
Export idempotent per `export_id`. Restore staged; expiry sweep before cutover.

## Privacy, retention, abuse
Export deleted at 24 h (RET-EPH). Export with points is LOCATION_PRECISE: link not shareable in notifications; 24 h expiry. Backups 35 days (ASSUMPTION).

## Observability & budgets
`coord_export_total{result,include_points}`; no coordinates.

## Tests
- TEST-PS-064-10-01 (contract): export validates.
- TEST-PS-064-10-02 (integration): default export has no points.
- TEST-PS-064-10-03 (integration): restore does not reinstate expired points.
- TEST-PS-064-10-04 (integration): counterparty place text absent from export.

## Acceptance criteria
1. Default export contains no points.
2. Restore keeps expiry.
3. Export link expires at 24 h.
4. Backup drill recorded.

## Assumptions & open decisions
- ASSUMPTION: backup retention 35 days.
- PROVISIONAL (D05 default, unapproved): points exported only on explicit request.
