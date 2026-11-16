# PS-022-05 — Authorization and capabilities: Cycle dropouts

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M03 Cycle dropouts](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/dropouts` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-022-05.R01** Vault policy lets only the unlocked local principal withdraw itself; no one can withdraw another person, and a peer's withdrawal counts only if signed by that peer's registered key.
- **PS-022-05.R02** Local timeouts and signals are produced by the vault itself on behalf of the principal's vault policy and are labelled as local evidence.
- **PS-022-05.R03** Relays and moderators cannot create, cancel or alter dropouts.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| mutiny.dropout.withdraw | principal | principal is a participant; cycle proposed, committed or executing |
| mutiny.dropout.ingest | principal | envelope signer is the participant it names with a non-revoked device key |
| mutiny.dropout.evaluate | principal | vault unlocked; sweep touches only cycles in this vault |
| mutiny.dropout.read | principal | cycle stored in this vault |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-022-09.T09 | abuse | PS-022-05.R01, PS-022-05.R02, PS-022-07.R02, PS-022-01.R02, PS-022-02.R02 | forged withdrawal for another person; other principal calls withdraw; replay on new cycle | quarantined or FORBIDDEN; replay ignored |
| TEST-PS-022-09.T12 | chaos | PS-022-06.R03, PS-022-05.R03 | relay down while withdrawing | local cancellation immediate; UI shows prepared; peers cancel by their own deadline |
| TEST-PS-022-09.T16 | integration | PS-022-05.R03, PS-022-07.R02 | identity erased locally | records pseudonymized and retained; privateReason stripped from exports to others |

## Dependencies

Module depends on: F02.S03.M01, F02.S03.M04, F02.S01.M02, F07.S01.M01, F07.S02.M02, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
