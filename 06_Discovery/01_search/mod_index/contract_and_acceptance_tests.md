# PS-045-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/01_search/mod_index. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R03, R09), CTR-EVT-001, CTR-ERR-001 (R02, R09), CTR-PRV-001; PENDING CTR-DSC-001.

**Decision labels:** Test fixture corpus is ASSUMPTION (owner F17 QA Lead).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-045-09.R01 | Every consumed `lst.*` schema has golden fixtures for each supported MAJOR and each migration path (CTR-SCH-001 R09). | MVP |
| PS-045-09.R02 | Contract tests run in CI on every change; a failing compatibility check blocks merge (CTR-SCH-001 R03). | MVP |
| PS-045-09.R03 | End-to-end test: publish → index → query → withdraw → query absent, within 60 s. | MVP |
| PS-045-09.R04 | Accessibility: query result list output has no index-specific barriers (screen reader labels from PS-045-01 fields only). | MVP |

## Data / schema
Fixture set: 500 listings across 12 region cells (ASSUMPTION), including adversarial titles (bidi, spam, phone numbers), federated fixtures (future), and K_MIN boundary cells (4 and 5 items).

## Commands / queries / events
Tests target `index.apply_event`, `index.suppress`, `index.rebuild` and `index.doc.changed`.

## States & transitions
Each state in PS-045-03 has at least one fixture reaching it.

## Validation & errors
Each code in PS-045-02 has one negative fixture.

## Authorization
Authorization matrix rows in PS-045-05 each have one allow and one deny test.

## Failure, idempotency, concurrency, offline
Chaos and replay fixtures from PS-045-06 included in this suite.

## Privacy, retention, abuse
Fixtures use synthetic data only; no real user data in test corpus.

## Observability & budgets
Test run reports latency percentiles per PS-045-08 budgets.

## Tests
- TEST-PS-045-09-01 (contract): schema golden files for all MAJOR versions.
- TEST-PS-045-09-02 (e2e): publish→withdraw→query-absent timing.
- TEST-PS-045-09-03 (a11y): query result rendering passes automated checks (owner F14).
- TEST-PS-045-09-04 (offline): client shows last server snapshot, no local index writes.

## Acceptance criteria
1. 100% of PS-045-01 to PS-045-08 requirement IDs mapped to at least one TEST ID.
2. Contract suite green on golden fixtures for current MAJOR.
3. E2E withdraw-to-absent under 60 s on reference profile.

## Assumptions & open decisions
- ASSUMPTION: synthetic fixture corpus is sufficient for MVP.
- D08 PROVISIONAL: offline behavior is read-only.
