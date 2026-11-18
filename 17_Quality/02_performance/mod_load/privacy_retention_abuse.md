# PS-139-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/02_performance/mod_load. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-139-07.R01 | Synthetic population only; no account created for load maps to a real person. | MVP |
| PS-139-07.R02 | Load payloads contain generated text and test cell coordinates (CTR-PRV-001 R04 cell set), never real addresses. | MVP |
| PS-139-07.R03 | Run results retained 365 days (ASSUMPTION), counts and percentiles only. | MVP |
| PS-139-07.R04 | Load traffic is tagged with a test marker header; production abuse controls must recognise and not count it as user abuse. | MVP |

## Data / schema
See [domain_schema.md](domain_schema.md).

## Commands / queries / events
N/A.

## States & transitions
N/A.

## Validation & errors
Payloads failing PS-139-07.R02 rejected by [validation_rules.md](validation_rules.md) pattern lint.

## Authorization
Per PS-139-05.

## Failure, idempotency, concurrency, offline
N/A.

## Privacy, retention, abuse
- Abuse: load generator used against real services is prevented by the production block and egress allowlist.
- Test marker header is a test-only signal; it grants no authorization.
- Load traffic must not be used to probe rate-limit bypass on production.

## Observability & budgets
Logs contain run IDs and counts only.

## Tests
- TEST-PS-139-07-01: privacy, payload lint finds no non-cell coordinates.
- TEST-PS-139-07-02: marker header grants no extra capability (negative).

## Acceptance criteria
1. Zero non-synthetic identifiers in load payload corpus.
2. Marker header has no authorization effect in fixtures.

## Assumptions & open decisions
- ASSUMPTION: 365-day retention.
- D07 (retention): PROVISIONAL (D07 default, unapproved).
