# PS-057-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/03_trust/mod_evidence. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-EVT-001 (envelope and signature-field lint), CTR-ERR-001 (registry lint), CTR-CAP-001 (matrix), CTR-PRV-001 (zero-tolerance), CTR-COM-001 (signature test vectors reused by reference).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-057-09.R01 | Every command, query, event and code has a named contract test. | MVP |
| PS-057-09.R02 | Build fails on unversioned schema change. | MVP |
| PS-057-09.R03 | Signature test vectors for Ed25519 (valid, tampered, revoked key) run in CI from the chosen audited library's vectors. | MVP |
| PS-057-09.R04 | Fixtures cover PS-057-01 to PS-057-08 cases. | MVP |
| PS-057-09.R05 | Summary and record views pass automated a11y checks. | MVP |
| PS-057-09.R06 | Cross-module contract test with mod_reputation summary consumer. | Future |

## Data / schema
| Fixture | Content |
|---|---|
| `fx_tev_kinds` | one record per `kind`, valid and invalid |
| `fx_tev_sig` | valid, tampered, revoked-key signatures |
| `fx_tev_supersede` | chains, cycles, withdrawn targets |
| `fx_tev_equiv` | equivocating pairs |
| `fx_tev_privacy` | document-like and contact-laden content |

## Commands / queries / events
Covered by [commands_queries_events.md](commands_queries_events.md) tests.

## States & transitions
Oracle: [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Registry lint for `EVIDENCE.*` codes.

## Authorization
Matrix tests from [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Fault injection and offline replay from PS-057-06 in nightly suite.

## Privacy, retention, abuse
Privacy fixtures from PS-057-07 in every build.

## Observability & budgets
Metric names and labels asserted against PS-057-08.

## Tests
- TEST-PS-057-09-01 (contract): payloads validate against registry.
- TEST-PS-057-09-02 (lint): error registry and message keys.
- TEST-PS-057-09-03 (contract): Ed25519 vectors from the chosen library pass.
- TEST-PS-057-09-04 (integration): record → supersede → withdraw flow with fixtures.
- TEST-PS-057-09-05 (a11y): record and summary views.
- TEST-PS-057-09-06 (load): nightly budget run.

## Acceptance criteria
1. 100% of commands, queries, events and codes covered.
2. Unversioned schema change fails build.
3. Signature vectors pass; tampered and revoked cases fail as specified.
4. Privacy fixtures pass with zero occurrences.

## Assumptions & open decisions
- ASSUMPTION: audited Ed25519 library chosen in research record (pending).
- PROVISIONAL (D06 default, unapproved): signed statements only.
