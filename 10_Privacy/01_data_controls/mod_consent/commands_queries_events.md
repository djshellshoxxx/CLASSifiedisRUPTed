# PS-076-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_consent. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-076-04.R01 | Every state-changing command requires `idempotency_key` (UUID v4) and `expected_revision` where a record exists. | MVP |
| PS-076-04.R02 | Each event type is `consent.<past-tense>` and carries `max_data_class` PSEUDONYMOUS. | MVP |
| PS-076-04.R03 | Query `consent.query` returns current status for (`purpose`, `scope`) only; never history. | MVP |
| PS-076-04.R04 | Schema IDs: `consent.grant.request@1.0.0`, `consent.granted@1.0.0` etc. registered per CTR-SCH-001. | MVP |

## Data / schema
Payload schemas reference [domain_schema.md](domain_schema.md). Event envelope per CTR-EVT-001.

| Command | Actor | Idempotency | Event | Error codes |
|---|---|---|---|---|
| `consent.grant` | subject | required | `consent.granted` | PURPOSE_UNKNOWN, NOTICE_VERSION_STALE, BUNDLED_NOT_ALLOWED |
| `consent.withdraw` | subject | required | `consent.withdrawn` | SYS.NOT_FOUND, INVALID_TRANSITION |
| `consent.expire` | sys_ | required (job id) | `consent.expired` | INVALID_TRANSITION |
| `consent.supersede` | sys_ | required (notice version) | `consent.superseded` | INVALID_TRANSITION |
| `consent.query` | subject | n/a | none | SYS.NOT_FOUND |

## States & transitions
Event order per record follows [workflow_state_machine.md](workflow_state_machine.md). Each event increments the record `revision` by exactly 1.

## Validation & errors
Command input rules: [validation_rules.md](validation_rules.md). Error envelope: CTR-ERR-001.

## Authorization
Capabilities: `consent.consent` (grant), `consent.withdraw`, `consent.read` (query). System actions use `sys_` principal with scope `case` none. Full matrix in [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Same key + same digest returns original result; same key + different digest → `EVT.IDEMPOTENCY_KEY_REUSED`. Records kept 7 days (CTR-EVT-001 R03).

## Privacy, retention, abuse
Event payloads carry IDs, purpose enum and timestamps. No notice text in events.

## Observability & budgets
Event counts per type; consumer lag for `consent.withdrawn` ≤ 60 s (ASSUMPTION).

## Tests
- TEST-PS-076-04-01 (contract): each event validates against its registered schema.
- TEST-PS-076-04-02 (idempotency): duplicate grant returns the original record, no second event.
- TEST-PS-076-04-03 (contract): `consent.query` response contains no history fields.

## Acceptance criteria
1. Command, event and query table is complete for this module.
2. Duplicate command produces exactly one event.
3. Withdrawal event reaches the analytics consumer within 60 s in the integration test.

## Assumptions & open decisions
- ASSUMPTION: consumer lag bound 60 s.
- Consumers (downstream) are unresolved in registry; listed in DEPENDENCY_MATRIX.md.
