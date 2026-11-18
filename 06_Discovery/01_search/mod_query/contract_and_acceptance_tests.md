# PS-046-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/01_search/mod_query. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R03, R09), CTR-ERR-001 (R02), CTR-CAP-001; PENDING CTR-DSC-001.

**Decision labels:** Fixture corpus is ASSUMPTION (owner F17 QA Lead).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-046-09.R01 | Golden fixtures for every request schema MAJOR and every error code in PS-046-02. | MVP |
| PS-046-09.R02 | Contract test: response items conform to index doc subset (PS-045-01). | MVP |
| PS-046-09.R03 | E2E: publish → search returns item within 60 s; withdraw → absent. | MVP |
| PS-046-09.R04 | Accessibility: result list announces count bucket and zero-result text via polite live region (owner F14). | MVP |

## Data / schema
Fixtures: 200 query strings including Unicode, bidi, long tokens, empty, guest and `acc_` principals, 12 cells, cursor tamper set.

## Commands / queries / events
Tests target `discovery.search` and aggregate event.

## States & transitions
Each state in PS-046-03 reached by at least one fixture.

## Validation & errors
One negative fixture per code.

## Authorization
One allow and one deny fixture per PS-046-05 row.

## Failure, idempotency, concurrency, offline
Chaos fixtures from PS-046-06.

## Privacy, retention, abuse
Synthetic query strings only; no real user text in corpus.

## Observability & budgets
Latency report per run against PS-046-08 budgets.

## Tests
- TEST-PS-046-09-01 (contract): request and page schemas match registry.
- TEST-PS-046-09-02 (e2e): publish→search→withdraw→absent.
- TEST-PS-046-09-03 (a11y): live-region announcement for zero results.
- TEST-PS-046-09-04 (offline): cached results labelled stale.

## Acceptance criteria
1. Every PS-046 requirement ID mapped to ≥ 1 TEST ID.
2. Contract suite green on current MAJOR.
3. Accessibility automated checks pass for result list.

## Assumptions & open decisions
- ASSUMPTION: synthetic fixture corpus suffices for MVP.
