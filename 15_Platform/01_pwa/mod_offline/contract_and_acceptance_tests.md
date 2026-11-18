# PS-116-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/01_pwa/mod_offline (F15.S01.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-ID-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-116-09.R01 | Consumer contract tests run for every offline-capable command against each supported producer schema version (CTR-SCH-001 R09). | MVP |
| PS-116-09.R02 | Offline e2e suite runs on a throttled profile (0 kbps, 150 kbps, 3 s RTT) and on airplane mode with reconnect. | MVP |
| PS-116-09.R03 | Accessibility: every state badge has text and icon, is announced once per change, and passes WCAG 2.1 AA contrast (F14). | MVP |
| PS-116-09.R04 | Property tests generate random command sequences, crashes and error codes; invariants in PS-116-03 hold. | MVP |
| PS-116-09.R05 | Test fixtures are synthetic; no real account or payload data (CTR-SCH-001). | MVP |

## Data / schema
Fixture set: `fixtures/offline/<command_type>/<schema_version>/*.json` (synthetic). Each fixture lists expected state sequence.

## Commands / queries / events
Not applicable. Tests call the public contract of PS-116-04.

## States & transitions
Invariants: no `applied` without `server_ref`; no entry removed while `queued`, `sending` or `not_applied`; order per aggregate preserved.

## Validation & errors
Error-code fixtures cover every code in PS-116-02 and PS-116-06.

## Authorization
Two accounts in the same test device verify isolation (PS-116-05 R02).

## Failure, idempotency, concurrency, offline
Chaos cases: kill during write, kill during send, duplicate ack, reordered ack, clock skew of +/- 10 minutes.

## Privacy, retention, abuse
Test logs are scanned for fixture secrets; test data is deleted after each run.

## Observability & budgets
Test run time for the offline suite <= 20 min in CI (ASSUMPTION).

## Tests
- TEST-PS-116-09-01 (contract): all offline-capable commands pass owner contract tests.
- TEST-PS-116-09-02 (e2e offline): 2 h airplane mode with 50 mixed entries; final state matches fixture.
- TEST-PS-116-09-03 (a11y): screen reader announces each state change once.
- TEST-PS-116-09-04 (property): 10,000 sequences, invariants hold.
- TEST-PS-116-09-05 (lint): fixture scan finds no real data.

## Acceptance criteria
1. Zero failing contract tests for offline-capable commands.
2. TEST-PS-116-09-01 through -05 pass in CI.

## Assumptions & open decisions
- ASSUMPTION: test device matrix defined by F17 (OPEN).
- PROVISIONAL (D08 default).
