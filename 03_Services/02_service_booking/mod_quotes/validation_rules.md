# PS-032-02 — Validation rules: Service quotes and booking

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M01 Service quotes and booking](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/quotes` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-032-02.R01** Every inbound statement is validated in a fixed order - block check (statements from blocked DIDs are dropped silently), schema, signature, signer role derived from the signer key, referenced cids, expiry, business rules - and the first failure decides the error.
- **PS-032-02.R02** Business rules check offering state, blocks, limits, money, plan equality and slot availability before any state changes.
- **PS-032-02.R03** Every violation maps to one stable error code with a localized message key; quarantined statements store the code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | statement signature verifies over JCS bytes and the signer key belongs to the party whose role the statement type and reason require (registry in commands_queries_events); the role is never read from the payload | SERVICES_STATEMENT_INVALID |
| V02 | offering is published locally or in a stored verified projection and provider key matches | SERVICES_OFFERING_NOT_BOOKABLE |
| V03 | description 10..2000 code points, budget when present positive in a registered currency, attachmentIds refer to F08.S01.M03 attachments | VALIDATION_FAILED |
| V04 | milestonePlan has at most 10 items with contiguous unique seq from 1 and sums exactly to total in one currency | SERVICES_MILESTONE_SUM_MISMATCH |
| V05 | validUntil is within 1 h..14 d of issue (at most 72 h when proposedStartUtc is set) and acceptance occurs before validUntil plus 5 minutes by the provider clock | EXPIRED |
| V06 | acceptance quoteCid equals the issued quote cid, the quote is not superseded or withdrawn, and comms.consent.verify returns valid for consent.services.booking.accept.v1 by the client | SERVICES_QUOTE_NOT_ACCEPTABLE |
| V07 | client has fewer than 5 open requests, fewer than 2 per provider and none open for the same offering, checked in the client vault and again on ingest in the provider vault | SERVICES_REQUEST_LIMIT |
| V08 | local principal has not blocked the counterparty and is not blocked by it (F07.S02.M02 isBlockedEither); inbound statements from blocked DIDs are dropped silently instead | BLOCKED_PARTY |
| V09 | at confirmation the quote's hold is held, unexpired and not flagged needsReconfirmation, or its interval is still free and is re-held | SERVICES_SLOT_UNAVAILABLE |
| V10 | booking_confirmation repeats the accepted quote's milestone plan exactly (seq, title, amount, dueAt, parallel) with milestoneIds derived from bookingId and seq | SERVICES_STATEMENT_INVALID |
| V11 | the provider confirms no later than acceptanceReceivedAt plus 24 h minus 5 min by the provider vault clock | EXPIRED |
| V12 | cancellation reason is allowed for the signer - client_request only from the client; provider_request, slot_taken, quote_expired and quote_superseded only from the provider; confirmation_timeout only from a vault whose timer fired; mutual only as valid consents of both parties | SERVICES_STATEMENT_INVALID |
| V13 | an in_progress or disputed booking is cancelled only through mutual consent (consent.services.booking.cancel.v1 over the booking revision hash) | CONFLICT_STATE |
| V14 | provider vault accepts at most 50 inbound requests per day overall, 10 per day from DIDs with no prior interaction and 20 per day per sender | RATE_LIMITED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-032-09.T02 | unit | PS-032-01.R03, PS-032-02.R01, PS-032-02.R02, PS-032-02.R03 | each rule V01–V14 violated in turn | documented code returned and nothing stored, bad statements quarantined, blocked senders dropped |

## Dependencies

Module depends on: F03.S01.M01, F03.S01.M02, F08.S01.M01, F08.S01.M03, F08.S02.M02, F07.S01.M01, F07.S02.M02, F11.S01.M03, F09.S03.M01, F09.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
