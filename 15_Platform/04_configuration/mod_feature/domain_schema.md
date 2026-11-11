# PS-123-01 — Domain schema: Feature registry

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M01 Feature registry](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/feature` · **Contracts:** [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-123-01.R01** The registry is a generated, immutable data structure (not a stored entity) with one record per feature and per module, and a content hash over canonical JSON (RFC 8785).
- **PS-123-01.R02** Each module record holds id, title, feature id, slug, scope, surface (vault, relay or both), defaultState, registered flag, core flag, dependsOn (module IDs only), dependsOnKnown and dependents (derived).
- **PS-123-01.R03** The registry file is part of the build and versioned with the application, so vault and relay of the same release agree.

## Specification

**Note:** Generated static data: no persisted entity. Shape of registry.generated.json: { version: 1, generatedFrom: sha256(planning/modules.yaml + module specs), features: [{ id, slug, title, core }], modules: [{ id, feature, title, scope, surface: vault|relay|both (from the catalog code path: apps/pwa -> vault, apps/relay -> relay, packages -> both), defaultState: on|off, registered: boolean, core: boolean, dependsOn: id[], dependsOnKnown: boolean (false when module.spec.yaml is missing; such a module is defaultState off and registered false), dependents: id[] }], order: id[] (topological), hash }.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-123-09.T01 | unit | PS-123-01.R01, PS-123-01.R02, PS-123-02.R02 | generate from the valid fixture twice | identical bytes, fields present on every record, hash equals sha256 of canonical JSON |
| TEST-PS-123-09.T07 | integration | PS-123-01.R03, PS-123-06.R01 | build twice from the same commit, then edit planning/modules.yaml without regenerating | identical bytes; stale check fails with PLATFORM_FEATURE_REGISTRY_STALE |
| TEST-PS-123-09.T17 | integration | PS-123-01.R02, PS-123-04.R04 | generate the real catalog, then list features with surface vault and surface relay and render both settings screens | F15.S03.M02 has surface relay and is absent from the vault list; F15.S01.M01 has surface vault and is absent from the operator console; packages modules appear in both |

## Dependencies

Module depends on: CTR-FLG-001, CTR-ERR-001, CTR-ID-001, CTR-OBS-001, CTR-TST-001. Predecessor: [module SPEC](SPEC.md).
