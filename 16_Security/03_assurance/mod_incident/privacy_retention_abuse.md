# PS-131-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/03_assurance/mod_incident. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001, CTR-FED-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-131-07.R01 | Incident records contain bucketed counts only; no individual identifiers in `affected_scope`. | MVP |
| PS-131-07.R02 | Timeline text is PRIVATE_PERSONAL and access-controlled per PS-131-05. | MVP |
| PS-131-07.R03 | Incident data never federates; only a sanitized peer notice (no counts below 10, no class above PUBLIC) may be sent (CTR-FED-001 R03). | MVP |
| PS-131-07.R04 | Closed incidents retained 5 years as security records (ASSUMPTION) subject to D07 and legal hold (CTR-PRV-001 R07). | MVP |
| PS-131-07.R05 | Incident records must not be used as a surveillance source for individual users. | MVP |

## Data / schema
See [domain_schema.md](domain_schema.md).

## Commands / queries / events
Events carry no timeline text and no individual IDs beyond `actor_ref`.

## States & transitions
Retention clock starts at `closed`.

## Validation & errors
Precise data in text rejected per PS-131-02.R04.

## Authorization
Per PS-131-05.

## Failure, idempotency, concurrency, offline
N/A.

## Privacy, retention, abuse
- Abuse of the incident process to target users (false incident declarations) is controlled by severity review and audit of declarations.
- Legal holds scoped to `inc_` ID with `ope` approval and dual control (CTR-PRV-001 R07).
- Notification deadlines are not auto-computed; jurisdiction review is OPEN.

## Observability & budgets
Logs record IDs and states only.

## Tests
- TEST-PS-131-07-01: privacy, aggregate counts never below 10 in peer notice.
- TEST-PS-131-07-02: retention, record purged at 5 years in test clock.
- TEST-PS-131-07-03: legal hold extends retention for scoped incident only.

## Acceptance criteria
1. Zero individual IDs in incident aggregates in fixture export.
2. Hold released automatically on end date.

## Assumptions & open decisions
- ASSUMPTION: 5-year retention and 10-count floor.
- D07 (retention): PROVISIONAL (D07 default, unapproved). Jurisdiction breach-notification rules OPEN (CTR-PRV-001 R07).
