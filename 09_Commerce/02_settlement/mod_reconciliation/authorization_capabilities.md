# PS-072-05 — Authorization and capabilities: Settlement reconciliation

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S02.M03 Settlement reconciliation](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/settlement/reconciliation` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-072-05.R01** Under vault policy (CAP-8) only the unlocked principal runs, dismisses or reads reports in its vault.
- **PS-072-05.R02** The module has read-only access to other modules' records through ports and no write access to them.
- **PS-072-05.R03** No relay role has any capability over reports; they never leave the device.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| commerce.reconciliation.run | local-principal | vault unlocked; at most 1 manual run per 5 minutes |
| commerce.reconciliation.dismiss | local-principal | vault unlocked; mismatch present in the latest completed report |
| commerce.reconciliation.read | local-principal | vault unlocked |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-072-09.T08 | abuse | PS-072-05.R01, PS-072-05.R02, PS-072-05.R03 | write-spy on Deal, PaymentClaim, ChainObservation and Receipt stores during a run; relay traffic check | zero writes; no network traffic |

## Dependencies

Module depends on: F09.S01.M01, F09.S01.M03, F09.S02.M01, F09.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
