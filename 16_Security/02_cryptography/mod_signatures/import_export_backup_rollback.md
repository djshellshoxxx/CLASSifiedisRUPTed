# PS-130-10 — Import, export, backup and rollback: Signatures

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M03 Signatures](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/signatures` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-130-10.R01** Exports embed envelopes verbatim with their canonical payloads so they can be re-verified by anyone with the signer's public key.
- **PS-130-10.R02** Import re-verifies every envelope under its recorded context, marks failures as unverified and never silently drops or upgrades them.
- **PS-130-10.R03** Envelope and context changes are versioned, with old contexts verifiable for at least 5 years and new major versions introduced alongside.

## Specification

- **export:** Envelopes are exported inside the records that embed them (consents, receipts) with their payloads; the inventory version used is recorded in the export manifest.
- **import:** Each envelope is re-verified on import with the payload from the record; failures are stored as unverified with the failure code; envelopes with unknown versions are kept opaque and flagged.
- **backup:** No module-specific backup; envelopes are backed up with their records (vault export IOX-6, relay IOX-3).
- **migration rollback:** A new context version (for example classrup/consent/v2) is added beside v1 and v1 stays verifiable; the header form of v1 replaces the earlier prefix-concatenation form before any release, so no published envelope uses the old bytes; rollback to an older client leaves unknown envelopes opaque and flagged rather than misread.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-130-09.T13 | integration | PS-130-10.R01, PS-130-10.R02, PS-130-10.R03, PS-130-05.R02 | export consents with envelopes, import to a fresh vault holding no secret, version downgrade attempt | envelopes re-verify identically from public keys and key status only; unknown envelope version kept opaque and flagged |

## Dependencies

Module depends on: F11.S01.M03, CTR-FED-001, CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
