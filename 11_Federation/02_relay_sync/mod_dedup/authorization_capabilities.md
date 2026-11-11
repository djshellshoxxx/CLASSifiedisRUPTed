# PS-087-05 — Authorization and capabilities: Federated dedup

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M02 Federated dedup](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/dedup` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-087-05.R01** The library has no roles; it is called by F11.S01.M02 after authorization and signature checks.
- **PS-087-05.R02** It never reads secrets and holds no keys.
- **PS-087-05.R03** Callers must not call decide() on unverified envelopes; the API requires a VerifiedEnvelope type so this is enforced by types.

## Specification

_None._

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-087-09.T06 | unit | PS-087-04.R02, PS-087-04.R03, PS-087-05.R01, PS-087-05.R02, PS-087-05.R03 | inspect exports and signatures | only pure functions; no events; Result type; VerifiedEnvelope required by type; no key material reachable |

## Dependencies

Module depends on: F11.S01.M03, CTR-FED-001, CTR-ERR-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
