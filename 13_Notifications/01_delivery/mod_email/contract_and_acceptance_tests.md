# PS-102-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/01_delivery/mod_email (Platform Lead). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R09 golden fixtures), CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001.

**Decision labels:** Test thresholds inherit PROVISIONAL values from PS-102-07 (D07 and D10 defaults, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-102-09.R01 | Every error code and event in PS-102-02 to PS-102-08 has at least one test. | MVP |
| PS-102-09.R02 | Golden fixtures per template version and per event schema version (CTR-SCH-001 R09). | MVP |
| PS-102-09.R03 | Provider contract tests run against a sandbox or recorded fixtures; live provider calls are not part of CI. | MVP |
| PS-102-09.R04 | Consumer contract tests run for F07.S01.M03 (`mod_recovery`) and F13.S02.M03 (`mod_opt`). | MVP |

## Data / schema
Fixtures under the module test directory: `fixtures/email_delivery.sent/1.0.0/*.json`, `fixtures/templates/<id>/<version>/*.json`.

## Commands / queries / events
Contract tests for five commands, one query and seven events (PS-102-04).

## States & transitions
Transition tests in PS-102-03.

## Validation & errors
Negative fixture per code (PS-102-02).

## Authorization
Access tests in PS-102-05.

## Failure, idempotency, concurrency, offline
Fault-injection tests in PS-102-06.

## Privacy, retention, abuse
Privacy tests in PS-102-07.

## Observability and budgets
Observability tests in PS-102-08.

## Tests
- TEST-PS-102-01 (unit): binding limit and duplicate normalized address.
- TEST-PS-102-02 (negative): storage dump has no plaintext address.
- TEST-PS-102-03 to -05 (unit/negative): address length boundary, header injection, template variable rejection.
- TEST-PS-102-06 to -08 (unit/integration): binding transitions, bounce cap, verification TTL.
- TEST-PS-102-09 to -11 (contract/negative): event fixture, webhook HMAC, status masking.
- TEST-PS-102-12 to -14 (integration): access rules and recovery boundary.
- TEST-PS-102-15 to -18 (integration/property): crash recovery, concurrent verify, breaker, expiry.
- TEST-PS-102-19 to -22 (negative/integration): log scan, deletion, enumeration, rate limit.
- TEST-PS-102-23 to -25 (integration/load): metrics, log scan, throughput.
- TEST-PS-102-26 (e2e): bind → verify → recovery mail → send counted; address visible only to owner.
- Accessibility: not applicable to the sending service; accessibility of email HTML templates is tested under F14 (TEST-PS-102-27, a11y, template lint).
- TEST-PS-102-28 to -31 (integration): owner export, deleted-account restore, template rollback, provider failover (PS-102-10).
- Offline: not applicable.

## Acceptance criteria
1. TEST-PS-102-01 to -31 pass in CI, with the e2e and a11y tests run in staging.
2. Consumer contract tests pass against registry versions.
3. Each requirement in PS-102-01 to PS-102-08 is referenced by at least one test ID.

## Assumptions & open decisions
- ASSUMPTION: a sandbox mailbox provider is available in staging.
- D07 and D10 (PROVISIONAL, unapproved).
