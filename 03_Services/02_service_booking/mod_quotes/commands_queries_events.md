# PS-032-04 — Commands, queries and events: Service quotes and booking

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M01 Service quotes and booking](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/quotes` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-032-04.R01** The module exposes vault commands for each party action; commands that another party must rely on also produce a named signed statement and enter the sync outbox in the same vault transaction.
- **PS-032-04.R02** A single ingestion command applies inbound statements; it verifies, deduplicates by cid, derives local events with actor.kind federated and quarantines failures.
- **PS-032-04.R03** Events are local (EVT-8); they leave the device only as the statements named below.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `services.quote.request` | services.quote.request | [statement classrup.services.quote_request/v1 signed by client, E2E encrypted to provider] { offeringId, description, preferredFromUtc?, preferredToUtc?, budget?, attachmentIds? } | { requestId, cid, syncState } | VALIDATION_FAILED, SERVICES_OFFERING_NOT_BOOKABLE, SERVICES_REQUEST_LIMIT, BLOCKED_PARTY, RATE_LIMITED | services.quote.requested | yes (Idempotency-Key) |
| `services.quote.issue` | services.quote.issue | [statement classrup.services.quote/v1 signed by provider, E2E encrypted to client] { requestId, total, pricingBasis, estimatedMinutes?, milestonePlan?, proposedStartUtc?, durationMinutes?, validUntil?, cancellationPolicy } | { quoteId, cid, slotHoldId?, syncState } | NOT_FOUND, CONFLICT_STATE, VALIDATION_FAILED, SERVICES_MILESTONE_SUM_MISMATCH, SERVICES_SLOT_UNAVAILABLE, SERVICES_HOLD_LIMIT | services.quote.issued | yes (Idempotency-Key) |
| `services.quote.accept` | services.quote.accept | [statement classrup.services.quote_acceptance/v1 signed by client over the exact quote cid] { quoteId, expectedRevision } | { bookingId, status: awaiting_confirmation, acceptanceCid, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, EXPIRED, SERVICES_QUOTE_NOT_ACCEPTABLE | services.quote.accepted | yes (Idempotency-Key) |
| `services.quote.decline` | services.quote.decline | [statement classrup.services.quote_decline/v1 signed by the declining party] { quoteId? , requestId?, role: client\|provider, reason } | { id, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | services.quote.declined | yes (Idempotency-Key) |
| `services.booking.confirm` | services.booking.confirm | [statement classrup.services.booking_confirmation/v1 signed by provider over quoteCid and acceptanceCid] { bookingId, expectedRevision } | { bookingId, revision, confirmationCid, dealId, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, EXPIRED, SERVICES_SLOT_UNAVAILABLE, DEPENDENCY_UNAVAILABLE | services.booking.confirmed | yes (Idempotency-Key) |
| `services.booking.cancel` | services.booking.cancel | [statement classrup.services.booking_cancellation/v1 signed by the cancelling party] { bookingId, expectedRevision, reason } | { bookingId, revision, lateFeeClaim?, effectiveAt } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | services.booking.cancelled | yes (Idempotency-Key) |
| `services.statement.receive` | services.statement.receive | [vault-local ingestion of an inbound envelope per CTR-FED-001] { envelope, via? } | { accepted: boolean, quarantined?: boolean, code?, appliedIds[] } | SERVICES_STATEMENT_INVALID, UNSUPPORTED_SCHEMA_VERSION, SERVICES_QUOTE_NOT_ACCEPTABLE, EXPIRED, CONFLICT_STATE | services.quote.requested, services.quote.issued, services.quote.accepted, services.booking.confirmed, services.booking.cancelled, services.quote.declined | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `services.quote.get` | services.quote.read_own | [vault-local] { quoteId } | { quote: ServiceQuote, request: QuoteRequest } | NOT_FOUND |
| `services.quote.list_mine` | services.quote.read_own | [vault-local] { role?: client\|provider, status?, cursor?, limit ≤ 50 } | { items: [QuoteRequest with latest ServiceQuote], nextCursor? } |  |
| `services.booking.list_mine` | services.booking.read_own | [vault-local] { status?, fromUtc?, toUtc?, cursor?, limit ≤ 50 } | { items: Booking[], nextCursor? } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `services.quote.requested` | P2 | { requestId, offeringId, clientId, providerId, cid } |
| `services.quote.issued` | P2 | { quoteId, requestId, providerId, total, validUntil, cid } |
| `services.quote.accepted` | P2 | { quoteId, requestId, bookingId, clientId, providerId, acceptanceCid } |
| `services.booking.confirmed` | P2 | { bookingId, quoteId, clientId, providerId, startUtc?, endUtc?, total, milestonePlan[], dealId } |
| `services.booking.cancelled` | P2 | { bookingId, cancelledBy, reason, lateFeeClaim?, effectiveAt } |
| `services.quote.declined` | P2 | { quoteId?, requestId, role, reason } |
| `services.quote.expired` | P2 | { quoteId, requestId } |

### Events consumed

| Type | Effect |
|---|---|
| `services.milestone.submitted` | move a confirmed booking to in_progress on the first submission |
| `services.booking.completed` | move an in_progress or disputed booking to completed |
| `services.dispute.opened` | move the booking to disputed and freeze new cancellation fee claims |
| `commerce.dispute.resolved` | leave disputed according to the outcome (continue, settled or cancelled) |
| `identity.block.added` | cancel open requests and unconfirmed bookings between the two parties with reason blocked |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| SERVICES_STATEMENT_INVALID | 422 | no | signature, signer role, schema or referenced cid check failed; statement is quarantined |
| SERVICES_OFFERING_NOT_BOOKABLE | 409 | no | offering is not published, withdrawn, or the provider key differs |
| SERVICES_QUOTE_NOT_ACCEPTABLE | 409 | no | quote is superseded, withdrawn, expired or the signed cid differs |
| SERVICES_MILESTONE_SUM_MISMATCH | 422 | no | milestone amounts do not sum exactly to the quote total |
| SERVICES_SLOT_UNAVAILABLE | 409 | no | the proposed slot is taken, expired or not generated in the provider vault |
| SERVICES_HOLD_LIMIT | 409 | no | provider vault already has the maximum number of active holds for this client |
| SERVICES_REQUEST_LIMIT | 409 | no | client already has the maximum number of open requests |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
client vault command services.quote.request -> statement classrup.services.quote_request/v1 (cid sha256-Qw…), syncState prepared
provider vault receives, issues: services.quote.issue { "requestId": "0192f3c0-0001-…", "total": { "amount": "18000", "currency": "EUR" },
  "pricingBasis": "fixed", "proposedStartUtc": "2027-03-29T07:00:00.000Z", "cancellationPolicy": { "freeUntilHoursBefore": 24, "lateFeeBps": 2000 } }
-> { "quoteId": "0192f3c0-0002-…", "cid": "sha256-Zk…", "slotHoldId": "0192f3b0-0002-…", "syncState": "prepared" }
client services.quote.accept { "quoteId": "0192f3c0-0002-…", "expectedRevision": 1 } -> status awaiting_confirmation
provider services.booking.confirm -> status confirmed, dealId set, syncState transport_acknowledged until the client acknowledges
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-032-09.T01 | unit | PS-032-01.R01, PS-032-01.R02, PS-032-04.R01 | issue a quote whose milestones sum to total and one that is off by 1 minor unit | first stored; second SERVICES_MILESTONE_SUM_MISMATCH |
| TEST-PS-032-09.T05 | integration | PS-032-04.R02, PS-032-06.R01, PS-032-09.R03 | full flow with relay that duplicates and reorders envelopes | both vaults reach confirmed with identical bookingId and cids; duplicates skipped |
| TEST-PS-032-09.T06 | contract | PS-032-04.R01, PS-032-04.R03, PS-032-09.R01, PS-032-09.R02 | each command, statement and event | payloads and signatures validate against registry schemas |

## Dependencies

Module depends on: F03.S01.M01, F03.S01.M02, F09.S01.M01, F08.S01.M01, F07.S01.M01, F07.S02.M02, F11.S01.M03, F09.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
