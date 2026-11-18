# PS-110-05 — authorization and capabilities
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/01_a11y/mod_screenreader. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-110-05.R01 | Only the a11y change-control role may publish or deprecate templates. | MVP |
| PS-110-05.R02 | Template reads are public. | MVP |
| PS-110-05.R03 | No principal may use a template to read data it could not otherwise read; rendering uses only the viewer's already-authorized fields. | MVP |

## Data / schema
Capabilities: `announcement_template.read`, `announcement_template.publish`, `announcement_template.deprecate`.

## Commands / queries / events
Maps to [PS-110-04](commands_queries_events.md).

## States & transitions
Not applicable.

## Validation & errors
Unauthorized publish returns `SYS.NOT_FOUND`-equivalent for the template resource (CTR-ERR-001 R08) only when the template is not readable; otherwise an authorization denial.

## Authorization
| Actor | Action | Resource | Decision |
|---|---|---|---|
| ope_ with a11y change-control grant | publish, deprecate | ann_ | ALLOW (global scope, two-person review per CTR-CAP-001 R07 for publish) |
| acc_ | publish, deprecate | ann_ | DENY |
| any | read | published ann_ | ALLOW |
| sys_ | read | published ann_ | ALLOW |

## Failure, idempotency, concurrency, offline
Grant revocation takes effect at next decision (CTR-CAP-001 R09).

## Privacy, retention, abuse
Publishers cannot publish templates that reference fields outside their own grant.

## Observability & budgets
Grant use recorded as `aud_` for publish and deprecate.

## Tests
- TEST-PS-110-05-01 unit: decision table outcomes.
- TEST-PS-110-05-02 integration: publish by a single approver is refused (two-person review).
- TEST-PS-110-05-03 negative: account principal cannot deprecate a template.

## Acceptance criteria
1. Publish and deprecate require the capability and, for publish, two distinct approvers.
2. Every publish and deprecate writes an `aud_` record.
3. Read path requires no authentication.

## Assumptions & open decisions
- ASSUMPTION: two-person review applies to templates as a dual-control action.
- No Dxx decision directly affects authorization.
