# PS-028-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/01_service_catalog/mod_availability. **Parent:** [mod_availability SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-PRV-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-028-05.R01 | Only the provider of a `srv_` may create, update, block, unblock or retire its windows (`srv.update`, scope `self`). | MVP |
| PS-028-05.R02 | Window schedule fields are visible to the provider (`owner`) and, for a booked window only, to the booking customer (`participant`). | MVP |
| PS-028-05.R03 | Public and other authenticated users see aggregate open-slot counts and 1-hour start times, never `provider` IDs, timezone or region. | MVP |
| PS-028-05.R04 | Quote events may trigger hold and release only through a `sys` principal scoped to the window's `srv_`. | MVP |
| PS-028-05.R05 | Operators have no read access to schedules without a `case:` scope and dual control. | MVP |

## Data / schema
Action matrix:

| Principal | Action | Resource | Outcome |
|---|---|---|---|
| user, provider | `srv.update` | own window | ALLOW (self) |
| user, other | `srv.update` | window | DENY → `SYS.NOT_FOUND` (cannot see) or `SYS.FORBIDDEN` (visible) |
| user, booked customer | `srv.read` | booked window | ALLOW (participant, booked fields) |
| user, other customer | `srv.read` | booked window | DENY → `SYS.NOT_FOUND` |
| user, anonymous | `srv.read` | slot counts | ALLOW (aggregate) |
| sys, `svq` scope | `svq.accept` (hold/book) | window of that `srv_` | ALLOW |
| ope, single approval | `srv.read` | schedule | DENY (dual control) |

## Commands / queries / events
Each command maps to a row above. Decision records hold outcome and reason code only.

## States & transitions
Authorization rechecked per command; provider changes to `srv_` ownership re-evaluate on next decision.

## Validation & errors
`SYS.FORBIDDEN` for visible resources; `SYS.NOT_FOUND` for hidden resources (CTR-ERR-001 R08).

## Authorization
Capability IDs: `srv.update`, `srv.read`, `svq.accept`. No additional verbs.

## Failure, idempotency, concurrency, offline
Decision TTL zero for writes. Revocation of a provider's listing takes effect at next decision; existing HELD windows release on `srv_` retirement.

## Privacy, retention, abuse
Pseudonyms resolve to `acc_` before checks (CTR-CAP-001 R02). Booked-customer visibility ends when the booking is released.

## Observability & budgets
Metric `svcavail_authz_denials_total{action,code}`. Alert on enumeration bursts of `SYS.NOT_FOUND` from one principal.

## Tests
- TEST-PS-028-05-01 (negative): each matrix row returns the stated outcome.
- TEST-PS-028-05-02 (integration): non-booked customer cannot read the booked window.
- TEST-PS-028-05-03 (integration): anonymous search returns counts only.
- TEST-PS-028-05-04 (negative): operator read denied without second approver.

## Acceptance criteria
1. Matrix tests pass with zero unlisted outcomes.
2. No schedule field appears in public responses (automated scan).
3. Booked-customer visibility removed within one decision cycle of release.

## Assumptions & open decisions
- ASSUMPTION: anonymous users receive counts only.
- PENDING CTR-ID-001 (`avw` prefix). See [DECISIONS.md](../../../DECISIONS.md) D10 (OPEN; account portability affects provider identity).
