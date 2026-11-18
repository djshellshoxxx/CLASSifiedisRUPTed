# PS-060-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/01_messaging/mod_private. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-060-09.R01 | Every command, state, event and code has a named contract test. | MVP |
| PS-060-09.R02 | Build fails on unversioned schema change. | MVP |
| PS-060-09.R03 | Two-party conversation fixtures cover normal, blocked, closed, expired-eligibility and offline cases. | MVP |
| PS-060-09.R04 | Push payload contract test (generic default) on iOS and Android transport fixtures. | MVP |
| PS-060-09.R05 | Message list, composer and block flows pass a11y checks. | MVP |
| PS-060-09.R06 | Cross-module tests with mod_attachments and mod_pseudonyms relation checks. | MVP |

## Data / schema
| Fixture | Content |
|---|---|
| `fx_msg_pairs` | two-party conversations in each thread state |
| `fx_msg_eligibility` | exchanges at 0, 29, 31 days after close |
| `fx_msg_queue` | offline queues with block and rate events |
| `fx_msg_privacy` | bodies containing contact data, URLs, control characters |

## Commands / queries / events
[commands_queries_events.md](commands_queries_events.md) tests.

## States & transitions
Oracle: [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Registry lint for `PRIVMSG.*` codes.

## Authorization
Matrix tests from [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Fault and replay tests from PS-060-06 nightly.

## Privacy, retention, abuse
Privacy fixtures from PS-060-07 every build.

## Observability & budgets
Metric names asserted against PS-060-08.

## Tests
- TEST-PS-060-09-01 (contract): payloads validate.
- TEST-PS-060-09-02 (lint): error registry.
- TEST-PS-060-09-03 (integration): request → accept → send → block flow.
- TEST-PS-060-09-04 (contract): push payload generic by default.
- TEST-PS-060-09-05 (a11y): message list, composer, block flows.
- TEST-PS-060-09-06 (load): nightly budget run.

## Acceptance criteria
1. 100% coverage by named tests.
2. Fixture privacy scan zero occurrences.
3. Unversioned schema change fails build.
4. Eligibility boundary tests pass at 29 and 31 days.

## Assumptions & open decisions
- PROVISIONAL (D10 default, unapproved): no E2E test vectors in MVP.
