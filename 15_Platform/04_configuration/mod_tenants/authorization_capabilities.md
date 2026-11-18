# PS-125-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [mod_tenants](SPEC.md) (Platform Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ID-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-125-05.R01 | Default deny for every `tenant.*` action (CTR-CAP-001 R01). | MVP |
| PS-125-05.R02 | Tenant admin rights derive from the owner rule (`admin_ref` equals the actor), not from a stored grant. | MVP |
| PS-125-05.R03 | Suspend, resume and delete require two distinct `ope` approvers; the requester cannot approve (CAP.SELF_APPROVAL_FORBIDDEN). | MVP |
| PS-125-05.R04 | A tenant admin cannot read or change another tenant; cross-tenant IDs return `SYS.NOT_FOUND`. | MVP |
| PS-125-05.R05 | Config field visibility is `owner` and `case` only; `never` for internal flags. | MVP |

## Data / schema
Capabilities used: `tenant.read`, `tenant.create`, `tenant.update`, `tenant.suspend`, `tenant.resume`, `tenant.offboard`, `tenant.list`. Decision records follow CTR-CAP-001.

## Commands / queries / events
Mapping: create → `tenant.create`; update_config → `tenant.update`; suspend/resume → `tenant.administer`; offboard → `tenant.update` (requester) plus `tenant.administer` (completion); list → `tenant.read` with global scope.

## States & transitions
Not applicable.

## Validation & errors
| Actor | Action | Resource | Outcome | Code |
|---|---|---|---|---|
| anonymous | tenant.read | active tenant | ALLOW (PUBLIC fields) | none |
| acc_ (admin_ref) | tenant.update | own tenant | ALLOW (owner rule) | none |
| acc_ (other) | tenant.update | tenant | DENY | SYS.NOT_FOUND |
| ope (single approval) | tenant.suspend | tenant | DENY | CAP.DUAL_APPROVAL_REQUIRED |
| ope (requester = approver) | tenant.suspend | tenant | DENY | CAP.SELF_APPROVAL_FORBIDDEN |
| ope (two approvals, global scope, purpose set) | tenant.suspend | tenant | ALLOW | none |
| ope | tenant.list | node | ALLOW with purpose; DENY otherwise | SYS.FORBIDDEN |
| mod / fpr | any tenant.* | any | DENY | SYS.FORBIDDEN |

Field visibility: `slug`, `display_name`, `status`, `federation_mode` = public; `config` = owner; `admin_ref` = owner and ope with purpose; `region_cells` = owner and ope.

## Failure, idempotency, concurrency, offline
Authorization decisions fail closed (`SYS.UNAVAILABLE`, retryable). Offline clients never decide authorization (CTR-CAP-001).

## Privacy, retention, abuse
Operator reads of `admin_ref` are logged to `aud_` records (RET-AUD). Repeated DENY from one principal raises a CAP alert (BT-01).

## Observability & budgets
`authz_decisions_total{resource=tenant,outcome}`. Decision latency p95 ≤ 5 ms (ASSUMPTION, shared budget).

## Tests
- TEST-PS-125-05-01 (matrix): every row in the table produces the stated outcome and code.
- TEST-PS-125-05-02 (negative): guessed `ten_` IDs from another admin return identical NOT_FOUND bodies.
- TEST-PS-125-05-03 (privileged): self-approved suspend is rejected and no event is emitted.

## Acceptance criteria
1. No tenant action is allowed without a rule in the table.
2. Admin cannot escalate to suspend or delete through any path.
3. All privileged decisions produce a decision record with no config content.

## Assumptions & open decisions
- ASSUMPTION: tenant admin is identified by `admin_ref`; a change of admin requires an `ope` dual-approved update.
- PROVISIONAL (D10 default, unapproved): operator access to admin accounts does not include credential access (CTR-CAP-001 R12).
