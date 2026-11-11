# PS-086-05 — Authorization and capabilities: Federated conflicts

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M03 Federated conflicts](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/conflicts` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-086-05.R01** In the vault only the unlocked local principal may resolve conflicts; on a relay only that relay's operator may, and only public_projection conflicts.
- **PS-086-05.R02** Detection is an internal capability granted only to F11.S01.M02 and F11.S03.M03 code paths, never to external requests.
- **PS-086-05.R03** Conflict records are visible only to the owner of the vault or the operator of the hosting relay; others receive NOT_FOUND.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| federation.conflict.detect | local principal, system | vault policy: called from the verified receive pipeline or move verification; relay policy: called from the verified inbox pipeline |
| federation.conflict.resolve | local principal, operator | vault policy: unlocked vault owner; relay policy: operator role of that relay for statementClass public_projection only, with an audit entry |
| federation.conflict.read | local principal, operator | vault: own vault; relay: operator of that relay |
| federation.conflict.check | local principal, system | in-process synchronous call by domain modules of the unlocked vault; never exposed to other principals |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-086-09.T09 | abuse | PS-086-05.R01, PS-086-05.R02, PS-086-05.R03 | non-operator resolves on relay; external request calls detect; third party reads conflict | FORBIDDEN or NOT_FOUND; operator resolution logged with decidedBy |

## Dependencies

Module depends on: F11.S02.M02, F11.S01.M03, F11.S01.M01, F07.S02.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
