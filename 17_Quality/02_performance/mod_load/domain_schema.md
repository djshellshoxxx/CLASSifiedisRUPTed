# PS-139-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/02_performance/mod_load. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-FED-001, CTR-PRV-001, CTR-SCH-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-139-01.R01 | One `workload_model` per journey: weighted operation mix, think times, payload size distribution, synthetic population size. | MVP |
| PS-139-01.R02 | One `load_profile` per run: ramp, steady, spike, soak shape; duration; target rate. | MVP |
| PS-139-01.R03 | One `load_run` per execution with environment ID, build SHA, profile ID, population seed and result summary. | MVP |
| PS-139-01.R04 | Every journey in the workload model names a canonical operation ID (module command or query). | MVP |
| PS-139-01.R05 | Synthetic population uses `acc_` IDs generated for the test and never mapped to real accounts. | MVP |

## Data / schema
```json
{
  "workload_id": "wkl_ (PENDING CTR-ID-001 prefix, proposed wkl, class opaque)",
  "operations": [{"operation_id": "module.command_or_query", "weight": "decimal string 0-1", "payload_bytes_p50": "integer", "payload_bytes_p99": "integer"}],
  "think_time_ms": {"p50": "integer", "p95": "integer"},
  "population": {"size": "integer", "seed": "uint64"},
  "profile": {"shape": "ramp | steady | spike | soak", "target_rps": "integer", "duration_s": "integer"},
  "run_id": "lrn_ (PENDING, proposed lod, class ulid)",
  "build_sha": "40 hex",
  "result": {"p95_ms": "number", "error_rate": "decimal string", "rate_limited_ratio": "decimal string"},
  "data_class": "PUBLIC"
}
```
`weight` values across `operations` sum to exactly 1.000000 (decimal string).

## Commands / queries / events
See [commands_queries_events.md](commands_queries_events.md).

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md).

## Authorization
See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Runs are reproducible from (`workload_id`, `profile`, `population.seed`, `build_sha`).

## Privacy, retention, abuse
Synthetic population only (PS-139-07).

## Observability & budgets
Gauge `load_active_virtual_users`.

## Tests
- TEST-PS-139-01-01: unit, weights sum to 1.
- TEST-PS-139-01-02: unit, every operation ID resolves to a registered command or query.

## Acceptance criteria
1. Every workload references only registered operation IDs.
2. Runs reproduce arrival sequence from seed.

## Assumptions & open decisions
- PENDING CTR-ID-001: prefixes `wkl` and `lrn`.
- D02 (cycle optimizer load): PROVISIONAL (D02 default, unapproved).
