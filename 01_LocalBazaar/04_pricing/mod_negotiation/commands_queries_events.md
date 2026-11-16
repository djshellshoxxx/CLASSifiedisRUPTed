# PS-010-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/04_pricing/mod_negotiation. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (envelope, idempotency, revision), CTR-SCH-001 (payload schemas), CTR-ERR-001 (errors), CTR-CAP-001 (actions), CTR-ID-001 (`neg_` PENDING), CTR-COM-001 (money shapes), CTR-FED-001 (not federated).

**Decision labels:** Command version `v1` is PROVISIONAL (ASSUMPTION, unapproved). Federation exclusion follows CTR-FED-001 R02 default.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-010-04.R01 | Every state-changing command carries `idempotency_key` (UUID v4 from client), `expected_revision` (except `neg.open`), and command version `v1`. | MVP |
| PS-010-04.R02 | Queries return only fields permitted by [PS-010-05](authorization_capabilities.md) field visibility. Absent fields are omitted, not null. | MVP |
| PS-010-04.R03 | Event payloads carry IDs, state, round and `terms_hash`. Amounts appear only in `negotiation.agreed`, which F09 consumes by reference. | MVP |
| PS-010-04.R04 | Negotiation events are not federated: `federate` = false, no per-item opt-in in MVP (CTR-FED-001 R02). | MVP |
| PS-010-04.R05 | Event types: `negotiation.opened`, `.countered`, `.agreed`, `.rejected`, `.withdrawn`, `.expired`, `.voided`. Each is a registered schema with `schema_id` equal to its event type (CTR-SCH-001 R01). | MVP |

## Data / schema
Command envelope: `{command, version:"v1", idempotency_key, expected_revision?, actor (authenticated only), payload}`. Actor is taken from the session; body-supplied IDs of actors are ignored (CTR-CAP-001 R11). Payload schemas: [PS-010-01](domain_schema.md).

## Commands / queries / events
| Command | Capability | Payload (summary) | Event | Errors (beyond SYS.*) |
|---|---|---|---|---|
| `neg.open` | negotiation.create | `listing_id`, `listing_version`, `terms` | negotiation.opened | NEG.LISTING_INACTIVE, NEG.SELF_FORBIDDEN, NEG.OPEN_EXISTS, NEG.ACTIVE_LIMIT, NEG.TERMS_OUT_OF_BOUNDS, NEG.FEATURE_DISABLED, COM.* |
| `neg.counter` | negotiation.propose | `negotiation_id`, `expected_revision`, `terms` | negotiation.countered | NEG.NOT_YOUR_TURN, NEG.WINDOW_CLOSED, NEG.ROUND_LIMIT, NEG.TERMS_UNCHANGED, NEG.TERMS_OUT_OF_BOUNDS, NEG.LISTING_INACTIVE |
| `neg.accept` | negotiation.accept | `negotiation_id`, `expected_revision`, `terms_hash` | negotiation.agreed | NEG.NOT_YOUR_TURN, NEG.WINDOW_CLOSED, NEG.LISTING_CHANGED, NEG.TERMS_HASH_MISMATCH, COM.QUOTE_EXPIRED |
| `neg.reject` | negotiation.reject | `negotiation_id`, `expected_revision`, `terms_hash` | negotiation.rejected | NEG.NOT_YOUR_TURN, NEG.WINDOW_CLOSED |
| `neg.withdraw` | negotiation.withdraw | `negotiation_id`, `expected_revision` | negotiation.withdrawn | NEG.INVALID_TRANSITION |
| `neg.expire` (sys) | negotiation.execute | `negotiation_id`, `reason=deadline` | negotiation.expired | none (no-op if terminal) |
| `neg.void` (sys) | negotiation.execute | `negotiation_id`, `reason=listing_gone` | negotiation.voided | none (no-op if terminal) |

Queries: `neg.get` (`negotiation_id`), `neg.list` (`role=initiator|seller`, cursor, limit ≤ 50), `neg.history` (`negotiation_id`, cursor). All return the participant's view. None exposes other buyers on the same listing.

Idempotency: scope = (actor, command, `idempotency_key`) per CTR-EVT-001 R03. Same key and digest → original result. Same key, different digest → `EVT.IDEMPOTENCY_KEY_REUSED`.

## States & transitions
Event sources and guards: [PS-010-03](workflow_state_machine.md).

## Validation & errors
Full table: [PS-010-02](validation_rules.md). `NEG.FEATURE_DISABLED` (unavailable, 503, retryable true) is returned for all state-changing commands when the operator flag is off; queries remain available.

## Authorization
Capability per command as listed; matrix in [PS-010-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Retry and timeout rules: [PS-010-06](failure_recovery_idempotency.md). Event envelope integrity (hash chain, signatures not required for local events): CTR-EVT-001 R05 and R08.

## Privacy, retention, abuse
Events carry no free text, no coordinates, no contact data (CTR-EVT-001 R06). `max_data_class` = PSEUDONYMOUS, or PUBLIC for `negotiation.voided` (listing reference only). Payloads ≤ 64 KiB (CTR-EVT-001 R12); this module's payloads are ≤ 4 KiB.

## Observability & budgets
Command latency p95 ≤ 300 ms and p99 ≤ 800 ms for `neg.open`, `neg.counter`, `neg.accept` (ASSUMPTION). Query `neg.list` (50 items) p95 ≤ 250 ms.

## Tests
- TEST-PS-010-04-01 (schema): each event payload validates against its registry entry; registry `schema_id` equals event type.
- TEST-PS-010-04-02 (contract): every command returns only the errors listed for it, plus SYS.*.
- TEST-PS-010-04-03 (idempotency): replay of each command with same key → original result, one event only.
- TEST-PS-010-04-04 (views): `neg.list` for seller and initiator omit other buyers' `acc_` IDs.
- TEST-PS-010-04-05 (federation): negotiation events never appear in a federation export batch.

## Acceptance criteria
1. Each command in the table has a registered schema, capability and error list.
2. Event types match the regex in CTR-EVT-001 (`negotiation.<past-tense-verb>`).
3. TEST-PS-010-04-01 through -05 pass.

## Assumptions & open decisions
- PENDING CTR-ID-001: `neg` prefix and aggregate type `negotiation` registration.
- PENDING CTR-SCH-001 registry entries for the seven `negotiation.*` event schemas (owned by this module).
- ASSUMPTION: `v1` command versioning; additive changes are MINOR.
- PROVISIONAL (D01 default, unapproved): no federation for negotiation events in MVP.
