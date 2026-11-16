# PS-007-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/02_listing_types/mod_wanted. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R03 compatibility checker), CTR-EVT-001, CTR-ERR-001 (R02 registry lint), CTR-FED-001, PENDING CTR-LST-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-007-09.R01 | Contract tests cover `listing.wanted_fields`, every command in PS-007-04, every event type, and every error code in PS-007-02. | MVP |
| PS-007-09.R02 | Consumers reference schemas by canonical ID. No consumer redefines a schema. | MVP |
| PS-007-09.R03 | A breaking change fails CI through the CTR-SCH-001 compatibility checker. | MVP |
| PS-007-09.R04 | Every acceptance criterion in PS-007-01…10 maps to at least one TEST ID. Traceability is 100%. | MVP |
| PS-007-09.R05 | Line coverage ≥ 90% for validation and state modules (ASSUMPTION). Property tests cover the state machine. | MVP |

## Data / schema
Consumer contract list:

| Contract | Producer | Consumer | Test |
|---|---|---|---|
| `listing.wanted_fields` 1.0.0 | mod_wanted | 06_Discovery index (projection) | TEST-PS-007-09-01 |
| Commands v1 | mod_wanted | PWA client (15_Platform) | TEST-PS-007-09-02 |
| `listing.*` events | mod_wanted | 04_pricing/mod_offers, F13 notifications | TEST-PS-007-09-03 |
| Moderation hooks (`cas_` status) | F12 | mod_wanted | TEST-PS-007-09-04 |
| Owner export | mod_wanted | F10 export | TEST-PS-007-09-05 (see PS-007-10) |

## Commands / queries / events
Contract tests run against the schema digests in CTR-SCH-001. Event replay is covered in PS-007-06.

## States & transitions
Consumers must handle every state in PS-007-03, including `suspended` and `tombstoned`.

## Validation & errors
Consumers must handle every code in PS-007-02 by `message_key`. Unknown codes are treated as non-retryable.

## Authorization
Contract tests include a negative case per consumer: a consumer without the matching capability gets `SYS.FORBIDDEN` or `SYS.NOT_FOUND`.

## Failure, idempotency, concurrency, offline
Consumer tests replay duplicate and out-of-order events (CTR-EVT R02, R03).

## Privacy, retention, abuse
Contract fixtures use synthetic `acc_` and `prf_` values only. No real personal data in fixtures.

## Observability & budgets
Contract test results published in CI summary. Failures block merge.

## Tests
- TEST-PS-007-09-01 (contract, consumer-driven): 06_Discovery index accepts fragment 1.0.0; rejects unknown major.
- TEST-PS-007-09-02 (contract): PWA command client validates request and response for each command.
- TEST-PS-007-09-03 (contract, replay): offers and notifications handle duplicate and reordered events.
- TEST-PS-007-09-04 (contract): F12 hook suspends and reinstates with `cas_` reference only.
- TEST-PS-007-09-05 (contract): export schema matches PS-007-10.
- TEST-PS-007-09-06 (lint): every acceptance criterion in PS-007-01…10 maps to a TEST ID.
- TEST-PS-007-09-07 (registry): PS-007-01…10 present in planning/SPEC_REGISTRY.md with matching paths.

## Acceptance criteria
1. Contract tests pass for all five consumers.
2. Traceability lint reports 100% mapping.
3. No consumer defines its own copy of a wanted schema.
4. Release is blocked until PENDING CTR-LST-001 is resolved.

## Assumptions & open decisions
- PENDING CTR-LST-001 gates contract freeze.
- D01 PROVISIONAL (Dxx default, unapproved): envelope and signature rules for federated consumers.
- D08 PROVISIONAL (Dxx default, unapproved): offline clients use the same command contracts.
