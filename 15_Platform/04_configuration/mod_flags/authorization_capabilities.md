# PS-124-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/04_configuration/mod_flags (F15.S04.M02). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-124-05.R01 | `flag.evaluate` is allowed to any authenticated principal for its own context; no grant needed. | MVP |
| PS-124-05.R02 | `flag.update` (rollout up) requires `ope` with `change_ref` and a second distinct `ope` approver. | MVP |
| PS-124-05.R03 | `flag.kill` is allowed to `ope` and `sys` on-call principals without approval. | MVP |
| PS-124-05.R04 | `flag.clear_kill` requires a second distinct `ope` approver. | MVP |
| PS-124-05.R05 | No end user can read flag rules; `flag.read` is `ope` with platform operations role. | MVP |

## Data / schema
| Capability | Actor | Resource | Verb |
|---|---|---|---|
| `flag.read` | ope (ops role) | flag, scope global | read |
| `flag.evaluate` | any authenticated principal (own context) | flag, scope self | read |
| `flag.administer` | ope (dual control on rollout-up and clear-kill) | flag, scope global | administer |
| `flag.kill` | ope or sys on-call | flag, scope global | update |

## Commands / queries / events
Decisions per CTR-CAP-001 R08. Kill events go to the audit stream.

## States & transitions
Not applicable.

## Validation & errors
`SYS.FORBIDDEN`; `CAP.DUAL_APPROVAL_REQUIRED`.

## Authorization
Flag evaluation does not produce decision records for every call (volume); only changes and kills are audited.

## Failure, idempotency, concurrency, offline
Evaluation uses cached rules at most 60 s old; admin decisions use zero cache.

## Privacy, retention, abuse
Repeated kill-and-clear cycles raise an alert (abuse of emergency path).

## Observability & budgets
Metric: `flag_authz_denied_total{capability}`.

## Tests
- TEST-PS-124-05-01 (matrix): each row.
- TEST-PS-124-05-02 (privileged): rollout-up with one approver refused.
- TEST-PS-124-05-03 (negative): end user cannot call `flag.read`.
- TEST-PS-124-05-04 (abuse): five kill and clear cycles in an hour alert.

## Acceptance criteria
1. Matrix holds (TEST-01).
2. TEST-PS-124-05-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: five kill and clear cycles per hour threshold.
