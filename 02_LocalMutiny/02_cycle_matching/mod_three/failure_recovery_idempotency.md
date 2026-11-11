# PS-020-06 — Failure recovery and idempotency: Three-party cycles

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M01 Three-party cycles](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/three` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-020-06.R01** Queries are pure reads and safe to repeat; there is nothing to replay.
- **PS-020-06.R02** If the engine registration is missing at startup the module reports degraded and the engine default profile is used.
- **PS-020-06.R03** Cached explanations are rebuilt from suggestions after a crash.

## Specification

- **idempotency:** Queries are naturally idempotent; no Idempotency-Key is needed.
- **concurrency:** Read-only; explanations are rebuilt from a consistent IndexedDB snapshot.
- **retries:** No network calls; nothing to retry.
- **offline:** Fully available offline.
- **partial failure:** If a port needed for a basis label fails, that row shows basis unverifiable and the explanation is still returned.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-020-09.T07 | integration | PS-020-03.R02, PS-020-03.R03, PS-020-06.R03 | engine started without the length-3 profile registered | engine default profile used from the F02.S02.M05 registry and degraded diagnostic logged |
| TEST-PS-020-09.T09 | integration | PS-020-06.R01, PS-020-06.R02, PS-020-08.R02 | crash and restart | explanations rebuilt, computation within 10 ms |

## Dependencies

Module depends on: F02.S02.M03, F02.S02.M04, F02.S02.M05, F02.S04.M02, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
