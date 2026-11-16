# PS-005-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/02_listing_types/mod_giveaway. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001 (ID.MALFORMED), CTR-ERR-001 (envelope, codes), CTR-EVT-001 (idempotency key pattern), CTR-PRV-001 (R04 cells, R01 classes). PENDING CTR-LST-001 (listing fields, F01).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-005-02.R01 | Claim submit requires `listing_type = giveaway`; else `GIVE.LISTING_NOT_GIVEAWAY` (400). | MVP |
| PS-005-02.R02 | Claim submit requires listing active and unreserved, and `claimant_ref ≠ giver_ref`; else `GIVE.LISTING_NOT_CLAIMABLE` (422) or `GIVE.SELF_CLAIM` (403). | MVP |
| PS-005-02.R03 | Giveaway listing create/edit rejects any consideration field with `GIVE.CONSIDERATION_NOT_ALLOWED` (400). `details[].field` gives the field path; the value is never echoed. | MVP |
| PS-005-02.R04 | `listing_id` and `claim_id` are exactly 30 characters with valid prefix; otherwise `ID.MALFORMED` (400). Lowercase body input is normalized (CTR-ID-001 R03). | MVP |
| PS-005-02.R05 | `idempotency_key` matches `^[A-Za-z0-9_-]{16,128}$`; `expected_revision` is an integer ≥ 1. Unknown fields → `SYS.REQUEST_MALFORMED` (400). | MVP |
| PS-005-02.R06 | `pickup_region` must be in the registered cell set; else `GIVE.PICKUP_REGION_INVALID` (400). Free-text location is rejected by schema. | MVP |
| PS-005-02.R07 | Limits: at most 1 SUBMITTED claim per (claimant, listing) and 10 open claims per claimant (ASSUMPTION); else `GIVE.DUPLICATE_ACTIVE_CLAIM` (409) or `GIVE.CLAIM_LIMIT_EXCEEDED` (429, retryable). | MVP |
| PS-005-02.R08 | Error `details[]` carries JSON-pointer `field` and registry `rule` only; no input values, no stack traces (CTR-ERR-001 R06, R07). | MVP |

## Data / schema
Validation runs on the server only. Client checks are advisory. Field rules are defined in [domain_schema](domain_schema.md).

## Commands / queries / events
Not applicable as a standalone section. Validation applies to each command in [commands_queries_events](commands_queries_events.md).

## States & transitions
Not applicable. Preconditions per transition are in [workflow_state_machine](workflow_state_machine.md).

## Validation & errors
| Code | Retryable | Category / HTTP | When |
|---|---|---|---|
| GIVE.LISTING_NOT_GIVEAWAY | false | validation / 400 | `listing_type` ≠ giveaway |
| GIVE.CONSIDERATION_NOT_ALLOWED | false | validation / 400 | consideration field present |
| GIVE.PICKUP_REGION_INVALID | false | validation / 400 | cell not registered |
| GIVE.LISTING_NOT_CLAIMABLE | false | unprocessable_state / 422 | listing inactive or reserved |
| GIVE.SELF_CLAIM | false | forbidden / 403 | claimant is giver |
| GIVE.DUPLICATE_ACTIVE_CLAIM | false | conflict / 409 | open claim already exists |
| GIVE.CLAIM_LIMIT_EXCEEDED | true | rate_limited / 429 | per-claimant limit |

Other codes (state, race, handover, confirmation) are listed in [workflow_state_machine](workflow_state_machine.md). Shared codes (`SYS.*`, `ID.*`, `EVT.*`) come from the canonical registries.

## Authorization
Validation runs after authentication and before authorization checks that reveal object existence. Actions denied by authorization use CTR-ERR-001 R08 (`SYS.NOT_FOUND`). See [authorization_capabilities](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Validation is deterministic and side-effect free. Replayed offline commands are re-validated at server receipt (see [failure_recovery_idempotency](failure_recovery_idempotency.md)).

## Privacy, retention, abuse
Rejected payloads are not stored. Validation logs keep the code and request ID only (CTR-ERR-001 R10).

## Observability & performance
Validation p95 ≤ 5 ms server-side (ASSUMPTION). Counters per code, no identifiers as labels.

## Tests
- TEST-PS-005-02-01: each code in the table has a positive and a negative fixture.
- TEST-PS-005-02-02: consideration fields rejected at every nesting depth (property test over field names).
- TEST-PS-005-02-03: rejected payload never echoes input values.

## Acceptance criteria
1. Every rule R01–R08 has at least one passing and one failing test.
2. Each code's `retryable` and category match CTR-ERR-001 registry entries.
3. No validation error response contains input values or coordinates.

**Assumptions and open decisions:** Claim limits are ASSUMPTION (no Dxx). Pickup regions follow D05 (PROVISIONAL default, unapproved; see [DECISIONS.md](../../../DECISIONS.md)).
