# PS-074-07 — privacy, retention and abuse controls

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/03_valuation/mod_precision (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R09, logs), CTR-COM-001 (Privacy: amounts never logged). **Decisions:** D03 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-074-07.R01 | Library never logs inputs or outputs. | MVP |
| PS-074-07.R02 | Error messages contain reason enums only (no values). | MVP |
| PS-074-07.R03 | Golden vectors contain only synthetic values; no real transaction is used as a fixture. | MVP |

## Data / schema
Not applicable.

## Commands / queries / events
Not applicable.

## States & transitions
Not applicable.

## Validation & errors
Per PS-074-02.

## Authorization
Not applicable.

## Failure, idempotency, concurrency, offline
Not applicable.

## Privacy, retention, abuse
- Amount inference from error timing: all paths run constant-time with respect to digit count within the 39-digit bound (ASSUMPTION; review).
- Vector suite contains no personal data.

## Observability & budgets
Not applicable.

## Tests
- TEST-PS-074-07-01 (lint): no logging call in library.
- TEST-PS-074-07-02 (review): vector suite scan for real addresses or account data.
- TEST-PS-074-07-03 (unit): error strings contain no input value.

## Acceptance criteria
1. No logging calls in library.
2. Vector suite clean.

## Assumptions & open decisions
- ASSUMPTION: constant-time bound review.
- D03 (PROVISIONAL default, unapproved).
