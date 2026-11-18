# PS-046-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/03_ranking/mod_fairness. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-CAP-001.

**Decision labels:** Budgets ASSUMPTION.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-046-04.R01 | Policy commands require `idempotency_key` and `expected_revision`. | MVP |
| PS-046-04.R02 | Each command emits one `rank_policy.*` event (`aggregate_type = rank_policy`). | MVP |
| PS-046-04.R03 | Page re-rank step (`fairness.apply`) is an internal call, p95 ≤ 20 ms for N ≤ 200 candidates (ASSUMPTION). | MVP |
| PS-046-04.R04 | `fairness.apply` emits one `fxa_` audit row per served page (aggregated, PS-046-01). | MVP |

## Data / schema
`fairness.apply` input: ordered candidate list with `seller_bucket`, `promoted` flag, `listing_id`; output: reordered list, `constraint_status`, `policy_id`. Events carry policy IDs, versions and state only.

## Commands / queries / events
| Command or call | Caller | Event | Error codes |
|---|---|---|---|
| `rank_policy.draft` | F06 operator | rank_policy.drafted | CONFIG_INVALID, FEATURE_FORBIDDEN |
| `rank_policy.activate` | two approvers | rank_policy.activated | POLICY_CONFLICT, APPROVAL_MISSING, INVALID_TRANSITION |
| `rank_policy.retire` | two approvers | rank_policy.retired | INVALID_TRANSITION |
| `fairness.apply` (internal) | relevance service | none (audit row only) | AUDIT_INVALID (logged) |
| `exposure.summary` (query) | F06 operator, aggregated | none | SYS.FORBIDDEN for non-aggregate requests |

## States & transitions
Per PS-046-03.

## Validation & errors
PS-046-02 gates.

## Authorization
PS-046-05.

## Failure, idempotency, concurrency, offline
`fairness.apply` is pure given inputs and policy version; if audit write fails, the page is still served and the audit is queued (never blocked).

## Privacy, retention, abuse
Audit rows contain no listing or seller IDs in clear.

## Observability & budgets
`fairness_apply_latency_ms`; `fairness_repairs_total`.

## Tests
- TEST-PS-046-04-01 (contract): command and event schema validation.
- TEST-PS-046-04-02 (determinism): same input and policy → same order.
- TEST-PS-046-04-03 (audit): one audit row per served page; no clear seller ID.
- TEST-PS-046-04-04 (latency): N = 200 candidates p95 ≤ 20 ms.

## Acceptance criteria
1. `fairness.apply` deterministic.
2. Audit rows aggregated and keyed.
3. Latency budget met.

## Assumptions & open decisions
- ASSUMPTION: budget values.
- PENDING CTR-SCH-001 registration.
