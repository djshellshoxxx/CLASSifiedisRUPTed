# PS-042-05 — Authorization and capabilities: Rental handoff

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M01 Rental handoff](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/handoff` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-042-05.R01** Vault policy - only the local principal who is owner or renter of the reservation can draft, submit, request changes or attest; the counterparty of the author attests.
- **PS-042-05.R02** Inbound statements are accepted only when the signer's key matches a party of the reservation and the role rule for that statement; otherwise they are quarantined.
- **PS-042-05.R03** No relay role is involved; relays carry ciphertext only.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| rentals.handoff.edit | principal | local principal is owner or renter of the reservation; handoff not attested |
| rentals.handoff.attest | principal | local principal is a party and not the author of the latest report |
| rentals.handoff.receive | principal | any envelope; acceptance depends on signature and signer role |
| rentals.handoff.read_own | principal | local principal is owner or renter of the reservation |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-042-09.T08 | abuse | PS-042-05.R01, PS-042-05.R02, PS-042-05.R03, PS-042-07.R02 | inbound attestation by a non-party key; local attest by the author of the report; photo with GPS EXIF sent by a modified client | the attestation is quarantined with RENTALS_STATEMENT_INVALID; the local attest returns FORBIDDEN; the receiving vault quarantines the photo with RENTALS_PHOTO_METADATA and the relay payload is ciphertext only; no state change |

## Dependencies

Module depends on: F05.S01.M01, F05.S01.M02, F08.S01.M01, F08.S01.M03, F15.S02.M03, F10.S02.M03, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
