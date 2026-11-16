# PS-008-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [01_LocalBazaar/03_inventory/mod_availability](SPEC.md) (F01.S03.M01; accountable role: QA Lead for test plan, Marketplace Lead for owner). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-CAP-001 (contract tests for each).

**Decisions:** Consumer set is PROVISIONAL (unapproved; consumers not yet confirmed in DEPENDENCY_MATRIX). Test scope per D08 for offline paths (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-008-09.R01 | Consumer-driven contract tests exist for every consumer below, run against all supported producer versions (CTR-SCH-001 TEST-10). | MVP |
| PS-008-09.R02 | Every requirement in PS-008-01 to -08 maps to ≥ 1 TEST-ID. Unmapped requirement fails CI. | MVP |
| PS-008-09.R03 | Two-buyer race on the last unit is an end-to-end test. | MVP |

## Consumer contracts
| Consumer | Contract under test | Test IDs |
|---|---|---|
| F01.S04.M01 `mod_offers` (`sys`) | `hold.place`, `hold.withdraw`, `hold.execute` | TEST-PS-008-09-01 |
| F01.S01.M04 `mod_archive` | listing archived → availability ARCHIVED | TEST-PS-008-09-02 |
| F01.S03.M02 `mod_variants` | `variant_ref` lifecycle | TEST-PS-008-09-03 |
| F02.S03.M02 `mod_lock` (PENDING) | cycle reservation through `hold.create` | TEST-PS-008-09-04 |

## Tests
- TEST-PS-008-09-01 (contract): `mod_offers` fixtures pass against v1 producer; error codes match PS-008-02.
- TEST-PS-008-09-02 (contract): archive event leads to ARCHIVED and PLACED holds WITHDRAWN.
- TEST-PS-008-09-03 (contract): variant removed with committed units → rejected, no counter change.
- TEST-PS-008-09-04 (contract, PENDING): cycle reservation holds and releases on dropout.
- TEST-PS-008-09-05 (e2e): two buyers race for last unit; one hold, one AVAIL.INSUFFICIENT_UNITS, owner sees one hold.
- TEST-PS-008-09-06 (traceability lint): every requirement ID across PS-008-01..08 has a TEST-ID.

## Acceptance criteria
1. All consumer contract tests pass for supported versions.
2. TEST-PS-008-09-05 passes 100 consecutive runs.
3. Traceability lint (TEST-06) reports zero unmapped requirements.
4. Accessibility: availability state and "sold out" text reachable by keyboard and screen reader (WCAG 2.1 AA; checked by F14 gate, PENDING).

## Assumptions & open decisions
- ASSUMPTION: consumer list above is complete for MVP; to be confirmed with F01.S04.M01 and F02.S03.M02 owners.
- PENDING: F02.S03.M02 contract entry in CTR-CAP-001 before TEST-04 can run.
