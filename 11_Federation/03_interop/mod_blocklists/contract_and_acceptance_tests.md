# PS-089-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/03_interop/mod_blocklists. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001, CTR-EVT-001, CTR-CAP-001, CTR-PRV-001, CTR-SCH-001, CTR-ID-001, CTR-ERR-001 (all referenced, none redefined here).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-089-09.R01 | Contract conformance suite runs in CI against each referenced contract; release blocked on failure. | MVP |
| PS-089-09.R02 | Every `blocklist.*` event and command payload validates against its registered schema (PENDING CTR-SCH-001) and the CTR-EVT-001 envelope. | MVP |
| PS-089-09.R03 | Each error code defined in PS-089-02, -03, -05 and -06 has one fixture that produces exactly that code. | MVP |
| PS-089-09.R04 | Federation contract: each exported event is independently signed; inbound events are re-keyed (`correlation_id`) and stripped of `idempotency_key` (CTR-FED-001 R08, CTR-EVT-001 R13). | MVP |
| PS-089-09.R05 | Consumers (F12 reason codes, F16 keys and grants) are referenced by ID only; no copied foreign schema. Lint rejects inline copies. | MVP |

## Data / schema
Fixtures: one valid and one invalid per schema in PS-089-01 and PS-089-04. Contract references: CTR IDs only. Breaking change example: removing a `reason_code` value is a closed-enum MAJOR change (CTR-SCH-001 R04) and fails `SCH.BREAKING_UNVERSIONED` without a new major version.

## Commands / queries / events
Contract tests exercise the commands and events in PS-089-04 end to end, through the CTR-FED-001 ingress and egress paths.

## States & transitions
Contract tests assert the transition table in PS-089-03 for each fixture.

## Validation & errors
Each fixture asserts exact code and retryable flag from the owning spec.

## Authorization
Contract tests include one case per matrix row of PS-089-05.

## Failure, idempotency, concurrency, offline
Contract tests include replay, duplicate and unknown-key fixtures (CTR-FED-001 FED.KEY_UNKNOWN deferred; FED.KEY_REVOKED rejected).

## Privacy, retention, abuse
Fixtures use synthetic IDs only. Real peer data is never used in test fixtures.

## Observability & budgets
Suite runtime ≤ 10 min in CI (ASSUMPTION). Failure output lists contract ID and test ID.

## Tests
- TEST-PS-089-09-01 (contract): all six `blocklist.*` event schemas validate; invalid fixtures rejected.
- TEST-PS-089-09-02 (contract): export strips `idempotency_key`, re-keys `correlation_id`, sets `origin_node`.
- TEST-PS-089-09-03 (contract): unknown signing key → `FED.KEY_UNKNOWN` (deferred); revoked key → `FED.KEY_REVOKED`.
- TEST-PS-089-09-04 (contract): one fixture per error code; each yields exactly that code.
- TEST-PS-089-09-05 (contract): federated payloads contain only PS-089-07 allowlisted fields.
- TEST-PS-089-09-06 (contract): removing an enum value fails the compatibility checker.
- TEST-PS-089-09-07 (integration): trusted peer → `proposed`; restricted → inbound only; quarantined → `FED.PEER_NOT_TRUSTED`.

## Acceptance criteria
1. TEST-PS-089-09-01 through -07 pass in CI.
2. No inline copies of foreign contracts; TEST-PS-089-09-05 and lint from R05 pass.
3. Every error code in PS-089-02, -03, -05, -06 has a passing fixture.

## Assumptions & open decisions
Decision register: [DECISIONS.md](../../../DECISIONS.md). Labels below are PROVISIONAL (default, unapproved) where marked.
- PENDING CTR-ID-001 and CTR-SCH-001 registration of `blk` and `blocklist.*`.
- OPEN (CTR-FED-001): distribution format. Default signed events (PROVISIONAL, D01).
