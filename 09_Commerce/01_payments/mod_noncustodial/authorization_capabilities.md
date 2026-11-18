# PS-069-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/01_payments/mod_noncustodial (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R01–R13), CTR-ERR-001 (R08), CTR-PRV-001 (R01–R03). **Decisions:** D09 (PROVISIONAL default, unapproved), D10 (PROVISIONAL default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-069-05.R01 | Default deny. Only the owning party (`route.declare`, `route.replace`, `route.withdraw`) and trx participants (`route.read`) may act on a route. | MVP |
| PS-069-05.R02 | `contact_hint` is readable only by the counterparty participant. No `mod_` or `ope_` may read it without a case grant and `constraints.purpose` (CTR-CAP-001 R06). | MVP |
| PS-069-05.R03 | Adapter lifecycle (`adapter.register`, `adapter.suspend`, `adapter.restore`) needs two distinct `ope_` approvers (R07). | MVP |
| PS-069-05.R04 | `sys_` verifier principals may read `destination` only, scope `verification`, and only for routes of trx they verify. | MVP |
| PS-069-05.R05 | Non-participants receive `SYS.NOT_FOUND` for any `route_id` (indistinguishable from nonexistent). | MVP |

## Data / schema
Grant rows follow CTR-CAP-001 `grt` schema. No module-specific grant types beyond the capability IDs below.

## Commands / queries / events
Capability IDs: `route.declare`, `route.replace`, `route.withdraw`, `route.read`, `adapter.register`, `adapter.suspend`, `adapter.restore`, `adapter.list`.

## States & transitions
Authorization is evaluated before every transition; a DENY produces no event and writes a `dec` decision record (outcome and reason code only, CTR-CAP-001 R13).

## Validation & errors
| Case | Code | Retryable |
|---|---|---|
| Actor lacks capability on existing resource | `SYS.FORBIDDEN` | false |
| Actor cannot see resource at all | `SYS.NOT_FOUND` | false |
| Operator without second approver | `SYS.PRECONDITION_FAILED` | true |

## Authorization
| Actor | Action | Resource / scope | Outcome |
|---|---|---|---|
| owner (`acc_`, party) | `route.declare` / `route.withdraw` | own route, participant of `trx_` | ALLOW |
| counterparty (participant) | `route.read` | routes of same `trx_` | ALLOW; `contact_hint` shown |
| non-participant user | any route action | any | DENY → `SYS.NOT_FOUND` |
| anyone | `adapter.list` | public adapter metadata | ALLOW |
| `sys_` verifier | `route.read` | `verification` scope | ALLOW `destination` only |
| `ope_` (single) | `adapter.register` | adapter | DENY until second approver |
| `mod_` (no grant) | `route.read` | any | DENY → `SYS.NOT_FOUND` |
| `mod_` with case grant | `route.read` | route in `cas_` | ALLOW without `contact_hint` |

## Failure, idempotency, concurrency, offline
Revocation of `sys_` verifier grants takes effect at next decision (zero cache for writes, CTR-CAP-001 R09). Authorization failures are not cached.

## Privacy, retention, abuse
Denied-access attempts are counted per principal; more than 20 denied `route.read` in 10 min raises an alert (scraping pattern).

## Observability & budgets
Decision latency p95 ≤ 20 ms (cache hit) and ≤ 80 ms (miss). Audit record (`aud_`) on every privileged read.

## Tests
- TEST-PS-069-05-01 (unit): decision matrix above, row by row.
- TEST-PS-069-05-02 (integration): non-participant gets byte-identical 404 body to nonexistent route.
- TEST-PS-069-05-03 (integration): single `ope_` cannot complete `adapter.suspend` on a privileged path; second approver can.
- TEST-PS-069-05-04 (security, negative): `mod_` without grant cannot read `contact_hint`.

## Acceptance criteria
1. Every row of the matrix has a passing test.
2. No field-level leak in responses for non-participants (canary test).
3. Each privileged decision writes exactly one `dec` and one `aud` record.

## Assumptions & open decisions
- ASSUMPTION: dual control applies to adapter lifecycle, not to individual route declarations.
- D10 (PROVISIONAL default, unapproved): user-controlled keys govern adapter signing key rotation; recovery steps are documented in the identity module, not here.
