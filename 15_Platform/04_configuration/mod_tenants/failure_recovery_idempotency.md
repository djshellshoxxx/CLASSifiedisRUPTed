# PS-125-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [mod_tenants](SPEC.md) (Platform Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-125-06.R01 | Slug uniqueness enforced by a unique index; concurrent creates with one slug yield exactly one success and one `TEN.SLUG_TAKEN`. | MVP |
| PS-125-06.R02 | Provisioning is a saga of four idempotent steps: reserve slug, insert record, provision scopes, activate. Each step has a step ID. | MVP |
| PS-125-06.R03 | A failed step is compensated in reverse order within 2 min; no orphan slug reservation remains after compensation. | MVP |
| PS-125-06.R04 | Config writes require `expected_revision`; mismatch returns `EVT.REVISION_CONFLICT` with no partial write. | MVP |
| PS-125-06.R05 | Suspension stops writes at commit; cached reads expire within 60 s. | MVP |

## Data / schema
Saga log: `saga_id`, `tenant_id`, `step_id`, `state` (`pending`, `done`, `compensated`), `attempt`, `updated_at`. Retention RET-OPS.

## Commands / queries / events
Retry: `tenant.create` may be retried with the same idempotency key while `provisioning`; returns the same `tenant_id`.

## States & transitions
Failure paths map to [PS-125-03](workflow_state_machine.md): `provision.failed` → `deleted`.

## Validation & errors
| Scenario | Code | Retryable |
|---|---|---|
| Storage timeout on step | TEN.PROVISION_STEP_TIMEOUT (dependency / 503) | true |
| Compensation failed | TEN.COMPENSATION_PENDING (internal / 500) | true; alert |
| Revision conflict | EVT.REVISION_CONFLICT | false (client refetches) |

## Authorization
Saga steps run as `sys_` with a scoped system capability; they cannot act as the admin.

## Failure, idempotency, concurrency, offline
- Timeouts: step 30 s; saga 10 min (ASSUMPTION).
- Retry: exponential backoff 1 s, 2 s, 4 s, max 3 attempts per step, then compensate.
- Crash recovery: a sweeper resumes `pending` sagas older than 60 s.
- Suspension during provisioning is refused with `TEN.INVALID_TRANSITION`.
- Offline: tenant configuration is not editable offline; cached tenant data is display-only.
- Federation: a suspended tenant emits a peer state change through CTR-FED-001 when `federation_mode` is `restricted`.

## Privacy, retention, abuse
Saga logs hold IDs and states only. Compensation never deletes data that a legal hold covers.

## Observability & budgets
`tenant_saga_steps_total{step,outcome}`, `tenant_saga_stuck_total`. Alert when any saga is stuck > 10 min.

## Tests
- TEST-PS-125-06-01 (concurrency): 50 parallel creates for one slug yield one success.
- TEST-PS-125-06-02 (integration): failure at step 3 compensates steps 1–2 and frees the slug.
- TEST-PS-125-06-03 (fault injection): kill process after step 2; sweeper completes or compensates within 2 min.
- TEST-PS-125-06-04 (negative): config write with stale revision leaves record unchanged.

## Acceptance criteria
1. Zero orphan slug reservations after 1,000 injected failures.
2. Every saga ends `active` or `deleted`.
3. Suspension latency to write denial is ≤ 0 s after commit.

## Assumptions & open decisions
- ASSUMPTION: saga timeouts and retry counts as stated.
- PROVISIONAL (D08 default, unapproved): admin edits made offline are queued and rejected at commit if revision changed.
