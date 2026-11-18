# PS-080-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/02_security_boundaries/mod_metadata (Privacy Lead, F10; review F16 Security Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R01, R02, R07, R08), CTR-PRV-001 (disclosure matrix), CTR-ERR-001 (R08).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-080-05.R01 | Capability `metadata_policy.publish` and `metadata_policy.activate`, scope `global`, dual approval by F10 and F16 approvers. | MVP |
| PS-080-05.R02 | Capability `attachment_metadata.sanitize`, principal `sys_` only, scope `global`, purpose `metadata_sanitisation`. | MVP |
| PS-080-05.R03 | Users cannot read sanitiser reports other than counts for their own attachment. | MVP |
| PS-080-05.R04 | Operators cannot disable egress filter for a surface; disabling requires a new policy version approved under R01. | MVP |
| PS-080-05.R05 | Every policy change and quarantine decision emits an `aud_` record (CTR-CAP-001 R08). | MVP |

## Data / schema
Grants `grt_`; decisions `dec_` with reason codes; no content.

## Commands / queries / events
Publish and activate → R01; sanitise → R02; egress filter → no principal (in-process, trusted build).

## States & transitions
Policy activation requires two approvals recorded before effective date.

## Validation & errors
Invisible objects → `SYS.NOT_FOUND`; visible denied → `SYS.FORBIDDEN`.

## Authorization
| Actor | publish/activate | sanitise | read report counts |
|---|---|---|---|
| F10 approver ope_ | approve | no | no |
| F16 approver ope_ or sys review | approve | no | no |
| sys_ sanitiser | no | global, purpose-bound | no |
| owner acc_ | no | no | own attachment counts |

## Failure, idempotency, concurrency, offline
Decision cache TTL zero for policy activation.

## Privacy, retention, abuse
Audit records RET-AUD. Abuse: attempts to disable filter are alerts.

## Observability & budgets
`meta_policy_change_total`; alert on any disabled surface.

## Tests
- TEST-PS-080-05-01 (negative): single approver activation → CAP.DUAL_APPROVAL_REQUIRED.
- TEST-PS-080-05-02 (negative): user reads another user's report → SYS.NOT_FOUND.

## Acceptance criteria
1. Matrix enforced deny-by-default.
2. Dual approval tested.
3. No API path disables egress filtering (route audit).

## Assumptions & open decisions
- PROVISIONAL (D05 default) for location-adjacent surfaces.
- ASSUMPTION: grants ≤ 72 h where a grant is used.
