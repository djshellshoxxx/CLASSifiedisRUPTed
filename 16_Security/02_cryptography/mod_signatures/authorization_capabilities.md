# PS-130-05 — Authorization and capabilities: Signatures

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M03 Signatures](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/signatures` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-130-05.R01** Only vault code holding an unlocked key handle can sign, and the helper never accepts raw key bytes from callers.
- **PS-130-05.R02** Verification is available to every module in vault and relay and requires no secret.
- **PS-130-05.R03** Context registry changes are code changes reviewed in the repository, not runtime configuration.

## Specification

_None._

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-130-09.T03 | property | PS-130-01.R02, PS-130-05.R02 | random payloads signed under context A and verified under B | always SECURITY_CONTEXT_MISMATCH; no cross-context validity |
| TEST-PS-130-09.T05 | unit | PS-130-04.R01, PS-130-04.R02, PS-130-05.R01 | consent for revision 4 verified against expected revision 5 and another entity | bindingOk false; SECURITY_BINDING_MISMATCH |
| TEST-PS-130-09.T07 | abuse | PS-130-05.R03, PS-130-07.R01, PS-130-07.R03 | attempt to call signJcs from non-federation module; unknown context; raw key bytes passed | not exported; rejected; API refuses raw key bytes |

## Dependencies

Module depends on: F16.S02.M02, CTR-FED-001, CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
