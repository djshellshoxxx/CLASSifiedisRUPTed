# PS-052-05 — Authorization and capabilities: Pseudonymous accounts

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M01 Pseudonymous accounts](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/pseudonyms` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-052-05.R01** Vault policy - only the unlocked local principal mutates its Account and DeviceKey records; a new device is authorized only by a link statement signed by the account signing key or an active device key.
- **PS-052-05.R02** Relay policy - a relay registry accepts a claim or release only when it is signed by the claimed DID's account signing key; relay operators can refuse a handle by hosting policy but cannot create or change a DID.
- **PS-052-05.R03** Pseudonym availability checks on a relay are public and rate limited by relay policy; local checks need only the unlocked vault.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| identity.account.create | anonymous | none; runs on the device before a principal exists |
| identity.account.update_pseudonym | principal | unlocked local principal |
| identity.account.read_own | principal | unlocked local principal |
| identity.account.check_pseudonym | principal, anonymous | vault - unlocked principal; relay - public with relay quota |
| identity.device_key.add | principal | unlocked principal and a valid link statement from an active key |
| identity.device_key.revoke | principal | unlocked principal; target key belongs to the account |
| identity.handle_registration.claim | anonymous, principal | relay policy allows registrations; claim signed by the DID signing key; within quota |
| identity.handle_registration.release | principal | release statement signed by the DID signing key |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-052-09.T10 | abuse | PS-052-05.R01, PS-052-05.R02, PS-052-05.R03 | locked vault mutates; claim signed by a different DID; operator tries to create a DID on the registry | FORBIDDEN or VALIDATION_FAILED; no registry row created |

## Dependencies

Module depends on: CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
