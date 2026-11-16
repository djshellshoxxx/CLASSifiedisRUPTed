# PS-140-01 — Domain schema: Offline testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M03 Offline testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/offline` · **Contracts:** [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-140-01.R01** The module owns no persisted entities; it reads the OutboxEntry shape owned by F15.S01.M01 through the public API and never defines its own copy.
- **PS-140-01.R02** Test fixtures create outbox entries through the production enqueue function so the schema is exercised as shipped.
- **PS-140-01.R03** Network scenarios are described as data (sequence of online, offline, latency, loss steps) in tests/offline/scenarios/.
- **PS-140-01.R04** The core must work with no relay configured: create, edit and search local records and sign statements offline; the sync status shows local committed and never sent or delivered without a transport acknowledgement.

## Specification

**Note:** Tooling module: owns no persisted entities. Its outputs are test configuration, source files under the code path and CI artifacts (JSON/JUnit/LCOV reports) that are regenerated on every run and never stored by the relay.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-140-09.T01 | unit | PS-140-01.R01, PS-140-01.R02, PS-140-01.R03 | enqueue through production function with a scenario file | entry matches the OutboxEntry schema; scenario parses |
| TEST-PS-140-09.T16 | e2e | PS-140-01.R04 | no relay configured, network blocked: create and search records, sign a statement | works; status local committed |

## Dependencies

Module depends on: CTR-IDM-001, CTR-ERR-001, CTR-UX-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M04, F15.S01.M01, F15.S01.M02. Predecessor: [module SPEC](SPEC.md).
