# PS-141-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/03_release/mod_ci. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-141-04.R01 | Each state-changing command carries `idempotency_key` and `expected_revision`. | MVP |
| PS-141-04.R02 | Commands are versioned `v1`; breaking changes need a new command name. | MVP |
| PS-141-04.R03 | Events follow CTR-EVT-001 R10 naming. | MVP |
| PS-141-04.R04 | Queries are paginated (max 100) and return no logs. | MVP |

## Commands
| Command (v1) | Signature | Idempotency key | Emits | Errors |
|---|---|---|---|---|
| DefineCiPipeline | `(pipeline: ci_pipeline)` | `pipeline_key` + `version` | `ci_pipeline.defined` | CIPIPE.REQUIRED_CHECK_MISSING, CIPIPE.ACTION_NOT_PINNED, SYS.FORBIDDEN |
| StartCiRun | `(pipeline_key, commit_sha, trigger)` | `commit_sha` + `pipeline_key` + `trigger` | `ci_run.started` | SYS.REQUEST_MALFORMED, SYS.NOT_FOUND |
| RecordCiJobResult | `(run_id, job_key, status, artifact_digests[])` | `run_id` + `job_key` + `attempt` | `ci_run.completed` (on terminal) | CIPIPE.ARTIFACT_DIGEST_MISSING, CIPIPE.SECRET_PATTERN_FOUND, CIPIPE.INVALID_TRANSITION, SYS.CONFLICT |

## Queries
| Query (v1) | Input | Output | Errors |
|---|---|---|---|
| GetCiRun | `run_id` | run status, job statuses, digests | SYS.NOT_FOUND |
| ListCiRunsForCommit | `commit_sha`, `cursor`, `limit` ≤ 100 | run summaries | SYS.REQUEST_MALFORMED |

## Events
| event_type | aggregate_type | max_data_class | Payload (summary) |
|---|---|---|---|
| ci_pipeline.defined | ci_pipeline | PUBLIC | pipeline_key, version, revision |
| ci_run.started | ci_run | PUBLIC | run_id, commit_sha, pipeline_key |
| ci_run.completed | ci_run | PUBLIC | run_id, status, job count |

Envelope per CTR-EVT-001. `actor_ref` is a `sys_` or `acc_` ID. Events never carry logs or secret matches.

## Data / schema
Not applicable to this process; owned by [domain_schema](domain_schema.md).

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
- TEST-PS-141-04-01 (contract): duplicate RecordCiJobResult with the same key returns the original result.
- TEST-PS-141-04-02 (contract): ci_run.completed validates against the CTR-EVT-001 envelope schema.

## Acceptance criteria
1. TEST-PS-141-04-01, TEST-PS-141-04-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: release gates are the only required subscriber; confirm at contract review.
- D01 applies only if run records are ever federated: PROVISIONAL (D01 default, unapproved).
