# PS-012-05 — Authorization and capabilities: Barter counteroffers

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S01.M04 Barter counteroffers](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/trade_proposals/counteroffer` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-012-05.R01** Vault policy lets only the unlocked local principal create revisions, and only when the principal is a party and it is their turn or they are the coordinator.
- **PS-012-05.R02** An incoming revision is accepted only if signed by a key registered to a party DID of the subject; otherwise it is quarantined with a reason.
- **PS-012-05.R03** Reading revisions is limited to the vault owner; no relay can read a revision's plaintext.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| mutiny.revision.create | principal | vault unlocked; principal is a party; turn or coordinator rule satisfied; subject open |
| mutiny.revision.ingest | principal | envelope signer is a party of the subject with a non-revoked device key |
| mutiny.revision.read | principal | own vault |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-012-09.T07 | abuse | PS-012-05.R01, PS-012-05.R02, PS-012-05.R03, PS-012-07.R03 | forged signature, non-party author, wrong-turn author, other principal reads | quarantine or FORBIDDEN or NOT_FOUND |

## Dependencies

Module depends on: F02.S01.M02, F02.S01.M03, F02.S02.M05, F02.S04.M01, F02.S04.M02, F07.S01.M01, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
