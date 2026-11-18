# PS-131-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/03_assurance/mod_incident. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ID-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-131-05.R01 | Declaring an incident requires `ope` or `sys_` with `create` on `security_incident`, scope `global`. | MVP |
| PS-131-05.R02 | Viewing an incident requires `case:<inc_>` scope membership; F16 leads have `global` read of metadata only, not timeline text. | MVP |
| PS-131-05.R03 | Timeline text (PRIVATE_PERSONAL) is readable only by named responders on that incident. | MVP |
| PS-131-05.R04 | Closing or reopening requires two distinct responders, one of whom is the commander. | MVP |
| PS-131-05.R05 | Every read of timeline text emits an `aud_` record without content (CTR-CAP-001 R08). | MVP |

## Data / schema
Capability IDs: `security_incident.create`, `security_incident.triage`, `security_incident.administer`, `security_incident.read`.

## Commands / queries / events
Grants to responders are time-bound (`expires_at` ≤ 72 h, CTR-CAP-001 R06) and purpose-coded.

## States & transitions
Revoking a responder grant takes effect at next decision.

## Validation & errors
| Actor | Action | Resource | Result |
|---|---|---|---|
| sys | create | incident | allow |
| responder (case member) | triage | incident | allow |
| F16 lead | read metadata | incident | allow |
| F16 lead | read timeline text | incident | DENY, SYS.FORBIDDEN unless named responder |
| user | any | incident | DENY, SYS.NOT_FOUND |

## Authorization
Dual control on close/reopen per R04.

## Failure, idempotency, concurrency, offline
Decision records (`dec_`) for every denial.

## Privacy, retention, abuse
Denials record IDs and rule names only.

## Observability & budgets
Counter `incident_authz_denied_total{rule}`.

## Tests
- TEST-PS-131-05-01: unit, decision table.
- TEST-PS-131-05-02: negative, non-responder lead denied timeline text.

## Acceptance criteria
1. Timeline text never returned to a non-named principal in fixtures.
2. Close without second responder denied.

## Assumptions & open decisions
- ASSUMPTION: responder roster maintained by F16 Security Lead.
- D07 (access retention): PROVISIONAL (D07 default, unapproved).
