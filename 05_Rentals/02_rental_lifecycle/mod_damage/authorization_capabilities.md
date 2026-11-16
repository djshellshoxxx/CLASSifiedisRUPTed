# PS-041-05 — Authorization and capabilities: Rental damage claims

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M03 Rental damage claims](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/damage` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-041-05.R01** Vault policy - only the local principal who is the owner of the reservation claims, accepts a counter, withdraws; only the renter responds; either party may escalate.
- **PS-041-05.R02** Inbound statements are accepted only when the signer's key matches the role for that statement in this claim and the recomputed basis matches; otherwise they are quarantined.
- **PS-041-05.R03** No relay role is involved; relays carry ciphertext only.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| rentals.damage.claim | principal | local principal is the owner of the reservation; return attested or overdue 14 days; window open |
| rentals.damage.respond | principal | local principal is the renter of the reservation; claim in state claimed |
| rentals.damage.decide | principal | local principal is the owner of the reservation; claim in state claimed or countered |
| rentals.damage.escalate | principal | local principal is owner or renter; claim in state claimed or countered |
| rentals.damage.receive | principal | any envelope; acceptance depends on signature, signer role and recomputed basis |
| rentals.damage.read_own | principal | local principal is owner or renter of the reservation |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-041-09.T09 | abuse | PS-041-05.R01, PS-041-05.R02, PS-041-05.R03 | response signed by owner; claim signed by renter; claim after the window | quarantined or FORBIDDEN; RENTALS_DAMAGE_WINDOW; no state change |

## Dependencies

Module depends on: F05.S02.M01, F05.S02.M02, F05.S01.M01, F05.S01.M02, F09.S01.M01, F09.S02.M02, F08.S01.M03, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
