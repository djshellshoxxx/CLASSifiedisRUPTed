# PS-123-02 — Validation rules: Feature registry

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M01 Feature registry](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/feature` · **Contracts:** [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-123-02.R01** Generation validates structure, graph and defaults and fails the build on any violation with a stable code.
- **PS-123-02.R02** The same input always produces byte-identical output so that staleness is detectable by comparison.
- **PS-123-02.R03** Registry queries validate keys against the registry and never accept free-form patterns.
- **PS-123-02.R04** A module whose spec is missing is never treated as a module without dependencies; it stays off and unregistered, and strict generation fails.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | module ID matches F[0-9]{2}.S[0-9]{2}.M[0-9]{2} and feature ID matches F[0-9]{2} | VALIDATION_FAILED |
| V02 | every dependsOn entry that is not CTR-* exists in planning/modules.yaml and is not the module itself | PLATFORM_FEATURE_UNKNOWN_DEPENDENCY |
| V03 | the dependency graph is acyclic (Kahn topological sort consumes all catalog nodes) | PLATFORM_FEATURE_CYCLE |
| V04 | every module with defaultState on has all dependsOn modules defaultState on and registered | PLATFORM_FEATURE_DEFAULT_VIOLATION |
| V05 | generated file equals the output of a fresh generation | PLATFORM_FEATURE_REGISTRY_STALE |
| V06 | query key is a known module or feature ID | NOT_FOUND |
| V07 | core features F15 and F16 have no module with defaultState off | PLATFORM_FEATURE_DEFAULT_VIOLATION |
| V08 | surface is vault, relay or both and equals the value derived from the catalog code path (apps/pwa, apps/relay, packages) | VALIDATION_FAILED |
| V09 | every catalog module has a module.spec.yaml (strict generation); in normal generation a missing spec yields dependsOnKnown false, defaultState off and registered false | PLATFORM_FEATURE_SPEC_MISSING |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-123-09.T01 | unit | PS-123-01.R01, PS-123-01.R02, PS-123-02.R02 | generate from the valid fixture twice | identical bytes, fields present on every record, hash equals sha256 of canonical JSON |
| TEST-PS-123-09.T02 | unit | PS-123-02.R01, PS-123-02.R03 | each of V01-V09 violated in turn | documented code returned; query for unknown key returns NOT_FOUND |
| TEST-PS-123-09.T03 | property | PS-123-03.R01, PS-123-02.R01 | random digraphs with and without injected back edges | cycle detected exactly when one exists; topological order places dependencies first |
| TEST-PS-123-09.T08 | integration | PS-123-06.R03, PS-123-02.R03 | vault of release N queries relay of release N+1 hash | mismatch reported informationally, work continues, unknown modules listed |
| TEST-PS-123-09.T16 | unit | PS-123-02.R04, PS-123-06.R03 | fixture catalog where module X has no spec and module Y (default on) depends on X; generate in normal and strict mode | X has dependsOnKnown false, defaultState off, registered false; Y fails V04 with PLATFORM_FEATURE_DEFAULT_VIOLATION until it defaults off; strict mode fails with PLATFORM_FEATURE_SPEC_MISSING |

## Dependencies

Module depends on: CTR-FLG-001, CTR-ERR-001, CTR-ID-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
