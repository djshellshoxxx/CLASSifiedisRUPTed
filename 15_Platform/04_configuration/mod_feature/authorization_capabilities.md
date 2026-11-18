# PS-123-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/04_configuration/mod_feature (F15.S04.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-123-05.R01 | Default deny. End users cannot read or change feature definitions. | MVP |
| PS-123-05.R02 | `feature.read` is granted to any `ope` in the platform operations role and to the F-module owners for their own features. | MVP |
| PS-123-05.R03 | `feature.administer` (define, activate, deprecate, retire) requires `ope` principals; activate and retire need two distinct approvers. | MVP |
| PS-123-05.R04 | A module owner cannot approve its own feature activation (CTR-CAP-001 R07). | MVP |

## Data / schema
| Capability | Actor | Resource | Verb |
|---|---|---|---|
| `feature.read` | ope, owner module | feature, scope global | read |
| `feature.administer` | ope (dual control on activate, retire) | feature, scope global | administer |

## Commands / queries / events
Decisions recorded per CTR-CAP-001 R08.

## States & transitions
Not applicable.

## Validation & errors
`SYS.FORBIDDEN` for visible denials; `CAP.DUAL_APPROVAL_REQUIRED` for single approval.

## Authorization
Capability checks precede validation of command input.

## Failure, idempotency, concurrency, offline
Cache TTL 60 s for reads, zero for administer.

## Privacy, retention, abuse
None beyond operator access logs.

## Observability & budgets
Metric: `feature_authz_denied_total`.

## Tests
- TEST-PS-123-05-01 (matrix): each actor and capability.
- TEST-PS-123-05-02 (privileged): single approver activation refused.
- TEST-PS-123-05-03 (negative): owner module self-approval refused.
- TEST-PS-123-05-04 (negative): end-user request returns `SYS.NOT_FOUND`.

## Acceptance criteria
1. Default deny holds (TEST-01).
2. TEST-PS-123-05-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: owner-module read scope uses module ID match.
