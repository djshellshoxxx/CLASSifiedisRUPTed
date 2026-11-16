# PS-031-05 — Authorization and capabilities: Service milestones

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M02 Service milestones](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/milestones` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-031-05.R01** Vault policy - only the local principal who is the booking provider may submit; only the principal who is the booking client may approve or request changes.
- **PS-031-05.R02** Inbound statements are accepted only when the signer's key matches the role for that statement in this booking; otherwise quarantine with a reason code.
- **PS-031-05.R03** Payment events are applied only when their context reference points to a milestone of a booking in this vault; relays have no role.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| services.milestone.submit | principal | local principal is the booking provider; booking confirmed or in progress |
| services.milestone.approve | principal | local principal is the booking client; milestone submitted |
| services.milestone.request_changes | principal | local principal is the booking client; milestone submitted; changeRounds below 3 |
| services.milestone.receive | principal | any envelope; acceptance depends on signature and signer role |
| services.milestone.read_own | principal | local principal is client or provider of the booking |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-031-09.T07 | abuse | PS-031-05.R01, PS-031-05.R02, PS-031-05.R03 | approval signed by provider key; submission signed by client; payment event with foreign context | all quarantined or ignored; no state change |

## Dependencies

Module depends on: F03.S02.M01, F09.S01.M01, F08.S01.M03, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
