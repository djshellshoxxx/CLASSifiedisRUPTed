# PS-140-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/02_performance/mod_offline. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-140-09.R01 | Every module-owned event and error code passes registry lint before merge. | MVP |
| PS-140-09.R02 | The MVP catalogue has at least 12 scenarios; each has a passing run on the reference profile for the release candidate. | MVP |
| PS-140-09.R03 | Contract tests run against the F15 offline queue contract (PS-116-*) in a staging environment. | MVP |

## Tests
- TEST-PS-140-09-01 (contract, lint): `offline_*` event types match the CTR-EVT-001 regex; payloads conform to CTR-SCH-001.
- TEST-PS-140-09-02 (contract, lint): OFFTEST codes match CTR-ERR-001 R02 and have fixed category and retryable values.
- TEST-PS-140-09-03 (integration): airplane-mode scenario produces `queued_then_synced` against the F15 queue.
- TEST-PS-140-09-04 (offline): duplicate delivery on reconnect applies each write once.
- TEST-PS-140-09-05 (integration): revoked grant at reconnect yields `rejected_with_code` with a CTR-CAP-001 deny code.
- TEST-PS-140-09-06 (negative): non-synthetic fixture is rejected at write and at merge.
- TEST-PS-140-09-07 (property): for any reconnect order of N writes, final server state equals one serial replay.

## Acceptance criteria
1. All TEST-PS-140-09-01 to -07 pass in CI.
2. Every MVP scenario has an approved expected outcome.
3. Contract tests fail the build on any breaking change to a v1 command or event.

## Assumptions & open decisions
- ASSUMPTION: staging environment with the F15 queue exists before scenario implementation.
- D08 (offline writes) defines the expected outcomes: PROVISIONAL (D08 default, unapproved).
