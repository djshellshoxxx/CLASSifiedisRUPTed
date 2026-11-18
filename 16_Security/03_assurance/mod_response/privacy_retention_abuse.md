# PS-132-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/03_assurance/mod_response. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001, CTR-FED-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-132-07.R01 | Containment records hold IDs, counts and outcomes; never the content of sessions, messages or listings. | MVP |
| PS-132-07.R02 | Session revocation targets are scopes or IDs, never raw tokens. | MVP |
| PS-132-07.R03 | A containment action that affects users must have a user-facing notice template reviewed by F10 before first use (ASSUMPTION). | MVP |
| PS-132-07.R04 | Containment actions must not be used to read private content. | MVP |
| PS-132-07.R05 | Records retained with their incident (PS-131-07.R04). | MVP |

## Data / schema
See [domain_schema.md](domain_schema.md).

## Commands / queries / events
Events carry `actor_ref` only.

## States & transitions
N/A.

## Validation & errors
Content-bearing fields rejected by PS-131-02 precise-data rule and PS-132-02 target rules.

## Authorization
Read of containment logs follows PS-131-05.

## Failure, idempotency, concurrency, offline
N/A.

## Privacy, retention, abuse
- Abuse of containment: a responder could freeze a rival's account. Mitigated by two approvals, incident linkage and audit.
- Notices to affected users state the action and the appeal route; no internal reasons (F12 appeals apply).
- Over-containment is reversible where `reversible` is true.

## Observability & budgets
Logs record action type, targets as IDs, outcome.

## Tests
- TEST-PS-132-07-01: privacy, containment logs contain no session tokens (fixture scan).
- TEST-PS-132-07-02: abuse, single-responder freeze attempt denied.
- TEST-PS-132-07-03: notice template present before user-affecting action.

## Acceptance criteria
1. Zero token or content strings in logs in fixture set.
2. User-affecting actions blocked when template absent.

## Assumptions & open decisions
- ASSUMPTION: notice template gate.
- D07 (retention): PROVISIONAL (D07 default, unapproved).
