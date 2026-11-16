# PS-017-06 — Failure recovery and idempotency: Four-party cycles

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M02 Four-party cycles](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/four` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-017-06.R01** Queries are pure reads, safe to repeat.
- **PS-017-06.R02** A missing registration at startup is reported as degraded and handled by engine defaults.
- **PS-017-06.R03** Cached explanations are rebuilt from suggestions after a crash.

## Specification

- **idempotency:** Queries are naturally idempotent.
- **concurrency:** Read-only over a consistent IndexedDB snapshot.
- **retries:** No network calls; nothing to retry.
- **offline:** Fully available offline.
- **partial failure:** If a port for a basis label fails, the row shows basis unverifiable and the explanation is still returned.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-017-09.T07 | integration | PS-017-03.R02, PS-017-03.R03, PS-017-06.R02 | engine started without provider | engine default profile used and degraded diagnostic logged; never the 3-party profile |
| TEST-PS-017-09.T09 | integration | PS-017-06.R01, PS-017-06.R03, PS-017-07.R02, PS-017-08.R02 | crash and restart | explanations rebuilt within 10 ms and cache purged with suggestion |

## Dependencies

Module depends on: F02.S02.M03, F02.S02.M04, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
