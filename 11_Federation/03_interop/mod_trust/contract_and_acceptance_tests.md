# PS-091-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/03_interop/mod_trust. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-091-09.R01 | Every row in the PS-091-03 transition table has a passing test; every non-table pair has a test expecting `TRUST.TRANSITION_NOT_ALLOWED`. | MVP |
| PS-091-09.R02 | Contract tests validate every command, event and error against CTR-SCH-001 and CTR-ERR-001 in CI. | MVP |
| PS-091-09.R03 | Federation tests run against two test nodes with signed events (CTR-FED-001 R04). | MVP |

## Data / schema
Test fixtures: two nodes with Ed25519 key pairs (test keys only, never production material); peers in each state; a corpus of 20 invalid payloads.

## Commands / queries / events
Test IDs follow `TEST-PS-091-09-nn`.

## States & transitions
State coverage: all 5 states and all 6 transition rows exercised.

## Validation & errors
Negative corpus covers each code in PS-091-02.

## Authorization
Authorization matrix tests from PS-091-05 run as a table-driven suite.

## Failure, idempotency, concurrency, offline
Fault injection: database failure between state update and outbox insert; relay down for 10 min; clock skew of 6 min (expect `FED.CLOCK_SKEW`).

## Privacy, retention, abuse
Leakage tests from PS-091-07 included in this suite.

## Observability & budgets
Load test from PS-091-08 run before release.

## Tests
- `TEST-PS-091-09-01` unit: transition table exhaustive (5 states × 5 triggers).
- `TEST-PS-091-09-02` contract: schemas validate for all commands and events.
- `TEST-PS-091-09-03` integration: two-node quarantine blocks inbound and outbound within 60 s.
- `TEST-PS-091-09-04` integration: equivocation from a fixture peer → `FED.EQUIVOCATION`, quarantine, both events retained.
- `TEST-PS-091-09-05` integration: key compromise → events signed after `compromised_at` rejected.
- `TEST-PS-091-09-06` property: revision strictly +1 per accepted transition over random sequences.
- `TEST-PS-091-09-07` e2e (operator UI, keyboard only): admit, restrict and restore flows usable without pointer; screen reader labels on state badges.
- `TEST-PS-091-09-08` offline: client cannot submit trust commands while offline.

## Acceptance criteria
1. 100 % of transition rows and error codes covered by tests in CI.
2. Contract tests pass with schema versions pinned.
3. Two-node suite passes three consecutive runs without flakes.
4. Accessibility test TEST-PS-091-09-07 meets WCAG 2.1 AA for the operator screens (ASSUMPTION scope).

## Assumptions & open decisions
- ASSUMPTION: a shared two-node harness is provided by F11 relay sync (F11.S02).
- D01 (federated protocol), PROVISIONAL default: signed envelopes (unapproved); tests are written against that default and must be re-run if D01 changes.
