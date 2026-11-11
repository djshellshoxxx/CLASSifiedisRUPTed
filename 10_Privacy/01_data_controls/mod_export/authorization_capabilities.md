# PS-078-05 — Authorization and capabilities: Data export

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M03 Data export](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/export` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-078-05.R01** Under vault policy (CAP-8) only the unlocked principal requests, cancels, reads or downloads its own export, and a fresh unlock within 5 minutes is required to start and to download.
- **PS-078-05.R02** Suspension on any relay never affects export rights because the vault is local (CAP-5, CAP-9).
- **PS-078-05.R03** Relays have no capability here and receive nothing from this module.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| privacy.export.request | local-principal | vault unlocked within 5 minutes; limits met |
| privacy.export.cancel | local-principal | job requested or collecting |
| privacy.export.download | local-principal | vault unlocked within 5 minutes; job ready and not expired |
| privacy.export.read | local-principal | vault unlocked |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-078-09.T09 | abuse | PS-078-05.R01, PS-078-05.R02, PS-078-05.R03 | locked vault; suspended relay; relay inspects traffic | request refused when locked; export unaffected by suspension; zero network traffic |

## Dependencies

Module depends on: F07.S01.M01, F10.S01.M01, CTR-IOX-001, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
