# PS-085-05 — Authorization and capabilities: Envelope signatures

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M03 Envelope signatures](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/signatures` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-085-05.R01** The library runs in the vault under the unlocked local principal and on relays under relay policy, and has no roles of its own; authorization of who may submit or accept envelopes is enforced by the modules that call it.
- **PS-085-05.R02** The relay private key is readable only by the relay signing service and never exposed through any API or log.
- **PS-085-05.R03** The module must not read any user private key; device keys are passed in by on-device callers only.

## Specification

_None._

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-085-09.T10 | unit | PS-085-01.R01, PS-085-03.R01, PS-085-03.R02, PS-085-03.R03, PS-085-04.R01, PS-085-04.R03, PS-085-05.R01, PS-085-05.R03 | call every function twice with identical input and inspect module for I/O and key-store access | identical outputs, no network or filesystem access, no event emitted, private keys only received as call arguments |
| TEST-PS-085-09.T17 | abuse | PS-085-05.R02 | relay signing service loaded with the relay key; call every exported API, every error path and the diagnostics export | key bytes never appear in responses, logs, metrics or the diagnostics bundle; signing is reachable only through the signing service handle |

## Dependencies

Module depends on: CTR-FED-001, CTR-ERR-001, CTR-ID-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
