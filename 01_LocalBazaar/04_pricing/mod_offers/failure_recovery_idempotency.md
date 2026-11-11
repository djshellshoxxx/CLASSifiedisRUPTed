# PS-011-06 — Failure recovery and idempotency: Purchase offers

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S04.M01 Purchase offers](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/pricing/offers` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-011-06.R01** All commands are idempotent per CTR-IDM-001 and mutating commands require expectedRevision; inbound statements are idempotent by cid.
- **PS-011-06.R02** Concurrent acceptances within one vault (two tabs) serialize on the inventory hold so exactly one wins; acceptances on two forked devices of the seller are both kept, detected by F01.S03.M01 and frozen for the owner, never resolved by timestamp.
- **PS-011-06.R03** A failure after the hold but before commit leaves neither hold, Deal nor consent (single IndexedDB transaction).

## Specification

- **idempotency:** Idempotency-Key required on every command and kept 24 h in the vault; replay returns the stored response. Inbound statements are deduplicated by cid; the Deal id is deterministic from contextRef {offer, offerId}.
- **concurrency:** expectedRevision on accept, reject, withdraw and resolve_conflict; the open-offer unique index enforces V06 under races; accept runs hold + Deal + consent + offer update in one IndexedDB readwrite transaction in the seller vault, so two tabs serialize. There is no distributed lock: forked seller devices each commit locally, and on sync F01.S03.M01 freezes both holds and this module freezes both offers.
- **retries:** Client retries only transport errors and RATE_LIMITED; BAZAAR_OFFER_HOLD_FAILED is not retried automatically; statement transport follows IDM-4.
- **offline:** All commands commit locally offline; their statements wait in the sync outbox (prepared) and the UI shows 'not yet delivered'. An acceptance is binding for the seller vault immediately (local hold) but the buyer sees it only after delivery; if the buyer withdrew first, the later-delivered statements cross and the seller vault cancels the Deal (withdrawn before accept). The buyer's 24 h grace covers acceptances delayed across expiry.
- **partial failure:** Hold, Deal, consent and offer update share one IndexedDB transaction in the seller vault; failure aborts all of them. Delivery failure never rolls back local state; it leaves the statement in the sync outbox with retry (CTR-IDM-001 IDM-4/IDM-7).

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-011-09.T04 | integration | PS-011-03.R02, PS-011-06.R03 | Deal port or consent signing fails during accept | offer stays made, no hold, no Deal, no consent; DEPENDENCY_UNAVAILABLE returned |
| TEST-PS-011-09.T05 | integration | PS-011-03.R03, PS-011-06.R02, PS-011-09.R03 | B1 and B2 offers accepted concurrently in two tabs of S's vault for qty 1 | within one vault one accepted, the other CONFLICT_STATE, then expired superseded with a signed decision to B2 |
| TEST-PS-011-09.T10 | integration | PS-011-06.R01 | same Idempotency-Key replayed with same and different body; same statement cid delivered twice | original response replayed; IDEMPOTENCY_KEY_REUSED; duplicate statement ignored |
| TEST-PS-011-09.T24 | integration | PS-011-03.R06, PS-011-06.R02 | S and S2 accept B1's and B2's offers offline for the last unit, then sync | both acceptances kept; conflict_detected freezes both holds and both offers; neither Deal proceeds; S keeps B1 and B2 receives a signed decision rejected conflict_resolved with its Deal cancelled |
| TEST-PS-011-09.T28 | integration | PS-011-03.R02, PS-011-06.R03 | accept B1's offer, then deliver a crossing withdrawal from B1 | hold has holder {offer, offerId}, ttl 7 d, maxExpiresAt equal to the Deal expiry and linkedDealId; the withdrawal moves the offer to withdrawn and calls commerce.deal.cancel in the same transaction; the hold is released through commerce.deal.cancelled |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F01.S02.M01, F01.S03.M01, F09.S01.M01, F09.S03.M01, F09.S03.M03, F07.S02.M02, F08.S02.M02, F11.S01.M01, F11.S01.M02, F11.S02.M03, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
