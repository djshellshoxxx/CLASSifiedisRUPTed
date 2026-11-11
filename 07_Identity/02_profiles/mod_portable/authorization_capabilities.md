# PS-055-05 — Authorization and capabilities: Portable identity

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S02.M01 Portable identity](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/profiles/portable` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-055-05.R01** Vault policy - only the unlocked principal on its root device issues documents for its own DID; any signed document is accepted into the store only after cryptographic verification, so authority comes from the root key signature, not from the sender.
- **PS-055-05.R02** Relay policy - publication is open to anyone presenting a valid signed document within quota (no account needed), and reads are public; a relay operator may refuse a DID by hosting policy but cannot alter a document.
- **PS-055-05.R03** A blocked DID's documents are dropped silently through the injected BlockFilterPort, implemented by F07.S02.M02, and the sender cannot tell.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| identity.portable_doc.issue | principal | unlocked local principal on the root device; expectedSeq matches the stored seq |
| identity.portable_doc.receive | principal | signature verifies; BlockFilterPort does not report the DID (otherwise dropped silently) |
| identity.portable_doc.resolve | principal | unlocked local principal; the chosen document passes V10 |
| identity.portable_doc.publish | anonymous, principal | valid signed document within relay quota; relay hosting policy allows the DID |
| identity.portable_doc.read_public | principal, anonymous | public read; relay quota applies |
| identity.portable_doc.read_own | principal | unlocked local principal |
| identity.portable_doc.read_linkage | principal, operator | vault - unlocked principal or in-process modules; relay - the host relay's anti-shill checks over documents it stores (N11) |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-055-09.T09 | abuse | PS-055-05.R01, PS-055-05.R02, PS-055-05.R03 | locked vault or non-root device issues; blocked DID's document received; operator edits a stored document | FORBIDDEN or IDENTITY_ROOT_KEY_REQUIRED; blocked document dropped silently with no error; edit impossible because the signature fails |

## Dependencies

Module depends on: F07.S01.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
