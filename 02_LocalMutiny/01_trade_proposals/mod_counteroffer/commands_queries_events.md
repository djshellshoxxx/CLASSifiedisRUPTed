# PS-012-04 — commands queries events
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_counteroffer. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (envelope, `expected_revision`, idempotency scope), CTR-SCH-001 (`counter.v1`), CTR-ERR-001 (errors), CTR-PRV-001 (payload classes).

**Decision label:** Synchronous command API is PROVISIONAL (ASSUMPTION, unapproved); event names follow CTR-EVT-001.R10.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-012-04.R01 | Each state-changing command requires `idempotency_key` (16–64 chars) and `expected_revision` (`state_version` of the target row where applicable). | MVP |
| PS-012-04.R02 | Commands return the resulting `counter` view, `state_version` and `event_id`. Replays return the original response (CTR-EVT-001.R03). | MVP |
| PS-012-04.R03 | Queries return only fields visible to the caller under PS-012-05.R04. | MVP |
| PS-012-04.R04 | Events carry no item titles, descriptions, messages or location. | MVP |

## Commands
| Command | Input (required) | Event(s) | Idempotency scope | Error codes |
|---|---|---|---|---|
| `counter.create` | `cyc_id`, `target_revision`, `slot_terms`, `value_terms?`, `expires_at?`, `idempotency_key` | `counter.proposed`, `counter.superseded?` | (actor, command, key) | PS-012-02 table |
| `counter.accept` | `counter_id`, `expected_revision`, `idempotency_key` | `counter.accepted` | same | `CTROFFER.COUNTER_NOT_OPEN`, `COUNTER_EXPIRED`, `COUNTER_INVALIDATED`, `ITEM_UNAVAILABLE`, `COM.QUOTE_EXPIRED`, `EVT.REVISION_CONFLICT` |
| `counter.reject` | `counter_id`, `expected_revision`, `idempotency_key` | `counter.rejected` | same | `CTROFFER.COUNTER_NOT_OPEN` |
| `counter.withdraw` | `counter_id`, `expected_revision`, `idempotency_key` | `counter.withdrawn` | same | `CTROFFER.COUNTER_NOT_OPEN` |

System commands (not client-callable): `counter.expire`, `counter.invalidate`, `counter.supersede`. Principal `sys_`, scoped to this module.

## Queries
| Query | Input | Output | Limits |
|---|---|---|---|
| `counter.get` | `counter_id` | One counter view | Participant only |
| `counter.list` | `cyc_id`, `status?`, `cursor?`, `limit` ≤ 50 | Page ordered by `revision` desc | Participant only |

## Events
| `event_type` | Payload keys | `max_data_class` |
|---|---|---|
| `counter.proposed` | counter_id, cyc_id, revision, proposer_ref, recipient_ref, content_hash, expires_at | FINANCIAL_EVIDENCE if `value_terms` else PSEUDONYMOUS |
| `counter.accepted` | counter_id, cyc_id, revision, actor_ref | PSEUDONYMOUS |
| `counter.rejected` / `withdrawn` / `superseded` / `expired` | counter_id, cyc_id, revision, status | PSEUDONYMOUS |
| `counter.invalidated` | counter_id, cyc_id, revision, reason (enum) | PSEUDONYMOUS |

Each payload carries `schema_version` `counter.v1`. Additive fields are MINOR; renames or removals are MAJOR (CTR-SCH-001).

## Assumptions & open decisions
- PENDING CTR-EVT-001 registry entries for the `counter.*` event types.
- D01 PROVISIONAL (D01 default, unapproved): federated counter events are Future and not part of this command set.
- D03 PROVISIONAL (D03 default, unapproved): quote fields follow CTR-COM-001.R04.
