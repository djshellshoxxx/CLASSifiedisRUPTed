# PS-130-05 — Authorization and capabilities: Signatures

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M03 Signatures](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/signatures` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-130-05.R01** Only vault code holding an unlocked key handle can sign, and the helper never accepts raw key bytes from callers.
- **PS-130-05.R02** Verification is available to every module in vault and relay and requires no secret.
- **PS-130-05.R03** Inventory changes are code changes reviewed in the repository, not runtime configuration.

## Specification

_None._

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-130-09.T07 | abuse | PS-130-04.R03, PS-130-05.R01 | import scan for signJcs, verifyJcs or a local Ed25519, JCS or did:key implementation; unknown context; raw key bytes passed to sign | none present, only F11.S01.M03 imported; rejected; refused |
| TEST-PS-130-09.T10 | unit | PS-130-07.R01, PS-130-05.R03 | honesty text in the signature detail panel; UI string audit; inventory loaded from the frozen code table | note present in all locales; no wording claims delivery or handover; the inventory cannot be changed at runtime |
| TEST-PS-130-09.T13 | integration | PS-130-10.R01, PS-130-10.R02, PS-130-10.R03, PS-130-05.R02 | export consents with envelopes, import to a fresh vault holding no secret, version downgrade attempt | envelopes re-verify identically from public keys and key status only; unknown envelope version kept opaque and flagged |

## Dependencies

Module depends on: F11.S01.M03, CTR-FED-001, CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
