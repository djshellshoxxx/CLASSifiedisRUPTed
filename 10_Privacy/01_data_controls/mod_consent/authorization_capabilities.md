# PS-076-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_consent. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-076-05.R01 | Only the subject may grant or withdraw consent for their own `acc_`. Request-body `subject` is ignored. | MVP |
| PS-076-05.R02 | No operator, moderator or support role can grant or withdraw consent on behalf of a subject. | MVP |
| PS-076-05.R03 | Operator read of consent records requires a `case` grant with dual control (CTR-CAP-001 R06, R07). | MVP |
| PS-076-05.R04 | Default deny for any action not in the matrix below. | MVP |

## Data / schema
Capability vocabulary used: `consent.consent`, `consent.withdraw`, `consent.read`, `consent.export`. Fields visible per [domain_schema.md](domain_schema.md).

## Commands / queries / events
Mapped in [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Not applicable beyond grant status effects in [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Forbidden: `SYS.FORBIDDEN` (visible object). Not visible: `SYS.NOT_FOUND`.

## Authorization
| Actor | Action | Resource | Outcome |
|---|---|---|---|
| subject (owner) | consent.consent, consent.withdraw, consent.read | own record | ALLOW (owner) |
| subject | any | another subject's record | DENY, `SYS.NOT_FOUND` |
| item owner | consent.read | `scope.ref` status only | ALLOW for status field (ASSUMPTION) |
| ope (single approval) | consent.read | any record | DENY, `CAP.DUAL_APPROVAL_REQUIRED` |
| ope (dual approval, case scope) | consent.read | record in `cas_` | ALLOW (grant), audit record |
| mod, global admin | consent.consent | any | DENY |
| sys_ | consent.expire, consent.supersede | any | ALLOW (system scope) |

## Failure, idempotency, concurrency, offline
Authorization decision fails closed (`SYS.UNAVAILABLE`, retryable). Offline clients never decide; queued writes re-authorized at commit (CTR-CAP-001).

## Privacy, retention, abuse
Every privileged read emits an `aud_` record without content (CTR-CAP-001 R08). Grants limited to 72 h (CTR-CAP-001 R06).

## Observability & budgets
Metric `consent_authz_denies_total{action,reason_code}`. Alert on any privileged read outside an active case.

## Tests
- TEST-PS-076-05-01 (matrix): every row of the table produces the stated outcome.
- TEST-PS-076-05-02 (negative): cross-subject ID guessing returns `SYS.NOT_FOUND`.
- TEST-PS-076-05-03 (privileged): operator read with single approval is rejected.

## Acceptance criteria
1. Subject-only write rule holds in all tests.
2. Default deny holds for every undeclared action.
3. Matrix tests pass in CI.

## Assumptions & open decisions
- ASSUMPTION: item owner sees status of consent tied to their item only.
- PROVISIONAL (CTR-CAP-001 default, unapproved): dual control for operator access.
