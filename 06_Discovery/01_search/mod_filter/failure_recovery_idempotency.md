# PS-044-06 — Failure recovery and idempotency: Search filters

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S01.M03 Search filters](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/search/filter` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-044-06.R01** Functions are pure and deterministic, so retries and replays are inherently safe.
- **PS-044-06.R02** Invalid input never produces partial output; the result is either a full compiled fragment or an error.
- **PS-044-06.R03** Port failures (category or currency lookup) surface as DEPENDENCY_UNAVAILABLE without partial state.

## Specification

- **idempotency:** Pure functions; the same input always returns the same output.
- **concurrency:** No shared state; safe to call concurrently from workers and tabs.
- **retries:** Callers may retry port lookups with the client backoff of CTR-IDM-001 IDM-4; compilation itself is never retried.
- **offline:** Works offline with the bundled category taxonomy and currency registry snapshot; stale snapshots only restrict which ids validate.
- **partial failure:** If the taxonomy snapshot is older than 30 days the filter still validates against it and the caller shows a 'categories may be out of date' hint.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-044-09.T10 | integration | PS-044-06.R01, PS-044-06.R02, PS-044-06.R03 | taxonomy port unavailable and stale snapshot | DEPENDENCY_UNAVAILABLE without partial output; stale snapshot validates with a hint |

## Dependencies

Module depends on: F06.S02.M01, CTR-ID-001, CTR-ERR-001, CTR-SCH-001, CTR-PRV-001, CTR-MNY-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
