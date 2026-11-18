# PS-141-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/03_release/mod_ci. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-SCH-001, CTR-EVT-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-141-01.R01 | Every run binds to one commit SHA (40 lowercase hex) and one pipeline `version`. | MVP |
| PS-141-01.R02 | Each job result stores the digest (SHA-256) of its produced artifacts and no artifact bodies. | MVP |
| PS-141-01.R03 | Run and job records are append-only; a rerun is a new `attempt`. | MVP |
| PS-141-01.R04 | `max_data_class` is `PUBLIC`; no secret value, token or contributor contact field may be stored. | MVP |

## Data / schema
`ci_pipeline` (versioned, `additionalProperties: false`):
- `pipeline_key`: string, `^[a-z][a-z0-9-]{2,39}$`.
- `version`: semver. `revision`: integer ≥ 1.
- `trigger`: enum `pull_request`, `push_main`, `release_branch`, `schedule`.
- `stages`: ordered array of stage keys (`lint`, `unit`, `property`, `integration`, `contract`, `e2e`, `a11y`, `offline`).
- `required_checks`: array of check keys; a required check missing from `stages` fails validation.
- `runner_pool`: enum `untrusted_fork`, `trusted_internal`, `release`.

`ci_run`:
- `run_id`: entity ID `<prefix>_<body>`; prefix PENDING CTR-ID-001 registry entry.
- `pipeline_key`, `pipeline_version`, `commit_sha`, `attempt` ≥ 1.
- `status`: enum `queued`, `running`, `passed`, `failed`, `aborted_infra`, `superseded`.
- `jobs`: array of `{job_key, status, duration_ms, artifact_digests[]}`.
- `started_at`, `finished_at`: RFC 3339 UTC. `runner_ref`: `sys_` principal ID.

Provenance: `commit_sha` and `pipeline_version` are the only build identifiers used by gates.

## Commands / queries / events
Not applicable to this process; owned by [commands_queries_events](commands_queries_events.md).

## States & transitions
Not applicable to this process; owned by [workflow_state_machine](workflow_state_machine.md).

## Validation & errors
Not applicable to this process; owned by [validation_rules](validation_rules.md).

## Authorization
Not applicable to this process; owned by [authorization_capabilities](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Not applicable to this process; owned by [failure_recovery_idempotency](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Not applicable to this process; owned by [privacy_retention_abuse](privacy_retention_abuse.md).

## Observability & budgets
Not applicable to this process; owned by [observability_performance](observability_performance.md).

## Tests
- TEST-PS-141-01-01 (schema): ci_run with a commit_sha that is not 40 lowercase hex is rejected.
- TEST-PS-141-01-02 (unit): job result with an unknown job_key is rejected.

## Acceptance criteria
1. TEST-PS-141-01-01, TEST-PS-141-01-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

