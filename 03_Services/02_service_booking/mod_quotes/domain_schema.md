# PS-032-01 — Domain schema: Service quotes and booking

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M01 Service quotes and booking](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/quotes` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-032-01.R01** QuoteRequest, ServiceQuote and Booking are P2 records stored in the vault of each participant, with revision per CTR-ID-001 and the cid of each signed statement they derive from.
- **PS-032-01.R02** Money is integer minor units per CTR-MNY-001; an hourly total is computed once as rate times estimatedMinutes divided by 60 with HALF_EVEN rounding, and the milestone amounts must sum exactly to the total.
- **PS-032-01.R03** A quote is immutable after issue; changing anything requires a superseding quote with a new cid, and acceptance binds to the exact quote cid.

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
| attachmentIds | uuidv7[] — 0..5 refs F08.S01.M03 |
| status | enum — open \| quoted \| accepted \| cancelled \| expired |
| cid | string — sha256- cid of the signed request statement |
| syncState | map — per peer {state: prepared \| transport_acknowledged \| peer_accepted, at} |
| revision | int — CTR-ID-001 ID-4 |
| expiresAt | timestamp — claim-time plus 14 days, evaluated on the local clock |

**Invariants**
- At most one open request per (clientId, offeringId).
- status accepted implies exactly one ServiceQuote with status accepted for this request.
- providerId equals the offering provider key.

### ServiceQuote

Schema `classrup.services.quote/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| requestId | uuidv7 — ref QuoteRequest |
| providerId | actorId — signer |
| total | Money — CTR-MNY-001; > 0; ≤ 1 000 000 000 000 minor units |
| pricingBasis | enum — fixed \| hourly_estimate |
| estimatedMinutes? | int — 15..14400; required for hourly_estimate |
| milestonePlan | MilestoneDraft[] — 0..10 items {title ≤ 120, amount: Money, dueAt?}; sum equals total; empty means one implicit milestone |
| proposedStartUtc? | timestamp — a generated slot start from F03.S01.M02 |
| durationMinutes? | int — 15..1440 |
| providerTimeZone | string — IANA zone of the provider |
| validUntil | timestamp — issue claim-time plus 1 h..14 d, default 72 h |
| cancellationPolicy | object — {freeUntilHoursBefore 0..720, lateFeeBps 0..5000} |
| slotHoldId? | uuidv7 — local ref F03.S01.M02 SlotHold (provider vault only) |
| status | enum — issued \| accepted \| declined \| withdrawn \| expired \| superseded |
| cid | string — sha256- cid of the signed quote statement |
| syncState | map — per peer {state: prepared \| transport_acknowledged \| peer_accepted, at} |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- milestonePlan amounts sum exactly to total in one currency.
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
| confirmationCid? | string — cid of booking_confirmation; present when confirmed |
| clientId | actorId — client |
| providerId | actorId — provider |
| startUtc? | timestamp — RFC 3339 UTC; absent for remote asynchronous work |
| endUtc? | timestamp — after startUtc |
| total | Money — copied from the quote |
| cancellationPolicy | object — copied from the quote |
| status | enum — awaiting_confirmation \| confirmed \| in_progress \| completed \| cancelled \| disputed |
| cancelledBy? | enum — client \| provider \| system |
| cancelReason? | enum — client_request \| provider_request \| slot_taken \| quote_expired \| quote_superseded \| confirmation_timeout \| blocked \| mutual |
| lateFeeClaim? | Money — fee amount that applies as a claim between parties |
| dealId? | uuidv7 — local ref F09.S01.M01 Deal in this vault |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- status confirmed or later implies confirmationCid is set and both signatures verified.
- A provider vault never has two bookings in status confirmed or in_progress whose intervals overlap.
- lateFeeClaim is at most total times lateFeeBps divided by 10000 and is never collected by the platform.

### Storage DDL

```sql
CREATE TABLE services_booking (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, quote_id TEXT NOT NULL, client_id TEXT NOT NULL, provider_id TEXT NOT NULL,
  start_utc TEXT, end_utc TEXT, status TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE INDEX services_booking_provider_time ON services_booking(tenant_id, provider_id, start_utc, status);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-032-09.T01 | unit | PS-032-01.R01, PS-032-01.R02, PS-032-04.R01 | issue a quote whose milestones sum to total and one that is off by 1 minor unit | first stored; second SERVICES_MILESTONE_SUM_MISMATCH |
| TEST-PS-032-09.T02 | unit | PS-032-01.R03, PS-032-02.R01, PS-032-02.R02, PS-032-02.R03 | each rule V01–V09 violated in turn | documented code returned and nothing stored, bad statements quarantined |
| TEST-PS-032-09.T09 | integration | PS-032-01.R02, PS-032-03.R01, PS-032-07.R03 | acceptance arrives 6 minutes after validUntil by provider clock | refused EXPIRED; quote shown expired; no booking confirmed |
| TEST-PS-032-09.T15 | e2e | PS-032-01.R01, PS-032-03.R02 | mobile client requests, provider quotes and confirms in a second browser context | both show confirmed; axe zero serious issues |

## Dependencies

Module depends on: F03.S01.M01, F03.S01.M02, F09.S01.M01, F08.S01.M01, F07.S01.M01, F07.S02.M02, F11.S01.M03, F09.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [module SPEC](SPEC.md).
