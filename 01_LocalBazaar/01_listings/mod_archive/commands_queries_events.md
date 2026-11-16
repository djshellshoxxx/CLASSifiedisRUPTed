# PS-001-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_archive. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (envelope, `event_type`, idempotency scope), CTR-SCH-001 (schema IDs, versions), CTR-ERR-001 (error envelope), CTR-PRV-001 (classes), CTR-ID-001 (`lst_`, `cas_`, `acc_`, `mod_`).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-001-04.R01 | Commands `archive_listing`, `archive_listing_by_moderator`, `restore_listing`, `restore_listing_by_moderator` are versioned `v1`. Breaking change → `v2` (CTR-SCH-001). | MVP |
| PS-001-04.R02 | Every state-changing command requires `idempotency_key` and `expected_revision`. | MVP |
| PS-001-04.R03 | Queries `list_archived_listings` (owner only; limit 1–50) and `get_archive_state` (owner or case scope). | MVP |
| PS-001-04.R04 | Events `listing.archived` and `listing.restored`, schema `v1.0.0`, one per accepted command. | MVP |
| PS-001-04.R05 | Each event carries the CTR-EVT-001 envelope; `correlation_id` is the command's. | MVP |

## Data / schema
Event payload fields reference [domain_schema.md](domain_schema.md) (PS-001-01). Schema bodies are registered per CTR-SCH-001; this file does not redefine them.

## Commands / queries / events
### Commands
| Command | Required input | Output | Capability | Idempotency scope |
|---|---|---|---|---|
| `archive_listing` | `listing_id`, `expected_revision`, `reason_code`, `idempotency_key`, `occurred_at` | `listing_id`, `revision`, `lifecycle_state`, `archived_at` | `lst.update` | (actor, command, key) |
| `archive_listing_by_moderator` | as above plus `case_ref` | same | `lst.moderate` | same |
| `restore_listing` | `listing_id`, `expected_revision`, `idempotency_key`, `occurred_at` | `listing_id`, `revision`, `lifecycle_state` | `lst.update` | same |
| `restore_listing_by_moderator` | as above plus `case_ref` | same | `lst.moderate` | same |

Request: `{"listing_id":"lst_01HZX3K9Q7M2V8T4W6Y0B5N1CD","expected_revision":7,"reason_code":"SOLD_ELSEWHERE","idempotency_key":"a7Kq_2mZ9xLr0pTw","occurred_at":"2026-11-16T10:00:00.000Z"}`
Response: `{"listing_id":"lst_01HZX3K9Q7M2V8T4W6Y0B5N1CD","revision":8,"lifecycle_state":"ARCHIVED","archived_at":"2026-11-16T10:00:00.412Z"}`

### Queries
| Query | Input | Returns | Max page |
|---|---|---|---|
| `list_archived_listings` | `cursor`, `limit` | owner's ARCHIVED listing summaries | 50 |
| `get_archive_state` | `listing_id` | archive fields visible to actor | 1 |

### Events
| `event_type` | Payload v1.0.0 | `max_data_class` |
|---|---|---|
| `listing.archived` | `listing_id`, `revision`, `archived_by_kind`, `archive_reason_code`, `archive_case_ref` (mod only), `region_cell` | PSEUDONYMOUS |
| `listing.restored` | `listing_id`, `revision`, `restored_by_kind`, `archive_case_ref` (mod only) | PSEUDONYMOUS |

## States & transitions
Events are emitted only on the transitions in [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Input rules and codes: [validation_rules.md](validation_rules.md) (PS-001-02). Error envelope per CTR-ERR-001.

## Authorization
Capabilities per command are listed above; matrix in [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Idempotency scope per CTR-EVT-001 R03. Retry and dedupe: [failure_recovery_idempotency.md](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Free text is forbidden in payloads. Federated export re-keys `correlation_id`, omits `idempotency_key` and pseudonymizes `actor_ref` (CTR-EVT-001 R13).

## Observability & budgets
Each command emits `archive_commands_total`; budgets in [observability_performance.md](observability_performance.md).

## Tests
- TEST-PS-001-04-01 — contract: each command and event validates against its registered schema.
- TEST-PS-001-04-02 — contract: query page size above 50 → `SYS.REQUEST_MALFORMED`.
- TEST-PS-001-04-03 — golden: event payload fixture for `listing.archived` v1.0.0.

## Acceptance criteria
1. All four commands, two queries and two events have contract tests passing.
2. No payload field outside the tables above.
3. Fixtures stored per CTR-SCH-001 R09.

## Assumptions & open decisions
- D01 PROVISIONAL: event envelope and federation export rules.
- D08 PROVISIONAL: offline commands carry the same key as online.
- ASSUMPTION: idempotency key 16–64 chars.
