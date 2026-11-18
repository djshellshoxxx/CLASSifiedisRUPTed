# PS-084-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/01_protocol/mod_records. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-FED-001 (R02).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-084-05.R01 | Only the item owner may set `federate` on their item (`<resource>.consent`, scope self). | MVP |
| PS-084-05.R02 | Operators cannot set `federate` on another user's item. | MVP |
| PS-084-05.R03 | Registry changes require Platform Lead; class raises also require Privacy Lead review. | MVP |
| PS-084-05.R04 | Default deny. | MVP |

## Data / schema
Capabilities: `lst.consent` (example resource), `record_type.register`, `record_type.deprecate`.

## Commands / queries / events
[commands_queries_events.md](commands_queries_events.md).

## States & transitions
None.

## Validation & errors
`SYS.FORBIDDEN` or `SYS.NOT_FOUND` per CTR-CAP-001 R04/R08 of CTR-ERR.

## Authorization
| Actor | Action | Resource | Outcome |
|---|---|---|---|
| owner | lst.consent | own item | ALLOW |
| non-owner | lst.consent | item | DENY, SYS.NOT_FOUND |
| ope | lst.consent | other's item | DENY |
| Platform Lead | record_type.register | registry | ALLOW |
| Platform Lead alone | raise max_class | registry | DENY, CAP.DUAL_APPROVAL_REQUIRED |

## Failure, idempotency, concurrency, offline
Fails closed. Offline clients have no authority.

## Privacy, retention, abuse
Owner flag changes produce audit records (CTR-CAP-001 R08).

## Observability & budgets
`records_authz_denies_total`.

## Tests
- TEST-PS-084-05-01 (matrix): table outcomes.
- TEST-PS-084-05-02 (operator): ope cannot flag others' items.
- TEST-PS-084-05-03 (registry): class raise needs second approver.

## Acceptance criteria
1. Matrix passes.
2. Class raise dual-approved.

## Assumptions & open decisions
- PROVISIONAL (CTR-CAP-001 default, unapproved).
