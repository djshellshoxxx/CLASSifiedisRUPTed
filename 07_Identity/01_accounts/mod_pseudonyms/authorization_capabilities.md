# PS-052-05 — Authorization and capabilities: Pseudonymous accounts

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M01 Pseudonymous accounts](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/pseudonyms` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-052-05.R01** Vault policy - only the unlocked local principal mutates its Account and DeviceKey records; a new device is authorized only by a link statement signed by the root key and by the new key's own possession signature.
- **PS-052-05.R02** Relay policy - a relay registry accepts a claim or release only when it names that relay and is signed by a device key active in the claimed DID's portable document; relay operators can refuse a handle by hosting policy but cannot create or change a DID.
- **PS-052-05.R03** Pseudonym availability checks on a relay are public and rate limited by relay policy; local checks need only the unlocked vault.
- **PS-052-05.R04** Routine statements are signed by device keys; only the root key may issue identity documents, link devices, confirm another key's revocation and sign recovery notices, and a linked device that lacks it gets IDENTITY_ROOT_KEY_REQUIRED.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| identity.account.create | anonymous | none; runs on the device before a principal exists |
| identity.account.update_pseudonym | principal | unlocked local principal |
| identity.account.read_own | principal | unlocked local principal |
| identity.account.check_pseudonym | principal, anonymous | vault - unlocked principal; relay - public with relay quota |
| identity.device_key.add | principal | unlocked principal on the root device; valid possession signature by the new key |
| identity.device_key.revoke | principal | unlocked principal; target key belongs to the account; signer role decides immediate or pending |
| identity.device_key.receive | principal | statement for the own DID; signer role verified per V07 and V11 |
| identity.handle_registration.claim | anonymous, principal | relay policy allows registrations; claim names this relay and is signed by a device key active in the DID's document; within quota |
| identity.handle_registration.release | principal | release names this relay, the registration and its current revision, signed by a device key active in the DID's document |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-052-09.T10 | abuse | PS-052-05.R01, PS-052-05.R02, PS-052-05.R03 | locked vault mutates; claim signed by a key not active in the DID's document; operator tries to create a DID on the registry; 21 availability checks in a minute | FORBIDDEN, UNAUTHENTICATED or VALIDATION_FAILED; no registry row created; 21st check RATE_LIMITED |
| TEST-PS-052-09.T20 | abuse | PS-052-01.R04, PS-052-05.R04 | A2 signs a profile with a backdated createdAt after its revocation; verifier V1 holds the revoking document, verifier V2 first saw the profile after revokesEffectiveAt and learns of the revocation later, verifier V3 first saw an older profile before revokesEffectiveAt | V1 refuses it (KeyStatusPort at receiver time); V2 quarantines it on learning the revocation; V3 keeps its profile with a revoked-signer marker and the revocation date shown as a claim |
| TEST-PS-052-09.T26 | unit | PS-052-05.R04, PS-052-02.R05 | linked device A2 tries identity.device_key.add and confirms another key's revocation | IDENTITY_ROOT_KEY_REQUIRED for both; A2 can still sign routine statements and revoke itself |

## Dependencies

Module depends on: F16.S02.M02, F10.S01.M02, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
