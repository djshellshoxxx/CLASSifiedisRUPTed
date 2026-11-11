# PS-032-04 — Commands, queries and events: Service quotes and booking

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M01 Service quotes and booking](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/quotes` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-032-04.R01** The module exposes vault commands for each party action; commands that another party must rely on also produce a named signed statement and enter the sync outbox in the same vault transaction.
- **PS-032-04.R02** A single ingestion command applies inbound statements; it drops statements from blocked DIDs silently, verifies, deduplicates by cid, derives local events with actor.kind federated and quarantines failures.
- **PS-032-04.R03** Events are local (EVT-8); they leave the device only as the statements named below.
- **PS-032-04.R04** Event payloads carry the client and provider DIDs that F13.S01.M03 needs to route notifications (N4), and services.booking.cancelled carries quoteId and slotHoldId so F03.S01.M02 can release the hold without reading the Booking.
- **PS-032-04.R05** services.booking.confirmed carries contextId (bookingId), contextType booking, contextCid (the confirmationCid of the provider-signed booking_confirmation, which binds quoteCid and acceptanceCid) and parties [{did, role client or provider}], identical in both vaults, so F07.S03.M01 can open the pending review window from the bilateral opening statement.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `services.quote.request` | services.quote.request | [statement classrup.services.quote_request/v1 signed by client, E2E encrypted to provider] { offeringId, description, preferredFromUtc?, preferredToUtc?, budget?, attachmentIds? } | { requestId, cid, syncState, addressWarning: boolean } | VALIDATION_FAILED, SERVICES_OFFERING_NOT_BOOKABLE, SERVICES_REQUEST_LIMIT, BLOCKED_PARTY, RATE_LIMITED | services.quote.requested | yes (Idempotency-Key) |
| `services.quote.issue` | services.quote.issue | [statement classrup.services.quote/v1 signed by provider, E2E encrypted to client; calls services.slot.hold with ttl = validUntil + 5 min when proposedStartUtc is set; a second quote for the same request supersedes the first] { requestId, total, pricingBasis, estimatedMinutes?, milestonePlan? [{seq, title, amount, dueAt?, parallel?}], proposedStartUtc?, durationMinutes?, validUntil?, cancellationPolicy } | { quoteId, cid, slotHoldId?, holdExpiresAt?, supersededQuoteId?, syncState } | NOT_FOUND, CONFLICT_STATE, VALIDATION_FAILED, EXPIRED, SERVICES_OFFERING_NOT_BOOKABLE, SERVICES_MILESTONE_SUM_MISMATCH, SERVICES_SLOT_UNAVAILABLE, SERVICES_HOLD_LIMIT | services.quote.issued, services.quote.declined | yes (Idempotency-Key) |
| `services.quote.accept` | services.quote.accept | [consent statement classrup.comms.consent/v1 via comms.consent.sign {subjectType: services_booking, subjectRef: quoteId, subjectRevisionHash: digest of quoteCid, statementKey: consent.services.booking.accept.v1, kind: consent}, carried in statement classrup.services.quote_acceptance/v1 signed by client over the exact quote cid] { quoteId, expectedRevision } | { bookingId, status: awaiting_confirmation, acceptanceCid, consentId, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, EXPIRED, SERVICES_QUOTE_NOT_ACCEPTABLE, BLOCKED_PARTY | services.quote.accepted | yes (Idempotency-Key) |
| `services.quote.decline` | services.quote.decline | [statement classrup.services.quote_decline/v1 signed by the declining party; declinedBy derived from the signer key] { quoteId?, requestId?, reason: client_declined \| request_cancelled \| provider_request \| offering_withdrawn } | { id, revision, declinedBy } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED | services.quote.declined | yes (Idempotency-Key) |
| `services.booking.confirm` | services.booking.confirm | [statement classrup.services.booking_confirmation/v1 signed by provider over quoteCid, acceptanceCid and the accepted milestone plan with derived milestoneIds; commits the hold through services.slot.commit, re-holding a free interval first when the hold expired] { bookingId, expectedRevision } | { bookingId, revision, confirmationCid, slotHoldId?, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, EXPIRED, SERVICES_SLOT_UNAVAILABLE | services.booking.confirmed | yes (Idempotency-Key) |
| `services.booking.cancel` | services.booking.cancel | [statement classrup.services.booking_cancellation/v1 signed by the cancelling party; cancelledBy derived from the signer key; carries claimedAt and the fee number computed by the canceller] { bookingId, expectedRevision, reason } | { bookingId, revision, lateFeeClaim?, effectiveAt, feeComputedAtDelivery: boolean } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED | services.booking.cancelled | yes (Idempotency-Key) |
| `services.booking.propose_cancellation` | services.booking.cancel | [consent statement via comms.consent.sign {subjectType: services_booking, subjectRef: bookingId, subjectRevisionHash: booking revision hash, statementKey: consent.services.booking.cancel.v1, kind: consent or decline}] { bookingId, expectedRevision, decision: propose \| agree \| decline } | { bookingId, revision, status, consentId } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | services.booking.cancelled | yes (Idempotency-Key) |
| `services.booking.resolve_conflict` | services.booking.cancel | [consent statement consent.services.booking.cancel.v1 or consent.services.booking.resume.v1 over the booking revision hash, or for a crossing timeout the provider's booking_cancellation reason confirmation_timeout] { bookingId, expectedRevision, action: cancel \| resume } | { bookingId, revision, status, waitingFor?: client \| provider } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | services.booking.cancelled | yes (Idempotency-Key) |
| `services.statement.receive` | services.statement.receive | [vault-local ingestion of an inbound envelope per CTR-FED-001; blocked senders dropped silently first] { envelope, via?, relayReceipt? } | { accepted: boolean, dropped?: boolean, quarantined?: boolean, code?, appliedIds[] } | SERVICES_STATEMENT_INVALID, UNSUPPORTED_SCHEMA_VERSION, SERVICES_QUOTE_NOT_ACCEPTABLE, SERVICES_REQUEST_LIMIT, EXPIRED, CONFLICT_STATE, RATE_LIMITED | services.quote.requested, services.quote.issued, services.quote.accepted, services.booking.confirmed, services.booking.cancelled, services.quote.declined | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `services.quote.get` | services.quote.read_own | [vault-local] { quoteId } | { quote: ServiceQuote, request: QuoteRequest } | NOT_FOUND |
| `services.quote.list_mine` | services.quote.read_own | [vault-local] { role?: client\|provider, status?, firstContact?, cursor?, limit ≤ 50 } | { items: [QuoteRequest with latest ServiceQuote], nextCursor? } |  |
| `services.booking.list_mine` | services.booking.read_own | [vault-local] { status?, fromUtc?, toUtc?, cursor?, limit ≤ 50 } | { items: Booking[], nextCursor? } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `services.quote.requested` | P2 | { requestId, offeringId, clientId, providerId, cid, firstContact } |
| `services.quote.issued` | P2 | { quoteId, requestId, clientId, providerId, total, validUntil, cid, supersedes? } |
| `services.quote.accepted` | P2 | { quoteId, requestId, bookingId, clientId, providerId, acceptanceCid } |
| `services.booking.confirmed` | P2 | { bookingId, contextId: bookingId, contextType: booking, quoteId, quoteCid, confirmationCid, contextCid: confirmationCid, clientId, providerId, parties: [{did: clientId, role: client}, {did: providerId, role: provider}], startUtc?, endUtc?, total, milestonePlan[{milestoneId, seq, title, amount, dueAt?, parallel}] } |
| `services.booking.cancelled` | P2 | { bookingId, quoteId, slotHoldId?, clientId, providerId, cancelledBy, reason, lateFeeClaim?, effectiveAt, cancellationCid? } |
| `services.quote.declined` | P2 | { quoteId?, requestId, clientId, providerId, declinedBy, reason: client_declined\|provider_request\|superseded\|request_cancelled\|offering_withdrawn\|blocked } |
| `services.quote.expired` | P2 | { quoteId, requestId, clientId, providerId } |

### Events consumed

| Type | Effect |
|---|---|
| `services.milestone.submitted` | move a confirmed booking to in_progress on the first submission |
| `services.milestone.approved` | append the milestone dealId to the derived Booking.dealIds list for display; no Deal is opened or changed here |
| `services.booking.completed` | move an in_progress or disputed booking to completed; the event carries the bilateral completionCid |
| `services.dispute.opened` | for a confirmed or in_progress booking move to disputed and store preDisputeStatus and disputeCaseId; for any other status only set openDisputeLinkId and disputeCaseId; fee claims are frozen either way |
| `commerce.dispute.resolved` | for the booking whose disputeCaseId matches, restore preDisputeStatus and clear the overlay per the F03.S02.M03 mapping, which reads the advisory disposition {kind, favouredDid?, agreedAmount?} when present and otherwise the outcome type; dispositions settled, cancelled and waived, and outcome types refund_claimed and return_agreed, only prompt the parties to sign a mutual cancellation or a new Deal; no obligation or fee changes automatically |
| `commerce.dispute.withdrawn` | for the booking whose disputeCaseId matches, restore preDisputeStatus and clear the overlay |
| `identity.block.added` | cancel open requests and unconfirmed bookings between the two parties locally with reason blocked (no statement is sent); later statements from the blocked DID are dropped silently |
| `services.offering.withdrawn` | provider vault: cancel open and quoted requests for offeringId with reason offering_withdrawn, withdraw issued quotes with provider-signed quote_decline statements and release their holds; confirmed bookings are unaffected |
| `services.availability.changed` | provider vault: set needsReconfirmation on issued quotes whose slotHoldId is in affectedHoldIds and show it on the quote card; confirmation stays refused until the hold is reconfirmed |
| `privacy.deletion.completed` | replace the erased counterparty DID with the deletion pseudonym in retained requests, quotes and bookings; signatures are kept and marked unverifiable-after-pseudonymization |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| SERVICES_STATEMENT_INVALID | 422 | no | signature, signer role, schema, plan equality or referenced cid check failed; statement is quarantined |
| SERVICES_OFFERING_NOT_BOOKABLE | 409 | no | offering is not published, withdrawn, or the provider key differs |
| SERVICES_QUOTE_NOT_ACCEPTABLE | 409 | no | quote is superseded, withdrawn, expired, the signed cid differs or the acceptance consent does not verify |
| SERVICES_MILESTONE_SUM_MISMATCH | 422 | no | milestone amounts do not sum exactly to the quote total or seq values are not contiguous |
| SERVICES_REQUEST_LIMIT | 409 | no | client already has the maximum number of open requests, or one for this offering |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statement registry (N2; the signer role is derived from the signer key and never from the payload): classrup.services.quote_request/v1 client; classrup.services.quote/v1 provider; classrup.services.quote_acceptance/v1 client, and it carries a classrup.comms.consent/v1 statement with key consent.services.booking.accept.v1, so quote acceptance is also a consent statement; classrup.services.quote_decline/v1 client for client_declined and request_cancelled, provider for provider_request, request_cancelled (withdrawal of the open quote) and offering_withdrawn (a block withdraws locally and sends nothing); classrup.services.booking_confirmation/v1 provider; classrup.services.booking_cancellation/v1 client for client_request and confirmation_timeout, provider for provider_request, slot_taken, quote_expired, quote_superseded and confirmation_timeout. Reason mutual exists only as two classrup.comms.consent/v1 statements with key consent.services.booking.cancel.v1, one from each party; resume uses consent.services.booking.resume.v1 from both. The module registers a SubjectCanonicalizerPort for subjectType services_booking with F08.S02.M02. Late-fee evidence: effectiveAt is the earlier of the receiving vault receipt time and the earliest relay-signed receipt time from a relay the canceller selected; claimedAt replaces it only when within 5 minutes of it.

### Example

```
client vault command services.quote.request -> statement classrup.services.quote_request/v1 (cid sha256-Qw…), syncState prepared
provider vault receives, issues: services.quote.issue { "requestId": "0192f3c0-0001-…", "total": { "amount": "18000", "currency": "EUR" },
  "pricingBasis": "fixed", "milestonePlan": [{ "seq": 1, "title": "Install", "amount": { "amount": "18000", "currency": "EUR" } }],
  "proposedStartUtc": "2027-03-29T07:00:00.000Z", "validUntil": "2026-11-07T10:00:00.000Z", "cancellationPolicy": { "freeUntilHoursBefore": 24, "lateFeeBps": 2000 } }
-> { "quoteId": "0192f3c0-0002-…", "cid": "sha256-Zk…", "slotHoldId": "0192f3b0-0002-…", "holdExpiresAt": "2026-11-07T10:05:00.000Z", "syncState": "prepared" }
client services.quote.accept { "quoteId": "0192f3c0-0002-…", "expectedRevision": 1 } -> status awaiting_confirmation, consent signed with consent.services.booking.accept.v1
provider receives the acceptance -> hold extended to receipt + 24 h; services.booking.confirm -> status confirmed, slot committed, syncState transport_acknowledged until the client acknowledges
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-032-09.T05 | integration | PS-032-04.R02, PS-032-06.R01, PS-032-09.R03 | full flow with relay that duplicates and reorders envelopes | both vaults reach confirmed with identical bookingId, milestone ids and cids; duplicates skipped |
| TEST-PS-032-09.T06 | contract | PS-032-04.R01, PS-032-04.R03, PS-032-09.R01, PS-032-09.R02 | each command, statement and event | payloads and signatures validate against registry schemas |
| TEST-PS-032-09.T18 | integration | PS-032-04.R01 | crash injected between statement signing and the sync outbox write for every command | neither the state change nor the outbox entry persists |
| TEST-PS-032-09.T25 | contract | PS-032-04.R04 | every produced event against the F13.S01.M03 routing table and the F03.S01.M02 consumer | clientId and providerId present where routed; services.booking.cancelled carries quoteId and slotHoldId |
| TEST-PS-032-09.T26 | integration | PS-032-04.R03 | services.offering.withdrawn with an open request and an issued quote; services.availability.changed for the hold of an issued quote | request cancelled offering_withdrawn, quote withdrawn by a signed quote_decline, hold released, confirmed bookings unchanged; affected quote flagged needsReconfirmation |
| TEST-PS-032-09.T30 | contract | PS-032-04.R05 | provider confirms a booking and the client vault ingests the confirmation; both services.booking.confirmed events checked against the F07.S03.M01 consumer schema | each carries contextId = bookingId, contextType booking, contextCid = confirmationCid and parties with exactly one client and one provider DID; both vaults emit identical values |

## Dependencies

Module depends on: F03.S01.M01, F03.S01.M02, F08.S01.M01, F08.S01.M03, F08.S02.M02, F07.S01.M01, F07.S02.M02, F11.S01.M03, F09.S03.M01, F09.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
