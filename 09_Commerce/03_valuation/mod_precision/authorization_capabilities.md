# PS-074-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/03_valuation/mod_precision (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R01, R07, R08: scope note only, the library has no capability surface), CTR-PRV-001 (R07). **Decisions:** D03 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-074-05.R01 | The library exposes no capability, role or permission check and makes no authorization decision. | MVP |
| PS-074-05.R02 | Callers authorize the parties and amounts they pass in; the library never infers a party. | MVP |
| PS-074-05.R03 | Rule-set changes (new `rules_version`) require two distinct approvers recorded in the release record (PS-074-10). | MVP |
| PS-074-05.R04 | No code path in the library reads a configuration value that changes behavior at runtime; rule behavior is fixed per `rules_version`. | MVP |
| PS-074-05.R05 | Rounding mode and scale limits are not overridable by callers. | MVP |

## Data / schema
None. The rule-set release record is defined in PS-074-10.

## Commands / queries / events
None. Callers' commands (for example `clm.submit`, `quote.issue`) are authorized by their owning modules.

## States & transitions
None.

## Validation & errors
Caller attempts to pass a rounding mode other than `HALF_EVEN` fail with `PREC.ROUNDING_UNSUPPORTED` (PS-074-02).

## Authorization
Not applicable at library level. Trust boundary: any module that calls the library is trusted to pass only validated inputs; each caller re-validates at its own boundary.

## Failure, idempotency, concurrency, offline
Not applicable.

## Privacy, retention, abuse
Not applicable at library level; see PS-074-07.

## Observability & budgets
Not applicable at library level; callers own authorization metrics.

## Tests
- TEST-PS-074-05-01 (lint): library has no network, storage, clock or environment dependency.
- TEST-PS-074-05-02 (unit): rounding override parameter does not exist in the public API.
- TEST-PS-074-05-03 (review): rule-set release record requires two approver IDs.

## Acceptance criteria
1. Library has no I/O or runtime configuration dependency.
2. Public API has no rounding or scale override.
3. Rule-set release requires two approvers (checked in PS-074-10 tests).

## Assumptions & open decisions
- ASSUMPTION: callers perform their own authorization; the library is a pure function set.
- D03 (PROVISIONAL default, unapproved).
