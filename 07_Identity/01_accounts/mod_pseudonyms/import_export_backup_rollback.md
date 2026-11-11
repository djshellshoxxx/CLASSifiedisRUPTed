# PS-052-10 — Import, export, backup and rollback: Pseudonymous accounts

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M01 Pseudonymous accounts](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/pseudonyms` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-052-10.R01** The vault export contains the Account and DeviceKey public data and statements; private keys are exported only inside the user's passphrase-encrypted key bundle chosen at export time.
- **PS-052-10.R02** Import validates DID derivation, statement signatures and key uniqueness, and never imports another principal's private data.
- **PS-052-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** Sections identity.account and identity.device_keys in classrup-export/v1 (schemas classrup.identity.account/v1 and classrup.identity.device_key/v1) plus the signed link and revocation statements; optional private key bundle encrypted with XChaCha20-Poly1305 under a scrypt (N=2^17, r=8, p=1) key.
- **import:** Import into an empty vault restores the principal; if the DID derivation or a statement signature fails the section is rejected; importing a second principal into a vault with an existing one is refused with CONFLICT_STATE.
- **backup:** The vault export is the primary backup (IOX-6); relay registries back up under IOX-3 and IOX-7 and contain only public claims, so losing a relay loses no keys.
- **migration rollback:** Additive optional fields only in v1; the Unicode data release is stored in skeletonVersion and a data bump re-computes skeletons in a migration with rollback to the previous release.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-052-09.T16 | integration | PS-052-10.R01, PS-052-10.R02, PS-052-10.R03 | export, import into a fresh vault, vault erase | Account and DeviceKey public data round-trip; private keys excluded; erase deletes all |

## Dependencies

Module depends on: CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
