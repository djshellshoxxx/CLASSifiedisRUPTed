# PS-023-05 — Authorization and capabilities: Cycle locks

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M02 Cycle locks](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/lock` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-023-05.R01** Vault policy lets only the unlocked local principal reserve or release, and only items the principal owns.
- **PS-023-05.R02** A peer reservation statement is accepted only when signed by a registered device key of a giver in the subject's head revision and only for items that giver lists; otherwise it is quarantined.
- **PS-023-05.R03** Relays have no capability over reservations and see only ciphertext.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| mutiny.lock.reserve | principal | vault unlocked; principal owns the items; principal is a giver in the head revision; subject open |
| mutiny.lock.release | principal | principal signed the reservation and it is active |
| mutiny.lock.ingest | principal | envelope signer is a giver in the head revision with a non-revoked device key and not blocked by the principal |
| mutiny.lock.release_for_subject | system | internal LockPort; caller is F02.S01.M01, F02.S03.M01 or F02.S03.M03 in the same vault transaction |
| mutiny.lock.read | principal | subject stored in this vault |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-023-09.T11 | abuse | PS-023-05.R01, PS-023-05.R02, PS-023-05.R03, PS-023-07.R03 | other principal reserves; reservation for another person's item; relay inspects mailbox | FORBIDDEN or quarantine; relay sees ciphertext only |

## Dependencies

Module depends on: F01.S03.M01, F01.S01.M01, F07.S01.M01, F07.S02.M02, F16.S02.M03, F15.S01.M01, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
