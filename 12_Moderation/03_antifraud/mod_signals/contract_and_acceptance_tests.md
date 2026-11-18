# PS-101-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_signals (Trust&Safety Lead). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R09 golden fixtures), CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001.

**Decision labels:** Test thresholds inherit PROVISIONAL values from PS-101-07 (D07 default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-101-09.R01 | Every schema and error code in PS-101-01 to PS-101-08 has at least one contract test. | MVP |
| PS-101-09.R02 | Golden fixtures exist for each `schema_version` (CTR-SCH-001 R09). | MVP |
| PS-101-09.R03 | Consumer contract tests run for F04.S02.M01, F07.S03.M01, F12.S02.M02, F12.S03.M01, F12.S03.M03. | MVP |
| PS-101-09.R04 | Test IDs follow `TEST-PS-101-nn`; each row in the test list maps to one ID. | MVP |

## Data / schema
Fixtures stored under the module test directory: `fixtures/signal.recorded/1.0.0/*.json` (valid and invalid). Each fixture names its expected code.

## Commands / queries / events
Contract tests cover `sgn.create`, `sgn.update`, both queries and four events.

## States & transitions
State tests in PS-101-03 test list.

## Validation & errors
Each error code has a negative fixture.

## Authorization
Capability tests in PS-101-05 test list.

## Failure, idempotency, concurrency, offline
Failure tests in PS-101-06 test list.

## Privacy, retention, abuse
Privacy and abuse tests in PS-101-07 test list.

## Observability and budgets
Observability tests in PS-101-08 test list.

## Tests
Full list (one line each):
- TEST-PS-101-01 (unit): valid payload per type passes schema.
- TEST-PS-101-02 (property): 10,000 random windows satisfy hour-alignment and span rules.
- TEST-PS-101-03 (unit): each validation code raised for its single violation.
- TEST-PS-101-04 (negative): forbidden key rejected; response echoes no input value.
- TEST-PS-101-05 (integration): stale suppress returns `EVT.REVISION_CONFLICT`.
- TEST-PS-101-06 (contract): `signal.recorded` 1.0.0 golden fixture validates.
- TEST-PS-101-07 (integration): expiry at 30 days ± 1 hour.
- TEST-PS-101-08 (property): aggregates with 1–4 subjects never returned.
- TEST-PS-101-09 (integration): duplicate `sgn.create` returns same ID; one event.
- TEST-PS-101-10 (e2e): F07 burst → `auth_burst` → F12.S03.M01 reads aggregate only.
- TEST-PS-101-11 (integration): subject deletion → REDACTED within 24 hours.
- TEST-PS-101-12 to -14 (integration): moderator, user and operator access rules.
- TEST-PS-101-15 to -17 (integration/property): crash recovery, DLQ, concurrent suppress.
- TEST-PS-101-18 to -21 (negative/property): privacy and abuse controls.
- TEST-PS-101-22 to -24 (integration/load): metrics, log scan, budgets.
- Offline (a11y not applicable): no client writes; no offline test required.

## Acceptance criteria
1. TEST-PS-101-01 to -24 pass in CI.
2. Consumer contract tests in PS-101-09 R03 pass against registry versions.
3. Every requirement ID in PS-101-01 to PS-101-08 is referenced by at least one test.

## Assumptions & open decisions
- ASSUMPTION: consumer modules are reachable as test doubles in CI.
- D07 (PROVISIONAL, unapproved).
