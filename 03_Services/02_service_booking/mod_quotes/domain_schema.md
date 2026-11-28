# PS-032-01 — Domain schema: Service quotes and booking

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M01 Service quotes and booking](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/quotes` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-032-01.R01** QuoteRequest, ServiceQuote and Booking are P2 records stored in the vault of each participant, with revision per CTR-ID-001 and the cid of each signed statement they derive from.
- **PS-032-01.R02** Money is integer minor units per CTR-MNY-001; an hourly total is computed once as rate times estimatedMinutes divided by 60 with HALF_EVEN rounding (F09.S03.M03), and the milestone amounts must sum exactly to the total.
- **PS-032-01.R03** A quote is immutable after issue; changing anything requires a superseding quote with a new cid, and acceptance binds to the exact quote cid and its milestone plan, whose milestone ids are derived as uuid(sha256(bookingId + ':' + seq)).

## Specification

### QuoteRequest

Schema `classrup.services.quote_request/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| offeringId | uuidv7 — ref F03.S01.M01 ServiceOffering |
| clientId | actorId — author and signer |
| providerId | actorId — must equal the offering provider |
| description | string — 10..2000 code points, plain text |
| preferredFromUtc? | timestamp — RFC 3339 UTC |
| preferredToUtc? | timestamp — after preferredFromUtc, at most 90 days ahead |
| budget? | Money — CTR-MNY-001; > 0 |
| attachmentIds | uuidv7[] — 0..5 refs F08.S01.M03 image attachments |
| status | enum — open \| quoted \| accepted \| cancelled \| expired |
| cancelReason? | enum — client_cancelled \| blocked \| offering_withdrawn |
| firstContact | boolean — set in the provider vault when the client had no prior interaction; queued without per-item notification |
| cid | string — sha256- cid of the signed request statement |
| syncState | map — per peer {state: prepared \| transport_acknowledged \| peer_accepted, at} |
| revision | int — CTR-ID-001 ID-4 |
| expiresAt | timestamp — claim-time plus 14 days, evaluated on the local clock |

**Invariants**
- At most one open or quoted request per (clientId, offeringId), enforced on creation in the client vault and again on ingest in the provider vault.
- status accepted implies exactly one ServiceQuote with status accepted for this request.
- providerId equals the offering provider key.

### ServiceQuote

Schema `classrup.services.quote/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| requestId | uuidv7 — ref QuoteRequest |
| providerId | actorId — signer |
| clientId | actorId — request author, copied for routing |
| total | Money — CTR-MNY-001; > 0; ≤ 1 000 000 000 000 minor units |
| pricingBasis | enum — fixed \| hourly_estimate |
| estimatedMinutes? | int — 15..14400; required for hourly_estimate |
| milestonePlan | MilestoneDraft[] — 0..10 items {seq 1..10 contiguous and unique, title ≤ 120, amount: Money, dueAt?, parallel?: boolean}; sum equals total; empty means one implicit milestone with seq 1 for the full total |
| proposedStartUtc? | timestamp — a generated slot start from F03.S01.M02 |
| durationMinutes? | int — 15..1440 |
| providerTimeZone | string — IANA zone of the provider |
| validUntil | timestamp — issue claim-time plus 1 h..14 d, default 72 h; at most 72 h when proposedStartUtc is set so the hold (validUntil + 5 min) fits the F03.S01.M02 maximum |
| cancellationPolicy | object — {freeUntilHoursBefore 0..720, lateFeeBps 0..5000} |
| slotHoldId? | uuidv7 — local ref F03.S01.M02 SlotHold (provider vault only) |
| needsReconfirmation | boolean — set from services.availability.changed for the quote's hold; shown on the quote card |
| supersedes? | uuidv7 — previous quote of the same request |
| status | enum — issued \| accepted \| declined \| withdrawn \| expired \| superseded |
| withdrawReason? | enum — provider_request \| request_cancelled \| offering_withdrawn \| blocked |
| cid | string — sha256- cid of the signed quote statement |
| syncState | map — per peer {state: prepared \| transport_acknowledged \| peer_accepted, at} |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- milestonePlan amounts sum exactly to total in one currency and seq values are 1..n without gaps.
- At most one quote per request has status issued.
- A quote with status accepted is never edited and its cid never changes.

### Booking

Schema `classrup.services.booking/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key, derived from the acceptance statement cid so both vaults agree |
| quoteId | uuidv7 — ref ServiceQuote |
| quoteCid | string — cid the client signed |
| acceptanceCid | string — cid of quote_acceptance |
| consentId | string — cid of the client's classrup.comms.consent/v1 acceptance consent |
| confirmationCid? | string — cid of booking_confirmation; present when confirmed |
| clientId | actorId — client |
| providerId | actorId — provider |
| startUtc? | timestamp — RFC 3339 UTC; absent for remote asynchronous work |
| endUtc? | timestamp — after startUtc |
| total | Money — copied from the quote |
| milestonePlan | MilestoneDraft[] — copied from the accepted quote with derived milestoneId per item |
| dealIds | uuid[] — derived list of the milestone Deals, appended from services.milestone.approved; this module opens none |
| cancellationPolicy | object — copied from the quote |
| slotHoldId? | uuidv7 — provider vault only |
| acceptanceSignedAt? | timestamp — client vault clock when the acceptance was signed |
| acceptanceReceivedAt? | timestamp — provider vault clock when the verified acceptance arrived; confirm is refused after this plus 24 h minus 5 min |
| status | enum — awaiting_confirmation \| confirmed \| in_progress \| cancellation_proposed \| conflicted \| disputed \| completed \| cancelled |
| cancelledBy? | enum — client \| provider \| both \| system; derived from the verified signer key or keys, system only for local block and import handling |
| cancelReason? | enum — client_request \| provider_request \| slot_taken \| quote_expired \| quote_superseded \| confirmation_timeout \| blocked \| mutual |
| cancellationCid? | string — cid of the booking_cancellation statement, or of the second consent for mutual |
| lateFeeClaim? | Money — the one fee number carried by the signed cancellation statement, identical in both vaults; advisory, never collected |
| lateFeeEvidence? | object — receiving vault only {evidenceTime, source: relay_receipt \| vault_receipt, relayId?, claimedAt, computedFee: Money, agrees: boolean} |
| conflict? | object — {kind: confirmation_after_timeout \| forked_confirmation \| consent_conflicted, statementCids[]}; also kept on a cancelled booking so both statements stay visible |
| preDisputeStatus? | enum — confirmed \| in_progress; stored when services.dispute.opened freezes the booking |
| disputeCaseId? | uuid — F09.S02.M02 case the freeze belongs to |
| openDisputeLinkId? | uuidv7 — overlay set while a linked dispute exists, also on completed and cancelled bookings |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- status confirmed, in_progress, cancellation_proposed, disputed or completed implies confirmationCid is set and both signatures verified.
- A provider vault never has two bookings in status confirmed or in_progress whose intervals overlap.
- lateFeeClaim is at most total times lateFeeBps divided by 10000, is never collected by the platform and opens no Deal.
- cancelledBy is derived from the verified signer key or keys of the cancellation statements, never from a payload field.

### Storage DDL

```sql
CREATE TABLE services_quote_request (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, offering_id TEXT NOT NULL, client_id TEXT NOT NULL, provider_id TEXT NOT NULL,
  status TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX services_quote_request_open ON services_quote_request(tenant_id, client_id, offering_id)
  WHERE status IN ('open','quoted');
CREATE TABLE services_booking (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, quote_id TEXT NOT NULL, client_id TEXT NOT NULL, provider_id TEXT NOT NULL,
  start_utc TEXT, end_utc TEXT, status TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE INDEX services_booking_provider_time ON services_booking(tenant_id, provider_id, start_utc, status);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-032-09.T01 | unit | PS-032-01.R02 | issue a quote whose milestones sum to total and one that is off by 1 minor unit | first stored; second SERVICES_MILESTONE_SUM_MISMATCH |
| TEST-PS-032-09.T02 | unit | PS-032-01.R03, PS-032-02.R01, PS-032-02.R02, PS-032-02.R03 | each rule V01–V14 violated in turn | documented code returned and nothing stored, bad statements quarantined, blocked senders dropped |
| TEST-PS-032-09.T15 | e2e | PS-032-01.R01, PS-032-03.R02 | mobile client requests, provider quotes and confirms in a second browser context | both show confirmed; axe zero serious issues |
| TEST-PS-032-09.T17 | property | PS-032-01.R02 | random hourly rates and estimatedMinutes | total equals rate times estimatedMinutes divided by 60 rounded HALF_EVEN through F09.S03.M03 and is computed once |
| TEST-PS-032-09.T29 | abuse | PS-032-01.R03 | booking_confirmation whose plan changes one milestone amount | quarantined with SERVICES_STATEMENT_INVALID; booking stays awaiting_confirmation |

## Dependencies

Module depends on: F03.S01.M01, F03.S01.M02, F08.S01.M01, F08.S01.M03, F08.S02.M02, F07.S01.M01, F07.S02.M02, F11.S01.M03, F09.S03.M01, F09.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [module SPEC](SPEC.md).
