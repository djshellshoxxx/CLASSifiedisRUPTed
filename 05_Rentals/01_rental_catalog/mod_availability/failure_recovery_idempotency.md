# PS-039-06 — Failure recovery and idempotency: Rental availability

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S01.M01 Rental availability](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_catalog/availability` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-039-06.R01** Commands are idempotent through local command ids and statements through cid, so duplicate delivery through two relays is harmless.
- **PS-039-06.R02** The overlap check and the confirmation write are one IndexedDB transaction under a Web Locks lock per offering.
- **PS-039-06.R03** Conflicting signed promises from forked owner devices and owner equivocation over one requestCid are detected on merge or receipt, freeze the reservations with a signed notice to each affected renter, keep counting toward capacity and require renegotiation; there is no last-writer-wins.

## Specification

- **idempotency:** Local command id stored 24 h; inbound statements deduplicated by cid in the inbox table (EVT-3); a repeated confirm returns the same confirmationCid; commerce.deal.open with the deterministic contextRef returns the existing Deal on retry.
- **concurrency:** Web Locks lock rentals-offering-<id> around check-and-confirm, renegotiation and busy publication; across vaults no lock exists - requests are claims and only the owner's signed confirmation reserves the interval; owner devices that fork are detected through the signed seq/prev chain; a confirmation and a decline over one requestCid are an equivocation whatever their order.
- **retries:** Sync outbox retries 1 s, 2 s, 4 s, 8 s up to 8 attempts per destination, then shows needs attention; a request is retried until confirmation, cancellation or its signed expiresAt, never after.
- **offline:** Requests, cancellations and offering edits work offline and commit locally with prepared sync state; confirmation works offline in the owner vault and is delivered later; both vaults evaluate request expiry from the signed expiresAt; the UI never shows confirmed to the renter before the signed confirmation is held.
- **partial failure:** If the consent signature fails during confirmation nothing is signed and the reservation stays requested; if commerce.deal.open fails at handoff the reservation still moves to in_use and the Deal opening is retried with the same deterministic contextRef; if relay delivery fails after local commit the local state stands and the sync state shows the failure.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-039-09.T06 | integration | PS-039-03.R02, PS-039-06.R02 | confirm with consent signing failing; crash injected between the overlap check and the write | reservation stays requested, no signature, no partial state |
| TEST-PS-039-09.T07 | integration | PS-039-03.R03, PS-039-06.R03 | two owner devices sign overlapping confirmations for R1 and R2, merge, then R3 requests the same interval and the owner renegotiates R1 after cancelling R2 | R1 and R2 frozen and counted; R3 confirm returns RENTALS_INTERVAL_CONFLICT; each renter holds a signed reservation_frozen notice; R1 confirmed after co-signed renegotiation; an untouched frozen reservation is cancelled with reason conflict at startsAt − leadTime |
| TEST-PS-039-09.T08 | integration | PS-039-04.R02, PS-039-06.R01, PS-039-09.R03 | full flow with relay that duplicates, drops and reorders | both vaults converge on confirmed with identical cids; duplicates skipped |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F09.S01.M01, F09.S03.M01, F09.S03.M03, F08.S01.M01, F08.S02.M02, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F06.S02.M01, F06.S02.M02, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
