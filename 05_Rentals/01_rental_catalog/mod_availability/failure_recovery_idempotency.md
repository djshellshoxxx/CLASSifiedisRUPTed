# PS-039-06 — Failure recovery and idempotency: Rental availability

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S01.M01 Rental availability](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_catalog/availability` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-039-06.R01** Commands are idempotent through local command ids and statements through cid, so duplicate delivery through two relays is harmless.
- **PS-039-06.R02** The overlap check and the confirmation write are one IndexedDB transaction under a Web Locks lock per offering.
- **PS-039-06.R03** Conflicting signed promises from forked owner devices are detected on merge, freeze the reservations and require renegotiation; there is no last-writer-wins.

## Specification

- **idempotency:** Local command id stored 24 h; inbound statements deduplicated by cid in the inbox table (EVT-3); a repeated confirm returns the same confirmationCid and dealId.
- **concurrency:** Web Locks lock rentals-offering-<id> around check-and-confirm and around busy publication; across vaults no lock exists - requests are claims and only the owner's signed confirmation reserves the interval; owner devices that fork are detected through the signed seq/prev chain.
- **retries:** Sync outbox retries 1 s, 2 s, 4 s, 8 s up to 8 attempts per destination, then shows needs attention; a request is retried until confirmation, cancellation or the 48 h expiry.
- **offline:** Requests, cancellations and offering edits work offline and commit locally with prepared sync state; confirmation works offline in the owner vault and is delivered later; the UI never shows confirmed to the renter before the signed confirmation is held.
- **partial failure:** If Deal creation fails during confirmation nothing is signed and the reservation stays requested; if relay delivery fails after local commit the local state stands and the sync state shows the failure.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-039-09.T06 | integration | PS-039-03.R02, PS-039-06.R02 | confirm with Deal creation failing; crash between check and write | reservation stays requested, no signature, no partial state |
| TEST-PS-039-09.T07 | integration | PS-039-03.R03, PS-039-06.R03, PS-039-07.R02 | two owner devices sign overlapping confirmations and then merge | both reservations frozen; renegotiation required; no last-writer-wins |
| TEST-PS-039-09.T08 | integration | PS-039-04.R02, PS-039-06.R01, PS-039-09.R03 | full flow with relay that duplicates, drops and reorders | both vaults converge on confirmed with identical cids; duplicates skipped |

## Dependencies

Module depends on: F01.S01.M01, F09.S01.M01, F09.S03.M01, F08.S01.M01, F07.S01.M01, F07.S02.M02, F11.S01.M03, F06.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
