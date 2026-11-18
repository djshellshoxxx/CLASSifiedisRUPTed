# PS-126-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [mod_authorization](SPEC.md) (Security Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ID-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-126-05.R01 | Module-owned capabilities are `grt.administer`, `pol.administer`, `authz.explain`, `aud.read`. | MVP |
| PS-126-05.R02 | `grt.administer` and `pol.administer` require two distinct `ope` approvers; the requester cannot approve. | MVP |
| PS-126-05.R03 | No principal may hold `grt.administer` on its own grant. | MVP |
| PS-126-05.R04 | `aud.read` reads decision metadata only; it cannot read object content or credentials. | MVP |
| PS-126-05.R05 | Support operators hold no capability that reads or changes credentials (CTR-CAP-001 R12). | MVP |

## Data / schema
Capability names follow `<resource_type>.<verb>`. Decision records follow CTR-CAP-001.

## Commands / queries / events
Action mapping: `grant.create` → `grt.administer`; `grant.revoke` → `grt.administer`; `policy.publish` → `pol.administer`; `authz.explain` → `authz.explain`; decision-log query → `aud.read`.

## States & transitions
Not applicable.

## Validation & errors
| Actor | Action | Resource | Outcome | Code |
|---|---|---|---|---|
| ope (single approver) | grt.administer | grant | DENY | CAP.DUAL_APPROVAL_REQUIRED |
| ope (requester = approver) | grt.administer | grant | DENY | CAP.SELF_APPROVAL_FORBIDDEN |
| ope (two approvers, purpose) | grt.administer | grant | ALLOW | none |
| mod (case grant) | rpt.read | report in case | ALLOW | none |
| mod (no grant) | rpt.read | report | DENY | SYS.NOT_FOUND |
| acc_ (not subject) | grant.list | another acc_ | DENY | SYS.NOT_FOUND |
| acc_ | grt.administer | any | DENY | SYS.FORBIDDEN |
| ope (audit role) | aud.read | decision | ALLOW (metadata) | none |
| ope (audit role) | msg.read | message | DENY | SYS.FORBIDDEN |
| sys_ (authz service) | authz.decide | any | ALLOW | none |

## Failure, idempotency, concurrency, offline
Authorization of administrative actions fails closed. Capability checks do not cache across policy versions.

## Privacy, retention, abuse
Access to `aud.read` is itself logged with purpose (RET-AUD). Support staff see audit metadata without content.

## Observability & budgets
`authz_admin_actions_total{capability,outcome}`.

## Tests
- TEST-PS-126-05-01 (matrix): every row produces the stated outcome and code.
- TEST-PS-126-05-02 (negative): self-approval attempt via two accounts controlled by one actor is flagged by co-approval alert.
- TEST-PS-126-05-03 (negative): support role attempts credential read → SYS.FORBIDDEN and an aud_ record.

## Acceptance criteria
1. No administrative action completes with one approver.
2. Support role has zero credential-related permissions in the policy bundle.
3. Every administrative decision creates a decision record.

## Assumptions & open decisions
- ASSUMPTION: co-approval alert threshold N = 10 pairs per 30 days.
- PROVISIONAL (D10 default, unapproved): operator access to credentials is never granted (CTR-CAP-001 R12).
