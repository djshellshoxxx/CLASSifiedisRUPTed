# PS-010-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/04_pricing/mod_negotiation. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-SCH-001, CTR-ERR-001, CTR-CAP-001, CTR-ID-001, CTR-COM-001 (money and quote tests), CTR-FED-001 (exclusion), CTR-PRV-001.

**Decision labels:** Test scope follows PROVISIONAL defaults D03, D07 and D08 (unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-010-09.R01 | Contract tests run in CI against each registered schema, command and error for this module. | MVP |
| PS-010-09.R02 | Property tests exercise random command sequences (≥ 10,000 sequences, ASSUMPTION) against invariants below. | MVP |
| PS-010-09.R03 | Test IDs follow `TEST-PS-010-<file nn>-<mm>`, one series per process file. Each requirement in PS-010-01 to -08 maps to ≥ 1 test ID. | MVP |
| PS-010-09.R04 | Negative and abuse cases are mandatory, not optional. | MVP |

## Data / schema
Fixtures: two buyers, one seller, one listing (active, version 3), one cross-currency listing with valid and expired quotes, one scheduler principal, one moderator with case grant, one operator, one federation peer. Fixture IDs use canonical prefixes only.

## Commands / queries / events
Contract suite covers each row of [PS-010-04](commands_queries_events.md): request, success event, each listed error, replay.

## States & transitions
Property invariants (checked after every step):
1. Terminal state never changes.
2. `revision` increases by exactly 1 per committed event.
3. `round` never decreases and never exceeds 10.
4. At most one `AWAITING_RESPONSE` per (listing, initiator).
5. `AGREED` implies `terms_hash` present and listing version equal to snapshot at commit.
6. Last proposer is never the actor of an accept or reject that committed.

## Validation & errors
Error contract: every response matches CTR-ERR-001 schema; codes are registered; retryable and HTTP status match registry.

## Authorization
Matrix tests from [PS-010-05](authorization_capabilities.md) run as part of the contract suite.

## Failure, idempotency, concurrency, offline
Fault-injection scenarios from [PS-010-06](failure_recovery_idempotency.md) run in integration (crash, timeout, replay, race).

## Privacy, retention, abuse
Privacy scan of all error bodies and events (TEST-PS-010-07-02). Federation exclusion (TEST-PS-010-04-05).

## Observability & budgets
Load and latency tests per [PS-010-08](observability_performance.md).

## Tests
- TEST-PS-010-09-01 (contract suite): all commands, events and errors in PS-010-04 pass schema and registry lint.
- TEST-PS-010-09-02 (property): 10,000 random sequences keep invariants 1–6.
- TEST-PS-010-09-03 (full lifecycle): open → counter → counter → accept produces AGREED, one event per step, no trx record.
- TEST-PS-010-09-04 (rejection paths): open → counter → reject; open → withdraw; open → deadline → expired.
- TEST-PS-010-09-05 (offline): queued accept and counter on a stale device return codes; nothing applied.
- TEST-PS-010-09-06 (cross-currency): valid quote accepted and pinned; expired quote rejected at accept with `COM.QUOTE_EXPIRED`.
- TEST-PS-010-09-07 (listing edit race): accept after listing version bump → `NEG.LISTING_CHANGED`.
- TEST-PS-010-09-08 (negative set): every code in PS-010-02 reachable by a documented input.
- TEST-PS-010-09-09 (accessibility): negotiation status and error messages readable by screen reader and keyboard-operable (F14 criteria, mobile PWA viewport).
- TEST-PS-010-09-10 (regression fixtures): golden JSON for each state and event kept under version control; changes require a schema version bump.

## Acceptance criteria
1. Contract suite passes with zero unregistered codes (TEST-PS-010-09-01).
2. Property suite finds no invariant violation in CI run (TEST-PS-010-09-02).
3. Every PS-010 requirement maps to at least one TEST-PS-010 ID (traceability table kept in module TODO).
4. TEST-PS-010-09-01 through -10 pass.

## Assumptions & open decisions
- ASSUMPTION: 10,000 property sequences per CI run.
- PROVISIONAL (D03, D07, D08 defaults, unapproved): fixtures assume pinned quotes, non-agreed retention and pending queue behavior.
- OPEN: F14 accessibility criteria for status announcements (owner Accessibility Lead).
