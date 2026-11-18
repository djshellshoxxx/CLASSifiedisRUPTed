# PS-123-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/04_configuration/mod_feature (F15.S04.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-123-07.R01 | Feature definitions hold no personal data (CTR-PRV-001 class PUBLIC). | MVP |
| PS-123-07.R02 | Feature names and descriptions must not reveal unreleased security controls; security-sensitive features use opaque slugs and restricted titles. | MVP |
| PS-123-07.R03 | Definition versions are kept indefinitely (RET-AUD for change records). | MVP |
| PS-123-07.R04 | Feature catalog is not exposed to unauthenticated clients. | MVP |

## Data / schema
Retention class RET-AUD for change records; definitions are public-internal metadata.

## Commands / queries / events
None beyond PS-123-04.

## States & transitions
Not applicable.

## Validation & errors
`FEATURE.DEFINITION_INVALID` if a security-sensitive feature carries a public title (lint).

## Authorization
See PS-123-05.

## Failure, idempotency, concurrency, offline
Not applicable.

## Privacy, retention, abuse
Abuse: enumeration of unreleased features via public endpoints is prevented by R04 and by generic 404 responses.

## Observability & budgets
Metric: none beyond lint results.

## Tests
- TEST-PS-123-07-01 (lint): definitions contain no personal data fields.
- TEST-PS-123-07-02 (lint): security-sensitive titles restricted.
- TEST-PS-123-07-03 (negative): unauthenticated catalog request returns `SYS.UNAUTHENTICATED`.
- TEST-PS-123-07-04 (retention): change record kept 12 months.

## Acceptance criteria
1. No personal data in catalog (TEST-01).
2. TEST-PS-123-07-01 through -04 pass.

## Assumptions & open decisions
- PROVISIONAL (D07 default).
