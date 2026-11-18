# PS-138-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/02_performance/mod_chaos. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-138-01.R01 | One `chaos_experiment` record per experiment: hypothesis, fault type, target, blast radius, steady-state metrics, abort conditions, owner. | MVP |
| PS-138-01.R02 | Fault types are a closed enum (table below); new types require a spec change. | MVP |
| PS-138-01.R03 | Blast radius is `single_node`, `single_region_staging` or `full_staging`; `production` is not a valid value at MVP. | MVP |
| PS-138-01.R04 | Every experiment has at least one abort condition with a numeric threshold and a maximum duration ≤ 30 min (ASSUMPTION). | MVP |
| PS-138-01.R05 | Experiment results record steady-state before, during and after, and the hypothesis verdict. | MVP |

## Data / schema
```json
{
  "experiment_id": "exp_ (PENDING CTR-ID-001 prefix, proposed cho, class ulid)",
  "hypothesis": "string <= 500 chars",
  "fault_type": "relay_outage | db_failover | partition | clock_skew | duplicate_delivery | key_service_unavailable | scheduler_crash | dependency_latency | disk_full",
  "target": "typed ref of staging component (no production IDs)",
  "blast_radius": "single_node | single_region_staging | full_staging",
  "steady_state": [{"metric": "string", "expected": "string", "tolerance": "string"}],
  "abort_conditions": [{"metric": "string", "threshold": "number", "window_s": "integer"}],
  "max_duration_s": "integer <= 1800",
  "verdict": "held | violated | aborted | not_run",
  "owner": "ope_ or team role",
  "data_class": "PUBLIC"
}
```

## Commands / queries / events
See [commands_queries_events.md](commands_queries_events.md).

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md).

## Authorization
See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Experiment records are immutable after `running`; results append.

## Privacy, retention, abuse
Experiment targets are staging components. No production targets are stored.

## Observability & budgets
Gauge `chaos_experiments_running` must not exceed 2 across the staging environment (ASSUMPTION).

## Tests
- TEST-PS-138-01-01: unit, fault type enum closed.
- TEST-PS-138-01-02: unit, duration cap enforced.

## Acceptance criteria
1. No record has blast radius `production`.
2. Every record has at least one numeric abort condition.

## Assumptions & open decisions
- ASSUMPTION: production chaos is out of scope at MVP.
- PENDING CTR-ID-001: `cho` prefix.
- D08 (offline behavior under fault): PROVISIONAL (D08 default, unapproved).
