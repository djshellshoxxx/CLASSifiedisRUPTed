# PS-141-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/03_release/mod_ci. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-ERR-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-141-07.R01 | Secret values are masked in job logs before storage; masking covers the secret-pattern list and every configured secret name. | MVP |
| PS-141-07.R02 | Fork-PR jobs receive no secret scope, no write token and no cache write access. | MVP |
| PS-141-07.R03 | Stored run records contain no contributor email, IP address or device identifier; `actor_ref` is an opaque ID. | MVP |
| PS-141-07.R04 | Log retention: 90 days for passed runs, 180 days for failed or aborted runs (D07 default, PROVISIONAL). | MVP |

## Abuse controls
- **Cryptomining or exfiltration in fork PRs:** untrusted pool, no network egress beyond the package-registry allowlist (ASSUMPTION).
- **Pipeline self-modification:** definition edits need a second approver (PS-141-05).
- **Log injection:** job output is stored as text, never rendered as HTML or parsed as commands.
- **Rate abuse:** maximum 20 queued runs per author per hour (ASSUMPTION).

## Data classes and holds
Run records are `PUBLIC`. Job logs may contain test output and are treated as `PSEUDONYMOUS` until scanned. Legal holds apply to runs referenced by an open release gate.

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

## Observability & budgets
Not applicable to this process; owned by [observability_performance](observability_performance.md).

## Tests
- TEST-PS-141-07-01 (security): a planted token pattern in job output is masked before storage.
- TEST-PS-141-07-02 (privacy): a stored run record has no email, IP address or device field.

## Acceptance criteria
1. TEST-PS-141-07-01, TEST-PS-141-07-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: no production data is used in CI test runs.
- D07 (retention) default is PROVISIONAL (D07 default, unapproved).
