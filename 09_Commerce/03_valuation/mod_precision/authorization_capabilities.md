# PS-074-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/03_valuation/mod_precision (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (scope note: library has no capability surface). **Decisions:** D03 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-074-05.R01 | Library exposes no capability and makes no authorization decision. | MVP |
| PS-074-05.R02 | Rule-set changes are restricted to the Commerce Lead role through the release process (PS-074-10). | MVP |

## Data / schema
None.

## Commands / queries / events
None.

## States & transitions
None.

## Validation & errors
None.

## Authorization
Callers are responsible for authorization of the amounts they pass.

## Failure, idempotency, concurrency, offline
Not applicable.

## Privacy, retention, abuse
Not applicable.

## Observability & budgets
Not applicable.

## Tests
- TEST-PS-074-05-01 (lint): no network or storage dependency in library.
- TEST-PS-074-05-02 (review): release process requires two approvers for rule changes.

## Acceptance criteria
1. Library has no I/O dependency.
2. Rule change process tested.

## Assumptions & open decisions
- D03 (PROVISIONAL default, unapproved).
