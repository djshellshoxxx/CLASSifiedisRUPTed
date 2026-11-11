# PS-030-05 — Authorization and capabilities: Service disputes

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M03 Service disputes](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/disputes` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-030-05.R01** Vault policy - only the local principal who is client or provider of the booking can open or withdraw a dispute for it.
- **PS-030-05.R02** Inbound notices and withdrawals are accepted only when the signer is the other party of the booking (the opener of the referenced notice for withdrawals); otherwise they are quarantined, and a notice from a locally blocked party of an existing booking is quarantined for review rather than dropped (exception to N7).
- **PS-030-05.R03** Relay roles are not involved; a relay can refuse to carry the notice, which changes only the sync state.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| services.dispute.open | principal | local principal is client or provider of the booking; window, state and limits satisfied; a local block does not remove this right |
| services.dispute.withdraw | principal | link.openerId = local principal and state pending_link or linked |
| services.dispute.receive | principal | any envelope; acceptance depends on signature, signer role and re-validation; notices from a blocked party of an existing booking go to quarantine |
| services.dispute.read_own | principal | local principal is client or provider of the booking |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-030-09.T09 | abuse | PS-030-05.R01, PS-030-05.R02, PS-030-05.R03 | third party opens; notice signed by wrong key | FORBIDDEN or quarantine; no link created |
| TEST-PS-030-09.T21 | abuse | PS-030-05.R02 | notice from a locally blocked party of an existing booking | quarantined for review with no notification, not dropped |

## Dependencies

Module depends on: F03.S02.M01, F03.S02.M02, F09.S02.M02, F09.S01.M01, F08.S01.M01, F08.S01.M03, F07.S01.M01, F07.S02.M02, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
