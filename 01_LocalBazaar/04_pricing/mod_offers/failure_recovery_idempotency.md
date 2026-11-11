# PS-011-06 — Failure recovery and idempotency: Purchase offers

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S04.M01 Purchase offers](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/pricing/offers` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-011-06.R01** All commands are idempotent per CTR-IDM-001 and mutating commands require expectedRevision.
- **PS-011-06.R02** Concurrent acceptances on the same variant serialize on the inventory hold; exactly one wins.
- **PS-011-06.R03** A failure after the hold but before commit leaves neither hold nor Deal (single transaction).

## Specification

- **idempotency:** Idempotency-Key required on all four commands; replay returns the stored response for 24 h.
- **concurrency:** expectedRevision on accept/reject/withdraw; the open-offer unique index enforces V06 under races; accept runs hold + deal + offer update in one SQLite transaction (BEGIN IMMEDIATE).
- **retries:** Client retries only network errors and RATE_LIMITED; BAZAAR_OFFER_HOLD_FAILED is not retried automatically.
- **offline:** All four commands commit locally offline; their statements wait in the sync outbox (prepared) and the UI shows 'not yet delivered'. An acceptance is binding for the seller vault immediately (local hold) but the buyer sees it only after delivery; if the buyer withdrew first, the later-delivered statements conflict and both vaults show withdrawn-before-accept with the hold released.
- **partial failure:** Hold, Deal and offer update share one IndexedDB transaction in the seller vault; failure aborts all three. Delivery failure never rolls back local state; it leaves the statement in the sync outbox with retry (CTR-IDM-001 IDM-4/IDM-7).

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-011-09.T04 | integration | PS-011-03.R02, PS-011-06.R03 | Deal port fails during accept | offer stays made, no hold exists, DEPENDENCY_UNAVAILABLE returned |
| TEST-PS-011-09.T05 | integration | PS-011-03.R03, PS-011-06.R02, PS-011-09.R03 | B1 and B2 offers accepted concurrently for qty 1 | one accepted, other CONFLICT_STATE, then expired superseded |
| TEST-PS-011-09.T10 | integration | PS-011-06.R01 | same Idempotency-Key replayed with same and different body | original response replayed; IDEMPOTENCY_KEY_REUSED |

## Dependencies

Module depends on: F01.S01.M03, F01.S02.M01, F01.S03.M01, F09.S01.M01, F09.S03.M03, F07.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-IDM-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
