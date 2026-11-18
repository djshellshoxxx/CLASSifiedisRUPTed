# PS-133-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/03_assurance/mod_threats. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (capability names PENDING approval).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-133-05.R01 | Restricted threat fields readable only with `threat.read.restricted`; denied reads return no partial data | MVP |
| PS-133-05.R02 | AcceptResidual requires two roles; for LINDDUN threats one must be Privacy Lead | MVP |
| PS-133-05.R03 | Module owners can propose threats for their own area_path only | MVP |
| PS-133-05.R04 | Every denied call writes one denial event with capability name and actor reference | MVP |

## Data / schema
Proposed capabilities (PENDING CTR-CAP-001): `threat.read`, `threat.read.restricted`, `threat.propose`, `threat.write`, `threat.accept_residual`, `threat.publish`.

## Commands / queries / events
Applies to every command in PS-133-04.

## States & transitions
Not applicable.

## Validation & errors
`THREATS.UNAUTHORIZED` (non-retryable). Diagnostic: capability name only.

## Authorization
| Actor | Read internal | Read restricted | Propose | Write/assess | Accept residual | Publish |
|---|---|---|---|---|---|---|
| Security Lead | yes | yes | yes | yes | yes (co-approve) | yes |
| Privacy Lead | yes | yes (privacy categories) | yes | privacy categories | co-approve LINDDUN | no |
| Module owner | own area | no | own area | no | no | no |
| Engineer | yes | no | no | no | no | no |
| Auditor | yes | export tier only | no | no | no | no |

## Failure, idempotency, concurrency, offline
Grant revocation takes effect on next call; no cached grants beyond session. No offline mode.

## Privacy, retention, abuse
Abuse case: a module owner marks its own risks accepted. Control: acceptance requires a second role outside that module (PS-133-02.R04 and PS-133-05.R02).

## Observability & budgets
Denials per week by actor role; any denial of restricted read by an engineer is logged for Security Lead review.

## Tests
- TEST-PS-133-05-01 (unit): engineer read of restricted field returns denial with no fields.
- TEST-PS-133-05-02 (unit): module owner accepting residual for another area denied.
- TEST-PS-133-05-03 (unit): LINDDUN acceptance without Privacy Lead denied.

## Acceptance criteria
1. Matrix above enforced; one test per "no" cell.
2. Denial events emitted once per denied call.
3. Capability names confirmed against CTR-CAP-001 before status leaves SPEC-DRAFT-COMPLETE.

## Assumptions & open decisions
- ASSUMPTION: Security Lead and Privacy Lead roles are held by distinct named people.
- D10 is not directly applicable (no user keys in this module).
