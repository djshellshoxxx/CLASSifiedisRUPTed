# PS-126-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [mod_authorization](SPEC.md) (Security Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (failure section), CTR-EVT-001, CTR-ERR-001, CTR-FED-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-126-06.R01 | If the policy store or grant store is unavailable, the decision is DENY with `SYS.UNAVAILABLE` (retryable) within 100 ms. | MVP |
| PS-126-06.R02 | A revocation committed at revision N denies every decision that reads revision ≥ N. | MVP |
| PS-126-06.R03 | Queued offline writes are re-authorized at server commit; client-side visibility is never authoritative (CR-14). | MVP |
| PS-126-06.R04 | Grant creation and revocation are idempotent by key; approvals append under revision check. | MVP |
| PS-126-06.R05 | Failed policy publication leaves the previous version active. | MVP |

## Data / schema
Revision column on grant rows; decision records are append-only; policy publication is a single-row transaction.

## Commands / queries / events
Retry rules per command in [PS-126-04](commands_queries_events.md).

## States & transitions
A revocation racing a decision resolves by revision: see [PS-126-03](workflow_state_machine.md).

## Validation & errors
| Scenario | Code | Retryable |
|---|---|---|
| Store unavailable | SYS.UNAVAILABLE | true |
| Policy version missing | AUTHZ.POLICY_NOT_FOUND | false (alert) |
| Revision conflict on approve | EVT.REVISION_CONFLICT | false (client refetches) |

## Authorization
Failure paths never grant access. A missing policy version denies all decisions.

## Failure, idempotency, concurrency, offline
- Timeouts: decision 5 ms internal budget; store call 50 ms; no client-visible retry loop.
- Retry: caller retries `SYS.UNAVAILABLE` with backoff 100 ms → 2 s max, 3 attempts.
- Cache: entries valid ≤ 60 s for non-sensitive reads; zero for writes, privileged and PRIVATE/FINANCIAL/LOCATION_PRECISE reads (CTR-CAP-001 R09).
- Federation: revoked grants propagate to peers as `grant.revoked` through CTR-FED-001; peer quarantine denies locally at once.
- Offline devices: revocation visible at next sync; queued writes fail at commit with the decision code.
- Session derived tokens checked against grant state at each privileged action; revoked grant invalidates derived token within 60 s (ASSUMPTION).

## Privacy, retention, abuse
Failure logs hold decision IDs and codes only.

## Observability & budgets
`authz_unavailable_total`, `authz_revocation_lag_seconds` (alert > 60 s).

## Tests
- TEST-PS-126-06-01 (fault): kill grant store; all decisions DENY, none ALLOW, within 100 ms.
- TEST-PS-126-06-02 (race): revoke and write in parallel; write after commit fails at commit.
- TEST-PS-126-06-03 (offline): device with queued write, revoked grant, reconnects → write rejected, no partial state.
- TEST-PS-126-06-04 (publish failure): broken policy publish leaves prior version active.

## Acceptance criteria
1. Zero ALLOW decisions during injected store outage.
2. Revocation lag p95 ≤ 60 s in the reference environment.
3. Every queued offline write re-authorized at commit in the offline suite.

## Assumptions & open decisions
- ASSUMPTION: timing budgets as stated.
- PROVISIONAL (D08 default, unapproved): offline writes wait in a local pending queue until relay acknowledgement, then are re-authorized.
