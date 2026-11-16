# PS-001-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_archive. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (envelope, event_type, idempotency scope), CTR-SCH-001 (schema IDs and versions), CTR-ERR-001 (error envelope), CTR-PRV-001 (classes), CTR-ID-001 (`lst_`, `cas_`, `acc_`, `mod_`). **Decisions:** D01 (federation of events), D08 (offline queue) (defaults PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-001-04.R01 | Commands `archive_listing`, `archive_listing_by_moderator`, `restore_listing`, `restore_listing_by_moderator` are versioned `v1`. Breaking change → `v2` (CTR-SCH-001). | MVP |
| PS-001-04.R02 | Each state-changing command requires `idempotency_key` and `expected_revision`. | MVP |
| PS-001-04.R03 | Queries `list_archived_listings` (owner only, cursor, limit ≤ 50) and `get_archive_state` (owner or case scope). | MVP |
| PS-001-04.R04 | Events `listing.archived` and `listing.restored`, schema `v1.0.0`, one per accepted command. | MVP |
| PS-001-04.R05 | Each event carries the CTR-EVT-001 envelope with `correlation_id` from the command. | MVP |

## Commands
| Command | Input (required) | Output | Capability | Idempotency scope |
|---|---|---|---|---|
| `archive_listing` | `listing_id`, `expected_revision`, `reason_code`, `idempotency_key`, `occurred_at` | `listing_id`, `revision`, `lifecycle_state`, `archived_at` | `lst.update` | (actor, command, key) |
| `archive_listing_by_moderator` | adds `case_ref` | same | `lst.moderate` | same |
| `restore_listing` | `listing_id`, `expected_revision`, `idempotency_key`, `occurred_at` | `listing_id`, `revision`, `lifecycle_state` | `lst.update` | same |
| `restore_listing_by_moderator` | adds `case_ref` | same | `lst.moderate` | same |

Request example:
```json
{"listing_id":"lst_01HZX3K9Q7M2V8T4W6Y0B5N1CD","expected_revision":7,"reason_code":"SOLD_ELSEWHERE","idempotency_key":"a7Kq_2mZ9xLr0pTw","occurred_at":"2026-11-16T10:00:00.000Z"}
```
Response example: `{"listing_id":"lst_01HZX3K9Q7M2V8T4W6Y0B5N1CD","revision":8,"lifecycle_state":"ARCHIVED","archived_at":"2026-11-16T10:00:00.412Z"}`

## Queries
| Query | Input | Returns | Max page |
|---|---|---|---|
| `list_archived_listings` | `cursor`, `limit` (1–50) | owner's ARCHIVED listing summaries | 50 |
| `get_archive_state` | `listing_id` | archive fields visible to actor (CTR-CAP-001 R10) | 1 |

## Events
| `event_type` | Payload (v1.0.0) | `max_data_class` |
|---|---|---|
| `listing.archived` | `listing_id`, `revision`, `archived_by_kind`, `archive_reason_code`, `archive_case_ref` (mod only), `region_cell` | PSEUDONYMOUS |
| `listing.restored` | `listing_id`, `revision`, `restored_by_kind`, `archive_case_ref` (mod only) | PSEUDONYMOUS |

Payloads hold no `acc_` ID for federated export; CTR-EVT-001 R13 pseudonymizes it. Free text is forbidden.
