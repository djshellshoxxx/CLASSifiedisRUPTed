# PS-056-05 — Authorization and capabilities: Profiles

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S02.M02 Profiles](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/profiles/profiles` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-056-05.R01** Vault policy - only the unlocked principal edits, publishes or unpublishes its profile and edits its block list; received profiles are accepted only with a valid signature by a device key that the profile DID's latest verified document does not mark revoked at receipt, and are quarantined when a revocation learned later took effect before this vault first saw them.
- **PS-056-05.R02** Visibility is enforced at composition and at read; a stranger can never read contacts or private fields because those never leave the vault in a public statement.
- **PS-056-05.R03** Relay policy - a relay may host profile statements and stop serving its copy under its policy; it has no access to blocks and cannot change a vault's records.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| identity.profile.write_own | principal | unlocked local principal |
| identity.profile.publish_own | principal | unlocked local principal; audience contacts requires an existing thread; federation_publish consent per relay |
| identity.profile.unpublish_own | principal | unlocked local principal; own profile is published |
| identity.profile.receive | principal | signature verifies with an active signer key; signer DID not blocked (otherwise dropped silently) |
| identity.profile.read_view | principal, anonymous | vault - unlocked principal; relay copies - public read of public fields only |
| identity.block_entry.write_own | principal | unlocked local principal |
| identity.block_entry.read_own | principal | unlocked local principal |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-056-09.T08 | abuse | PS-056-05.R01, PS-056-05.R02, PS-056-05.R03 | stranger requests contacts fields; forged profile for a known DID; locked vault edits; relay asks for the block list | only public fields served; signature fails; FORBIDDEN; the relay has no block data |
| TEST-PS-056-09.T18 | abuse | PS-056-05.R01, PS-056-02.R03 | a profile signed by P2 with a backdated createdAt arriving after the revoking document; P2's revocation learned later for a profile first seen after its effective time and one first seen before it | the first rejected with IDENTITY_PROFILE_INVALID; on learning, the later-seen one quarantined and the earlier-seen one kept with a revoked-signer marker |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, F11.S01.M01, F06.S02.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F10.S02.M03, F15.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
