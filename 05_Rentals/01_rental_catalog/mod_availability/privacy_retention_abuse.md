# PS-039-07 — Privacy, retention and abuse: Rental availability

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S01.M01 Rental availability](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_catalog/availability` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-039-07.R01** Reservations are P2 and travel only as end-to-end encrypted envelopes to the two parties; the public busy summary holds intervals and unit counts only, with no identities, and expires in 24 hours.
- **PS-039-07.R02** Exact pickup address is P3, never part of the offering or the projection, and is shared in the encrypted thread by explicit user action (L3 at most by default).
- **PS-039-07.R03** Request spam and calendar scraping are limited by local quotas, short busy-summary expiry and each relay's hosting policy.

## Specification

**Data classification**
- RentalOffering: P3 draft in the vault, P0 signed projection with area at most L2.
- RentalReservation: P2 in both vaults.

**Retention**
- Terminal reservations: RET-EVIDENCE (2 years after last related activity).
- Busy summaries: dropped by receivers 24 h after their expiry; quarantined statements RET-SHORT (30 days).

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Forged confirmation or request | Ed25519 signature over JCS bytes, signer must equal the offering owner or request author key, cid binding to the request |
| T02 | Owner double-sells an interval | check inside the owner vault under a lock; forked devices detected through seq/prev chain and frozen; renter sees confirmed only with the signed statement |
| T03 | Scraping when an item is unattended | busy summary shows blocks without identities, expires in 24 h, can be coarsened to whole days, and the UI warns that copies cannot be recalled |
| T04 | Request flooding | per-sender quota 20 inbound requests per day in the owner vault, 5 open requests per renter, relay mailbox quotas, local block |
| T05 | Backdated cancellation to dodge terms | effective cancellation time is the claimed time only if within 72 h before local receipt time, else the receipt time; relay-signed receipt time evidences that relay's clock only |

**Abuse controls**
- Local per-sender quotas and quarantine for malformed or unauthorized statements.
- Relay hosting policy may rate limit uploads; the module surfaces refusals in the sync state.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-039-09.T07 | integration | PS-039-03.R03, PS-039-06.R03, PS-039-07.R02 | two owner devices sign overlapping confirmations and then merge | both reservations frozen; renegotiation required; no last-writer-wins |
| TEST-PS-039-09.T10 | abuse | PS-039-05.R01, PS-039-05.R02, PS-039-05.R03, PS-039-07.R01 | confirmation signed by renter; request signed by third key; relay alters ciphertext | quarantined with RENTALS_STATEMENT_INVALID; no state change; busy summary has no identities |
| TEST-PS-039-09.T12 | abuse | PS-039-07.R03 | 21 inbound requests in a day from one sender; 6th open request by one renter | 21st dropped and counted; 6th RENTALS_REQUEST_LIMIT |

## Dependencies

Module depends on: F01.S01.M01, F09.S01.M01, F09.S03.M01, F08.S01.M01, F07.S01.M01, F07.S02.M02, F11.S01.M03, F06.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
