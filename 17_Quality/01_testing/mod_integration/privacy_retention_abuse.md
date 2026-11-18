# PS-135-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_integration. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-FED-001, CTR-CAP-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-135-07.R01 | Fixtures use synthetic identities only (`acc_` IDs generated for tests, never mapped to real accounts). | MVP |
| PS-135-07.R02 | Coordinates in fixtures use test regions with 2-decimal precision (about 1 km) at most. | MVP |
| PS-135-07.R03 | Test logs are redacted: no request bodies, no tokens (CTR-ERR-001 R10). | MVP |
| PS-135-07.R04 | Run records retained 180 days (ASSUMPTION), then summarized to counts. | MVP |
| PS-135-07.R05 | Staging seeded environment contains no production data copies. | MVP |

## Data / schema
See [domain_schema.md](domain_schema.md).

## Commands / queries / events
Events carry no fixture content.

## States & transitions
N/A.

## Validation & errors
Lint per [validation_rules.md](validation_rules.md).

## Authorization
Access to staging seed content limited to QA Lead.

## Failure, idempotency, concurrency, offline
N/A.

## Privacy, retention, abuse
- Abuse: test suites must not be used to probe real services; network egress to production hosts blocked in CI.
- Federation tests use test-only peer keys (CTR-FED-001).

## Observability & budgets
Logs scanned for personal-data patterns after each run.

## Tests
- TEST-PS-135-07-01: privacy, log scan finds zero matches.
- TEST-PS-135-07-02: egress, production host connection attempt fails in CI.

## Acceptance criteria
1. Zero personal-data matches in logs over the test corpus.
2. Egress block verified in CI.

## Assumptions & open decisions
- ASSUMPTION: 180-day run retention.
- D07 (retention): PROVISIONAL (D07 default, unapproved).
