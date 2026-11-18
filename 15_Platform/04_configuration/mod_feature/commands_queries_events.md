# PS-123-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/04_configuration/mod_feature (F15.S04.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-123-04.R01 | Commands are internal to operator tooling; no end-user endpoint. | MVP |
| PS-123-04.R02 | State-changing commands require `idempotency_key` and `expected_revision` (CTR-EVT-001 R02, R03). | MVP |
| PS-123-04.R03 | Query `feature.list` returns definitions and lifecycle; no rollout state (that is in PS-124). | MVP |

## Data / schema
| Command | Signature | Idempotency scope | Emits | Errors |
|---|---|---|---|---|
| `feature.define` | (definition) | (actor, key) | `feature.defined` | FEATURE.DEFINITION_INVALID, FEATURE.SLUG_RETIRED |
| `feature.activate` | (slug, expected_revision) | (slug, key) | `feature.activated` | FEATURE.DECISION_NOT_APPROVED, SYS.CONFLICT |
| `feature.deprecate` | (slug, expected_revision) | (slug, key) | `feature.deprecated` | FEATURE.DEPENDENCY_UNMET |
| `feature.retire` | (slug, expected_revision) | (slug, key) | `feature.retired` | FEATURE.DEPENDENCY_UNMET, SYS.CONFLICT |

Query: `feature.list` (page <= 100), `feature.get` (one definition).

## States & transitions
Effects follow PS-123-03.

## Validation & errors
Per PS-123-02.

## Authorization
PS-123-05.

## Failure, idempotency, concurrency, offline
Repeat commands with the same key return the original result.

## Privacy, retention, abuse
Payloads carry slugs and codes only.

## Observability & budgets
Command p95 <= 100 ms (ASSUMPTION).

## Tests
- TEST-PS-123-04-01 (contract): command table matches implementation.
- TEST-PS-123-04-02 (concurrency): two activations; one succeeds.
- TEST-PS-123-04-03 (idempotency): repeat define returns original.
- TEST-PS-123-04-04 (negative): `feature.list` never returns rollout state.

## Acceptance criteria
1. Command table matches implementation.
2. TEST-PS-123-04-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: lifecycle events use CTR-EVT-001 with `aggregate_type = feature`.
