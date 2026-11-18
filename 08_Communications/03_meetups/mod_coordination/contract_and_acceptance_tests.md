# PS-064-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/03_meetups/mod_coordination. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001 (zero-tolerance fixtures), CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-064-09.R01 | Every command, state, event and code has a named contract test. | MVP |
| PS-064-09.R02 | Build fails on unversioned schema change. | MVP |
| PS-064-09.R03 | Fixtures for window boundaries, DST transitions, venue registry changes, reschedule limit. | MVP |
| PS-064-09.R04 | Zero-tolerance fixture scan for coordinates in public, event, log and push outputs. | MVP |
| PS-064-09.R05 | Planning and point views pass a11y checks. | MVP |
| PS-064-09.R06 | Cross-module tests with mod_private membership and mod_handoff reference. | MVP |

## Data / schema
| Fixture | Content |
|---|---|
| `fx_coord_windows` | 1 h, 30 days, 6 h, DST-crossing windows |
| `fx_coord_points` | valid and invalid points, expiry edges |
| `fx_coord_venues` | venue listed, delisted mid-flow |
| `fx_coord_privacy` | place text and point values to detect leakage |

## Commands / queries / events
[commands_queries_events.md](commands_queries_events.md) tests.

## States & transitions
Oracle: [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Registry lint for `COORD.*` codes.

## Authorization
Matrix tests from [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Fault injection and sweep-disabled tests from PS-064-06.

## Privacy, retention, abuse
Privacy scan fixtures from PS-064-07 every build.

## Observability & budgets
Metric names asserted against PS-064-08.

## Tests
- TEST-PS-064-09-01 (contract): payloads validate.
- TEST-PS-064-09-02 (lint): error registry.
- TEST-PS-064-09-03 (integration): propose → accept → share point → expire flow.
- TEST-PS-064-09-04 (privacy): zero coordinate occurrences in fixture outputs.
- TEST-PS-064-09-05 (a11y): planning and point views.
- TEST-PS-064-09-06 (load): nightly budget run.

## Acceptance criteria
1. 100% coverage by named tests.
2. Zero coordinate occurrences outside grantee responses.
3. DST and boundary fixtures pass.
4. Unversioned schema change fails build.

## Assumptions & open decisions
- PENDING CTR-ID-001: prefix for meetup record before contract tests can fix IDs.
