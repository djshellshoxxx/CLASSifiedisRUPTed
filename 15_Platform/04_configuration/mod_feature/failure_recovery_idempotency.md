# PS-123-06 — Failure recovery and idempotency: Feature registry

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M01 Feature registry](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/feature` · **Contracts:** [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-123-06.R01** Generation and queries are pure functions of their inputs and are idempotent by construction.
- **PS-123-06.R02** A failed generation leaves the previous generated file untouched and fails the build.
- **PS-123-06.R03** A vault and a relay of different releases compare hashes and treat a mismatch as informational, not as an error that blocks work.

## Specification

- **idempotency:** Generation writes registry.generated.json via temp file and rename; running it twice yields identical bytes. Queries have no side effects.
- **concurrency:** No shared mutable state at runtime. In CI, generation runs once per build; concurrent runs write identical content.
- **retries:** Nothing to retry at runtime; CI reruns on failure after the underlying edit is fixed.
- **offline:** The registry is compiled into the app and works fully offline in the vault and without a relay.
- **partial failure:** If validation passes but writing fails the build fails and nothing is published. If a module spec is missing, generation continues in normal mode with dependsOnKnown false and the module default off and unregistered, and fails in strict mode with PLATFORM_FEATURE_SPEC_MISSING.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-123-09.T04 | integration | PS-123-03.R02, PS-123-03.R03, PS-123-06.R02 | break validation in each pipeline step | generation fails, previous file untouched, nothing published |
| TEST-PS-123-09.T07 | integration | PS-123-01.R03, PS-123-06.R01 | build twice from the same commit, then edit planning/modules.yaml without regenerating | identical bytes; stale check fails with PLATFORM_FEATURE_REGISTRY_STALE |
| TEST-PS-123-09.T08 | integration | PS-123-06.R03, PS-123-02.R03 | vault of release N queries relay of release N+1 hash | mismatch reported informationally, work continues, unknown modules listed |
| TEST-PS-123-09.T16 | unit | PS-123-02.R04, PS-123-06.R03 | fixture catalog where module X has no spec and module Y (default on) depends on X; generate in normal and strict mode | X has dependsOnKnown false, defaultState off, registered false; Y fails V04 with PLATFORM_FEATURE_DEFAULT_VIOLATION until it defaults off; strict mode fails with PLATFORM_FEATURE_SPEC_MISSING |

## Dependencies

Module depends on: CTR-FLG-001, CTR-ERR-001, CTR-ID-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
