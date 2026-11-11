# PS-039-07 — Privacy, retention and abuse: Rental availability

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S01.M01 Rental availability](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_catalog/availability` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-039-07.R01** Reservations are P2 and travel only as end-to-end encrypted envelopes to the two parties; the public busy summary holds intervals and unit counts only, with no identities, and expires in 24 hours.
- **PS-039-07.R02** Exact pickup address is L4 and P3, never part of the offering, the projection or any rentals statement; it is shared only by explicit user action in the encrypted F08 thread through an F06.S02.M02 location share gated by privacy.consent.check(location_precise) with a TTL of at most 24 hours.
- **PS-039-07.R03** Request spam and calendar scraping are limited by local quotas, short busy-summary expiry and each relay's hosting policy.
- **PS-039-07.R04** The module registers ExportSectionPort (section rentals.reservations), DeletionPort and RetentionPurgePort with F10 (N6), classifies every offering, projection and reservation field through F10.S02.M02, pseudonymizes the deleted party on privacy.deletion.completed while signed statements stay verifiable, and calls privacy.consent.check(federation_publish, relayId) before any offering or busy-summary publication.
- **PS-039-07.R05** Blocks (N7) apply only to new requests, which are dropped silently with no BLOCKED_PARTY reply and no statement; statements for reservations confirmed before the block (cancellation, renegotiation, frozen notices) are still verified and stored with notifications suppressed, and the reason blocked never leaves the vault.

## Specification

**Data classification**
- RentalOffering: P3 vault record (draft and owner-only fields); P0 signed projection limited to the F11.S01.M01 allowlist {offeringId, ownerId, listingId, rates, quantity, durations, buffers, leadTimeMinutes, horizonDays, timeZone, blackoutDates, lateFee, cancellationPolicy, declaredValue, checklistTemplate labels, pickupAreaCell (L2), revision}.
- RentalReservation: P2 in both vaults.
- Busy summary: P0 intervals and unit counts only.

**Retention**
- Terminal reservations: RET-EVIDENCE (2 years after last related activity), purged through RetentionPurgePort.
- Busy summaries: dropped by receivers 24 h after their expiry; quarantined statements RET-SHORT (30 days).

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Forged confirmation or request | Ed25519 signature over JCS bytes, signer must equal the offering owner or request author key, cid binding to the request, consent statements verified through comms.consent.verify |
| T02 | Owner double-sells an interval | check inside the owner vault under a lock counting frozen units; forked devices detected through seq/prev chain and frozen with a signed notice to each renter; renter sees confirmed only with the signed statement |
| T03 | Scraping when an item is unattended | busy summary shows blocks without identities, expires in 24 h, can be coarsened to whole days, and the UI warns that copies cannot be recalled |
| T04 | Request flooding | per-sender quota 20 inbound requests per day in the owner vault, 5 open requests per renter, relay mailbox quotas, local block |
| T05 | Backdated cancellation to dodge the fee | the effective cancellation time is the signed createdAt only if received within 72 h of it, else the receipt time; relay-signed receipt time evidences that relay's clock only |
| T06 | Owner raises the late fee or cancellation fee after the renter requested | the request binds offeringRevision, projectionCid and terms; the owner vault refuses to confirm changed terms (RENTALS_TERMS_CHANGED) |
| T07 | Block used to strand a confirmed reservation or reveal the block list | blocks drop only new requests; lifecycle statements are still accepted; outbound reasons are renter, owner or declined, never blocked |

**Abuse controls**
- Local per-sender quotas and quarantine for malformed or unauthorized statements.
- Relay hosting policy may rate limit uploads; the module surfaces refusals in the sync state.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-039-09.T10 | abuse | PS-039-05.R01, PS-039-05.R02, PS-039-05.R03, PS-039-07.R01 | inbound confirmation signed by the renter; inbound request signed by a third key; relay alters ciphertext; local confirm attempted by the renter | each inbound statement quarantined with RENTALS_STATEMENT_INVALID; local confirm returns FORBIDDEN; no state change; busy summary has no identities |
| TEST-PS-039-09.T12 | abuse | PS-039-07.R03 | 21 inbound requests in a day from one sender; 6th open request by one renter | 21st dropped and counted; 6th RENTALS_REQUEST_LIMIT |
| TEST-PS-039-09.T18 | contract | PS-039-07.R02, PS-039-01.R01 | inspect the offering projection, busy summary and every rentals statement; validate pickupAreaCell values of length 4, 5 and 6 through assertPublicCell; share the address in the thread | no address field exists anywhere; lengths 4 and 5 accepted, 6 refused; projection keys equal the F11.S01.M01 allowlist; the address travels only as an F06.S02.M02 share with location_precise consent and TTL ≤ 24 h |
| TEST-PS-039-09.T24 | integration | PS-039-07.R04 | privacy.deletion.completed for the renter; export; retention purge after RET-EVIDENCE; publication without federation_publish consent | DIDs replaced by the pseudonym and signatures still verify; section rentals.reservations exported; purge removes terminal records; publication refused |
| TEST-PS-039-09.T25 | abuse | PS-039-07.R05 | owner blocks the renter after confirmation, then the renter's cancellation arrives; a new request from the blocked DID arrives | cancellation verified and stored and the notification suppressed; new request dropped silently with no reply; no outbound statement carries reason blocked |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F09.S01.M01, F09.S03.M01, F09.S03.M03, F08.S01.M01, F08.S02.M02, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F06.S02.M01, F06.S02.M02, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
