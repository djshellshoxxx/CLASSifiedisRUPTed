# PS-056-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/02_profiles/mod_profiles. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001 (digests, compatibility), CTR-EVT-001 (envelope lint), CTR-ERR-001 (registry lint), CTR-CAP-001 (matrix), CTR-PRV-001 (zero-tolerance fixtures).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-056-09.R01 | Every command, query, event and error code of this module has a named contract test in CI. | MVP |
| PS-056-09.R02 | Build fails on any schema change without MINOR/MAJOR bump (CTR-SCH-001 R03). | MVP |
| PS-056-09.R03 | Fixtures cover valid, invalid, contact-laden, region-edge, concurrent, offline and adversarial cases from PS-056-01 to PS-056-08. | MVP |
| PS-056-09.R04 | Acceptance suite < 10 min in CI; load test nightly. | MVP |
| PS-056-09.R05 | Editor and counterparty view pass axe checks and a screen-reader script. | MVP |
| PS-056-09.R06 | Consumer contract tests for mod_reputation and listings (by `prf_` ID). | Future |

## Data / schema
| Fixture | Content |
|---|---|
| `fx_prof_valid` | bios and language sets, including NFC variants |
| `fx_prof_contact` | bios with emails, phones, URLs, messenger prefixes |
| `fx_prof_region` | cells at K_MIN boundary (4, 5 profiles) |
| `fx_prof_grant` | grant windows with revocation before and after expiry |
| `fx_prof_frozen` | profiles of retired pseudonyms |

## Commands / queries / events
Contract tests cover [commands_queries_events.md](commands_queries_events.md).

## States & transitions
State tests use [workflow_state_machine.md](workflow_state_machine.md) as oracle.

## Validation & errors
Registry lint for `PROF.*` codes (CTR-ERR-001 R02, R05).

## Authorization
Matrix tests from [authorization_capabilities.md](authorization_capabilities.md) for each principal type.

## Failure, idempotency, concurrency, offline
Fault injection and offline replay from PS-056-06 in nightly suite.

## Privacy, retention, abuse
Privacy scan fixtures from PS-056-07 in every build.

## Observability & budgets
Metric names and label sets asserted against PS-056-08.

## Tests
- TEST-PS-056-09-01 (contract): payloads validate against registry digests.
- TEST-PS-056-09-02 (lint): error registry and message keys.
- TEST-PS-056-09-03 (contract): event envelope lint; no private values.
- TEST-PS-056-09-04 (integration): create → edit → disclose → revoke → retire flow with all fixtures.
- TEST-PS-056-09-05 (a11y): editor and counterparty view checks.
- TEST-PS-056-09-06 (load): nightly read and write budgets.

## Acceptance criteria
1. 100% of commands, queries, events and codes covered by a named test.
2. Unversioned schema change fails build.
3. All privacy fixtures pass with zero occurrences.
4. Accessibility checks pass.
5. Each `PS-056-*.Rnn` maps to at least one `TEST-PS-056-*`.

## Assumptions & open decisions
- ASSUMPTION: axe-core and screen-reader script as the a11y method.
- PROVISIONAL (D05 default, unapproved): K_MIN fixtures use the default of 5.
