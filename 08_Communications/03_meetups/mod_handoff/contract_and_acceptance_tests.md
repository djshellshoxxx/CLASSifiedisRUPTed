# PS-065-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/03_meetups/mod_handoff. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-COM-001 (signature vectors by reference), CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-065-09.R01 | Every command, state, event and code has a named contract test. | MVP |
| PS-065-09.R02 | Build fails on unversioned schema change. | MVP |
| PS-065-09.R03 | Two-party fixtures: matching lines, partial lines, conflicting quantities, unilateral lines, withdrawn lines, window edges. | MVP |
| PS-065-09.R04 | Signature vectors from the chosen audited library pass. | MVP |
| PS-065-09.R05 | Attestation and state views pass a11y checks. | MVP |
| PS-065-09.R06 | Cross-module tests with F09 dispute referral and mod_coordination meetup reference. | MVP |

## Data / schema
| Fixture | Content |
|---|---|
| `fx_hand_pairs` | matching, partial, conflicting, unilateral attestations |
| `fx_hand_window` | attestations at window close minus and plus 1 s |
| `fx_hand_sig` | valid, tampered, revoked-key signatures |
| `fx_hand_privacy` | fixtures with location-like and amount-like text |

## Commands / queries / events
[commands_queries_events.md](commands_queries_events.md) tests.

## States & transitions
Oracle: [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Registry lint for `HANDOFF.*` codes.

## Authorization
Matrix tests from [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Fault and offline replay tests from PS-065-06.

## Privacy, retention, abuse
Privacy fixtures from PS-065-07 every build.

## Observability & budgets
Metric names asserted against PS-065-08.

## Tests
- TEST-PS-065-09-01 (contract): payloads validate.
- TEST-PS-065-09-02 (lint): error registry.
- TEST-PS-065-09-03 (property): state derived only from lines; fixture set matches expected states.
- TEST-PS-065-09-04 (contract): signature vectors pass.
- TEST-PS-065-09-05 (a11y): attestation and state views.
- TEST-PS-065-09-06 (load): nightly budget run.

## Acceptance criteria
1. 100% coverage by named tests.
2. Fixture outcomes match expected states.
3. Signature vectors pass; tampered and revoked fail.
4. Privacy fixtures pass with zero occurrences.

## Assumptions & open decisions
- PENDING CTR-ID-001: handoff prefix before final fixture IDs.
- ASSUMPTION: audited Ed25519 library from the research record (pending).
