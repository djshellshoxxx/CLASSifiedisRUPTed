# PS-052-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/01_accounts/mod_pseudonyms. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001 (schema registry), CTR-EVT-001 (envelope lint), CTR-ERR-001 (registry lint, message keys), CTR-CAP-001 (matrix tests), CTR-PRV-001 (zero-tolerance fixtures), CTR-ID-001 (ID lint).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-052-09.R01 | Every command, query, event and error code of this module has a contract test in CI. | MVP |
| PS-052-09.R02 | Contract tests run against registered schema digests (CTR-SCH-001 R02); any change without version bump fails the build. | MVP |
| PS-052-09.R03 | Fixture set covers normal, invalid, duplicate, concurrent, offline and adversarial cases from PS-052-01 to PS-052-08. | MVP |
| PS-052-09.R04 | Acceptance suite runs in < 10 min on CI; full load test is nightly. | MVP |
| PS-052-09.R05 | Mobile-web accessibility checks on create and retire flows (WCAG 2.1 AA, F14). | MVP |
| PS-052-09.R06 | Cross-module consumer contract tests for mod_profiles, mod_reputation and listings (reference by `prf_` only). | Future (needs consumers implemented) |

## Data / schema
Fixture families:

| Fixture | Content |
|---|---|
| `fx_pseud_valid` | 20 valid handles and labels, incl. NFKC variants |
| `fx_pseud_invalid` | handles and labels violating each rule |
| `fx_pseud_contact` | labels with email, phone, URL, street address |
| `fx_pseud_race` | 50 concurrent claims on one handle |
| `fx_pseud_enum` | private and non-existent `prf_` IDs |

## Commands / queries / events
Contract tests cover the payloads in [commands_queries_events.md](commands_queries_events.md).

## States & transitions
State-machine tests use the table in [workflow_state_machine.md](workflow_state_machine.md) as oracle.

## Validation & errors
Registry lint: each code matches `^[A-Z]{2,8}\.[A-Z][A-Z0-9_]{2,47}$`; `message_key` derivable; `retryable` present (CTR-ERR-001 R02, R05).

## Authorization
Matrix tests from [authorization_capabilities.md](authorization_capabilities.md) run for every principal type.

## Failure, idempotency, concurrency, offline
Fault injection and offline replay tests from PS-052-06 run in the nightly suite.

## Privacy, retention, abuse
Privacy scan fixtures from PS-052-07 run in every build.

## Observability & budgets
Contract tests assert metric names and label sets match PS-052-08.

## Tests
- TEST-PS-052-09-01 (contract): schema validation of all payloads against registry digests.
- TEST-PS-052-09-02 (lint): error registry and `message_key` derivation.
- TEST-PS-052-09-03 (contract): CTR-EVT-001 envelope lint on all events; no forbidden fields.
- TEST-PS-052-09-04 (integration): full create → change → retire flow with all fixtures.
- TEST-PS-052-09-05 (a11y): create and retire flows pass automated axe checks plus manual screen-reader script.
- TEST-PS-052-09-06 (load): nightly 50 creates/s run meets PS-052-08 budgets.

## Acceptance criteria
1. 100% of commands, queries, events and error codes covered by a named test.
2. Build fails on unversioned schema change.
3. All privacy fixtures pass with zero occurrences.
4. Accessibility checks pass for create and retire flows.
5. Traceability: each `PS-052-*.Rnn` mapped to at least one `TEST-PS-052-*`.

## Assumptions & open decisions
- ASSUMPTION: axe-core and screen-reader script are the a11y method; F14 owns the final checklist.
- PROVISIONAL (D10 default, unapproved): no key-based test fixtures in MVP.
