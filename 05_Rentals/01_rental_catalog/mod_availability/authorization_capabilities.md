# PS-039-05 — Authorization and capabilities: Rental availability

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S01.M01 Rental availability](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_catalog/availability` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-039-05.R01** Vault policy - only the local principal who owns an offering manages it, publishes it and confirms, declines or cancels its reservations; only the principal who signed a request is the renter for it.
- **PS-039-05.R02** Inbound statements are accepted only when the signer's key matches the role required for that statement in this reservation; otherwise they are quarantined.
- **PS-039-05.R03** No relay role is involved; a relay can only carry ciphertext or host the signed public projection and busy summary under its own hosting policy.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| rentals.offering.manage | principal | offering.ownerId = local principal; listing owned by local principal |
| rentals.offering.publish | principal | offering.ownerId = local principal; federation_publish consent granted for each relay; relay accepts the upload by its own policy |
| rentals.offering.read | principal, anonymous | own offering, or a stored projection whose signature verified |
| rentals.reservation.request | principal | local principal is not the owner; isBlockedEither false; fewer than 5 open requests |
| rentals.reservation.decide | principal | local principal is the offering owner; owner clock not after the request expiresAt |
| rentals.reservation.cancel | principal | local principal is renter or owner of the reservation; reason allowed for that role (V10) |
| rentals.reservation.renegotiate | principal | local principal is renter or owner of a frozen reservation |
| rentals.reservation.receive | principal | any envelope; acceptance depends on signature and signer role |
| rentals.reservation.read_own | principal | local principal is renter or owner of the reservation |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-039-09.T10 | abuse | PS-039-05.R01, PS-039-05.R02, PS-039-05.R03, PS-039-07.R01 | inbound confirmation signed by the renter; inbound request signed by a third key; relay alters ciphertext; local confirm attempted by the renter | each inbound statement quarantined with RENTALS_STATEMENT_INVALID; local confirm returns FORBIDDEN; no state change; busy summary has no identities |
| TEST-PS-039-09.T23 | abuse | PS-039-05.R02, PS-039-02.R03 | renter-signed cancellation with reason declined; inbound cancellation with reason no_handoff while the receiving vault's handoff holds a signed report | first quarantined with RENTALS_STATEMENT_INVALID; second stored as a notice and not applied; reservation stays handoff_pending |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F09.S01.M01, F09.S03.M01, F09.S03.M03, F08.S01.M01, F08.S02.M02, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F06.S02.M01, F06.S02.M02, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
