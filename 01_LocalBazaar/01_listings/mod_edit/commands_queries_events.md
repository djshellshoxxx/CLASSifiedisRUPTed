# PS-003-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_edit. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (envelope, idempotency R03), CTR-SCH-001 (`listing.updated` registry entry), CTR-ERR-001, CTR-CAP-001, CTR-ID-001.

**Decision labels:** Federation of `listing.updated` PROVISIONAL (D01 default, unapproved). Price and currency fields PROVISIONAL (D03 default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-003-04.R01 | `listing.edit` v1.0.0 is the only write command. One listing per command; no batch form. | MVP |
| PS-003-04.R02 | `listing.get_for_edit` v1.0.0 returns editable fields, `state`, `revision`, `has_open_offers` (boolean only). It never returns offer contents. | MVP |
| PS-003-04.R03 | `listing.updated` v1.0.0 payload carries field names and flags, not field values. | MVP |
| PS-003-04.R04 | Every command carries `idempotency_key` (26-char Crockford body) and `expected_revision`. | MVP |
| PS-003-04.R05 | Response of `listing.edit` returns the new `revision`, `changed_fields` and `material`. | MVP |

## Data / schema
Command request: `{listing_id: "lst_…", expected_revision: int≥1, idempotency_key: string, changes: object (1–6 keys)}`. Event payload `listing.updated` 1.0.0: `{changed_fields: [enum title|description|category_id|region_cell|price|currency], material: bool, state: draft|published}`. `max_data_class` = PUBLIC. Event type `listing.updated` matches the CTR-EVT-001 R10 pattern. Schema registered per CTR-SCH-001 R01.

## Commands / queries / events
| Name | Kind | Capability | Idempotency | Errors |
|---|---|---|---|---|
| `listing.edit` v1.0.0 | command | `lst.update` | key required; 7-day record | `EDIT.FIELD_NOT_EDITABLE`, `EDIT.VALIDATION_FAILED`, `EDIT.STATE_NOT_EDITABLE`, `EDIT.MATERIAL_CHANGE_BLOCKED`, `EVT.REVISION_CONFLICT`, `EVT.IDEMPOTENCY_KEY_REUSED`, `SYS.NOT_FOUND`, `SYS.RATE_LIMITED`, `SYS.UNAVAILABLE` |
| `listing.get_for_edit` v1.0.0 | query | `lst.read` | n/a | `SYS.NOT_FOUND`, `SYS.UNAUTHENTICATED` |
| `listing.updated` v1.0.0 | event | n/a | `event_id` | n/a |

## States & transitions
Event emitted only by the transitions in [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Field validation per [validation_rules.md](validation_rules.md). Envelope errors per CTR-ERR-001.

## Authorization
`lst.update` for command; `lst.read` for query. Owner relation only. See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Scope per CTR-EVT-001 R03. Replay returns the original `revision` and response. See [failure_recovery_idempotency.md](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Event carries no values (R03). Subscribers read current values from the owning store under their own capability.

## Observability & budgets
Per-command metrics in [observability_performance.md](observability_performance.md).

## Tests
- TEST-PS-003-04-01 (contract): `listing.edit` request and response match schema; unknown fields rejected.
- TEST-PS-003-04-02 (contract): `listing.updated` payload contains no field values.
- TEST-PS-003-04-03 (integration): replay with same key returns same `revision`; different digest → `EVT.IDEMPOTENCY_KEY_REUSED`.
- TEST-PS-003-04-04 (concurrency): 20 parallel edits with the same `expected_revision` → one commit, 19 `EVT.REVISION_CONFLICT`.

## Acceptance criteria
1. Command, query and event signatures match this file and CTR-SCH-001 entries.
2. No event payload contains a title, description, price, currency or region value.
3. Replay and concurrency tests pass.

## Assumptions & open decisions
- ASSUMPTION: `listing.get_for_edit` is a query, not an event source.
- D01 (PROVISIONAL, Dxx default, unapproved): federated `listing.updated` only for published items with opt-in.
- D03 (PROVISIONAL, Dxx default, unapproved): price fields as minor units.
