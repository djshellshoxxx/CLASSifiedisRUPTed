# PS-141-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/03_release/mod_ci. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-141-05.R01 | Default deny per CTR-CAP-001 R01. | MVP |
| PS-141-05.R02 | Pipeline definition changes need capability `ci.pipeline.administer` and a second approver who is not the author. | MVP |
| PS-141-05.R03 | Runners hold `ci.run.record` only for their own run IDs. They cannot read other runs' secrets or change definitions. | MVP |
| PS-141-05.R04 | Untrusted fork runs receive no secret scope and no write token. | MVP |

## Authorization
| Actor (principal) | Action | Scope | Decision |
|---|---|---|---|
| Maintainer `acc_` with `ci.pipeline.administer` | ci_pipeline.create, update | global | ALLOW with second approval |
| Runner `sys_`, `untrusted_fork` pool | ci_run.create | global | ALLOW, no secret scope |
| Runner `sys_`, `trusted_internal` pool | ci_run.record_job for own run | participant | ALLOW |
| Runner `sys_` | ci_pipeline.update | global | DENY |
| Any `acc_` with `ci.run.read` | ci_run.read (status and digests) | global | ALLOW |
| Any principal | read job logs of another contributor's fork run | global | DENY |

Principal types per CTR-CAP-001 R02. `actor_ref` is taken from the authenticated principal only (CTR-CAP-001 R11).

## Validation & errors
Denied actions return `SYS.FORBIDDEN`. Hidden runs return `SYS.NOT_FOUND`.

## Failure, idempotency, concurrency, offline
- Revoked runner credential: next `RecordCiJobResult` returns `SYS.FORBIDDEN`; the job is marked `aborted_infra`.
- Offline is not applicable to runner authorization; no grant is cached beyond the 60 s decision TTL for non-sensitive reads (CTR-CAP-001 R09).

## Data / schema
Not applicable to this process; owned by [domain_schema](domain_schema.md).

## Commands / queries / events
Not applicable to this process; owned by [commands_queries_events](commands_queries_events.md).

## States & transitions
Not applicable to this process; owned by [workflow_state_machine](workflow_state_machine.md).

## Privacy, retention, abuse
Not applicable to this process; owned by [privacy_retention_abuse](privacy_retention_abuse.md).

## Observability & budgets
Not applicable to this process; owned by [observability_performance](observability_performance.md).

## Tests
- TEST-PS-141-05-01 (negative): a fork-pool runner requesting a secret scope is denied.
- TEST-PS-141-05-02 (negative): a maintainer approving their own pipeline change is rejected.

## Acceptance criteria
1. TEST-PS-141-05-01, TEST-PS-141-05-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: second-approver rule mirrors CTR-CAP-001 R07 pattern; named approver roles are UNASSIGNED until F16 review.
- D10 (auth and portability) does not change CI authorization: PROVISIONAL (D10 default, unapproved).
