# PS-043-05 — Authorization and capabilities: Rental return

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M02 Rental return](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/return` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-043-05.R01** Vault policy - only the local principal who is the renter reports a return; only the owner attests, records receipt, adjusts the late fee or waives damage claims.
- **PS-043-05.R02** Inbound statements are accepted only when the signer's key matches the role rule for that statement in this reservation; otherwise they are quarantined with a reason code.
- **PS-043-05.R03** No relay role is involved; relays carry ciphertext only.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| rentals.return.report | principal | local principal is the renter of the reservation; handoff attested |
| rentals.return.attest | principal | local principal is the owner of the reservation; return not yet attested |
| rentals.return.adjust_fee | principal | local principal is the owner of the reservation; adjustments only lower the fee |
| rentals.return.receive | principal | any envelope; acceptance depends on signature and signer role |
| rentals.return.read_own | principal | local principal is owner or renter of the reservation |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-043-09.T10 | abuse | PS-043-05.R01, PS-043-05.R02, PS-043-05.R03 | attestation signed by renter; fee adjustment signed by renter; third-party key | quarantined or FORBIDDEN; no state change; raising a fee refused |

## Dependencies

Module depends on: F05.S02.M01, F05.S01.M01, F05.S01.M02, F09.S01.M01, F08.S01.M03, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
