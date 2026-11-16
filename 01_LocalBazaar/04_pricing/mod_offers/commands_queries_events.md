# PS-011-04 — commands queries events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/04_pricing/mod_offers. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (envelope, idempotency, revision), CTR-ERR-001 (errors), CTR-SCH-001 (schema 1.0.0), CTR-CAP-001 (actions), CTR-ID-001 (`ofr_`, PENDING registry row), CTR-FED-001 (not federated).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-011-04.R01 | Every state-changing command carries `idempotency_key` (16–128 chars) and `expected_revision` (null on create). | MVP |
| PS-011-04.R02 | Every command returns the stored offer on success, or one code from the table below. | MVP |
| PS-011-04.R03 | Queries return only fields and items the actor may see (CTR-CAP-001 R10). | MVP |
| PS-011-04.R04 | Each event envelope: aggregate_type `offer`, max_data_class PRIVATE_PERSONAL, never federated. | MVP |
| PS-011-04.R05 | List queries are paginated, 25 items per page, opaque cursor. | MVP |

## Data / schema
Command and event payloads are the PS-011-01 fields (schema 1.0.0). Event payload for transitions: offer_id, listing_id, buyer_ref, seller_ref, status, revision, reason (closed enum: timeout, listing_closed, account_deleted, superseded, none).

## Commands / queries / events
| Command | Actor | expected_revision | Emits | Errors |
|---|---|---|---|---|
| offer.submit | buyer (acc_) | null | offer.submitted | OFFER.AMOUNT_INVALID, OFFER.CURRENCY_MISMATCH, COM.QUOTE_EXPIRED, OFFER.LISTING_NOT_OPEN, OFFER.SELF_OFFER, OFFER.DUPLICATE_ACTIVE, OFFER.EXPIRY_INVALID, SYS.NOT_FOUND, SYS.RATE_LIMITED |
| offer.withdraw | buyer | required | offer.withdrawn | EVT.REVISION_CONFLICT, SYS.UNPROCESSABLE_STATE, SYS.NOT_FOUND |
| offer.accept | seller | required | offer.accepted, offer.superseded (saga) | EVT.REVISION_CONFLICT, OFFER.EXPIRED, OFFER.LISTING_NOT_OPEN, SYS.UNPROCESSABLE_STATE |
| offer.reject | seller | required | offer.rejected | EVT.REVISION_CONFLICT, SYS.UNPROCESSABLE_STATE |
| offer.expire | sys | required | offer.expired | none (no-op if terminal) |

| Query | Actor | Returns |
|---|---|---|
| offer.get (offer_id) | buyer or seller of the offer | one offer, visible fields |
| offer.list_sent | buyer | own offers, newest first |
| offer.list_received (listing_id) | seller of listing | visible offers on that listing |

| Event | Trigger | Notes |
|---|---|---|
| offer.submitted, offer.accepted, offer.rejected, offer.withdrawn, offer.expired, offer.superseded | transitions in PS-011-03 | envelope per CTR-EVT-001; shared correlation_id for the accept saga |

## States & transitions
Not defined here; see PS-011-03.

## Validation & errors
Input rules in PS-011-02. Error bodies follow CTR-ERR-001. OFFER.EXPIRED is 422 (unprocessable_state), non-retryable.

## Authorization
Actor rules per command are in PS-011-05.

## Failure, idempotency, concurrency, offline
Idempotency scope is (actor, command type, idempotency_key) for 7 days (CTR-EVT-001 R03). Full rules in PS-011-06.

## Privacy, retention, abuse
Events carry IDs, codes and amounts only at PRIVATE_PERSONAL; no names, free text or contact data (CTR-EVT-001 R06, R11).

## Observability & budgets
Command latency p95 ≤ 300 ms server (ASSUMPTION). Per-command metrics in PS-011-08.

## Tests
- TEST-PS-011-04-01 (schema): every command and event payload validates against 1.0.0 fixtures.
- TEST-PS-011-04-02 (envelope): event_type matches `offer.<past-tense verb>`; aggregate_id prefix `ofr_`; max_data_class is PRIVATE_PERSONAL.
- TEST-PS-011-04-03 (integration): each command returns exactly the listed errors and no others.
- TEST-PS-011-04-04 (pagination): 26 offers yield 25 then 1; cursor stable under concurrent insert.
- TEST-PS-011-04-05 (federation lint): no offer event type is allowed in CTR-FED-001 batches.

## Acceptance criteria
1. All commands, queries and events in the tables exist with the stated errors.
2. Schema and envelope tests pass for 1.0.0.
3. TEST-PS-011-04-01 through -05 pass in CI.

## Assumptions & open decisions
- ASSUMPTION: event names are past-tense verbs as listed; CTR-SCH-001 OPEN item on event_type registry applies.
- PROVISIONAL (D08 default, unapproved): offline submits use client_offline_replay provenance.
- PENDING CTR-ID-001 (offer prefix); PENDING CTR-COM-001 (COM.QUOTE_EXPIRED).
