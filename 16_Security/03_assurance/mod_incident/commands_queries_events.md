# PS-131-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/03_assurance/mod_incident. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-ID-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-131-04.R01 | All state-changing commands carry `idempotency_key` and `expected_revision`. | MVP |
| PS-131-04.R02 | `incident.append_timeline` is idempotent by (`incident_id`, `entry_digest`). | MVP |
| PS-131-04.R03 | Read `incident.get` p95 ≤ 100 ms (ASSUMPTION). | MVP |
| PS-131-04.R04 | Events carry `max_data_class` ≤ PRIVATE_PERSONAL; never SECRET. | MVP |

## Data / schema
Command body mirrors [domain_schema.md](domain_schema.md); timeline entry: `entry_id`, `at`, `author`, `text`, `prev_hash`, `entry_hash`.

## Commands / queries / events
| Name | Kind | Errors |
|---|---|---|
| incident.declare | command | SEVERITY_INVALID, COMMANDER_REQUIRED, SCOPE_INVALID |
| incident.triage | command | TRANSITION_INVALID, COMMANDER_REQUIRED |
| incident.change_severity | command | SEVERITY_INVALID, TRANSITION_INVALID |
| incident.update_scope | command | SCOPE_INVALID |
| incident.append_timeline | command | PRECISE_DATA_IN_TEXT, REVISION_CONFLICT |
| incident.get / incident.list_open | query | SYS.NOT_FOUND |
| incident.declared, triaged, contained, eradicated, recovered, closed, reopened, sla_breached, severity_changed, scope_updated | event | n/a |

## States & transitions
Per [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Per [validation_rules.md](validation_rules.md) and CTR-ERR-001.

## Authorization
Per [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Duplicate timeline append is a no-op. Concurrent triage: second writer gets `EVT.REVISION_CONFLICT`.

## Privacy, retention, abuse
Events carry `actor_ref` = `ope_` only.

## Observability & budgets
Per-command latency and error counters.

## Tests
- TEST-PS-131-04-01: contract, event schema validation.
- TEST-PS-131-04-02: integration, duplicate timeline append produces one entry.

## Acceptance criteria
1. Every command has a contract test.
2. No event exposes timeline text.

## Assumptions & open decisions
- ASSUMPTION: timeline text excluded from events; events carry IDs only.
- D01 (peer incident notices): PROVISIONAL (D01 default, unapproved).
