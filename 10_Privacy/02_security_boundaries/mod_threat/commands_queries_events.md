# PS-082-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/02_security_boundaries/mod_threat. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-082-04.R01 | Every write takes `idempotency_key` and `expected_revision`. | MVP |
| PS-082-04.R02 | Events `threat.registered`, `threat.assessed`, `threat.mitigation_linked`, `threat.risk_accepted`, `threat.closed`, `threat.reopened`. | MVP |
| PS-082-04.R03 | `threat.query_register` returns the list for authorized reviewers with exploit fields omitted unless `global` reviewer. | MVP |

## Data / schema
Schemas `threat.*@1.0.0` per CTR-SCH-001. Fields in [domain_schema.md](domain_schema.md).

| Command | Actor | Event | Errors |
|---|---|---|---|
| threat.register | Privacy Lead | threat.registered | DUPLICATE_ID, UNLINKED_FLOW, TITLE_CONTAINS_DATA |
| threat.assess | Security Lead | threat.assessed | SCORE_OUT_OF_RANGE |
| threat.update_mitigation | Security Lead | threat.mitigation_linked | MITIGATION_UNTESTED |
| threat.accept_risk | two approvers | threat.risk_accepted | CAP.DUAL_APPROVAL_REQUIRED |
| threat.close / reopen | Privacy Lead | threat.closed / threat.reopened | INVALID_TRANSITION |

## States & transitions
Event order per [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
[validation_rules.md](validation_rules.md); envelope per CTR-ERR-001.

## Authorization
[authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Same key and digest return original; different digest → `EVT.IDEMPOTENCY_KEY_REUSED`.

## Privacy, retention, abuse
Events carry IDs and scores only; no exploit narrative.

## Observability & budgets
Event counts per type; no consumer latency budget beyond 60 s (ASSUMPTION).

## Tests
- TEST-PS-082-04-01 (contract): event schemas validate.
- TEST-PS-082-04-02 (idempotency): duplicate register yields one event.
- TEST-PS-082-04-03 (query): exploit fields absent for non-global reviewer.

## Acceptance criteria
1. Command, event and query table complete.
2. Duplicate write yields one event.
3. Field omission verified.

## Assumptions & open decisions
- ASSUMPTION: consumer lag budget.
- PENDING: consumer list (F12 moderation, F15 observability) in DEPENDENCY_MATRIX.md.
