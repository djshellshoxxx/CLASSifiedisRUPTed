# PS-058-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/03_trust/mod_reputation. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-COM-001 (finality fixtures by reference).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-058-09.R01 | Every command, query, event and code has a named contract test. | MVP |
| PS-058-09.R02 | Build fails on unversioned schema change. | MVP |
| PS-058-09.R03 | Scoring fixtures with expected outputs for 50 synthetic histories, including farming, reversal and self-dealing. | MVP |
| PS-058-09.R04 | Nightly recompute equality test (PS-058-06 R05). | MVP |
| PS-058-09.R05 | Public band view passes a11y checks. | MVP |
| PS-058-09.R06 | Consumer contract test with ranking (mod_relevance) for band input. | Future |

## Data / schema
| Fixture | Content |
|---|---|
| `fx_repute_histories` | 50 histories with expected band and status |
| `fx_repute_reversal` | finality reversal sequences |
| `fx_repute_farming` | repeated same-pair exchanges |
| `fx_repute_suppression` | 1–4 counterparties vs 5+ |

## Commands / queries / events
[commands_queries_events.md](commands_queries_events.md) tests.

## States & transitions
Oracle: [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Registry lint for `REPUTE.*` codes.

## Authorization
Matrix tests from [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Fault injection and replay from PS-058-06.

## Privacy, retention, abuse
Privacy fixtures from PS-058-07 every build.

## Observability & budgets
Metric names asserted against PS-058-08.

## Tests
- TEST-PS-058-09-01 (contract): payloads validate.
- TEST-PS-058-09-02 (lint): error registry.
- TEST-PS-058-09-03 (property): 50 fixture histories match expected band.
- TEST-PS-058-09-04 (integration): input → band change → retirement flow.
- TEST-PS-058-09-05 (a11y): band view checks.
- TEST-PS-058-09-06 (load): nightly budget run.

## Acceptance criteria
1. 100% coverage by named tests.
2. All 50 fixture histories match expected outputs.
3. Unversioned schema change fails build.
4. Privacy fixtures zero occurrences.

## Assumptions & open decisions
- ASSUMPTION: synthetic histories are the scoring oracle until empirical data exists; weights are PROVISIONAL.
