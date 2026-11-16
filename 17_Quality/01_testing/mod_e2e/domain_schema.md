# PS-134-01 — Domain schema: E2E testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M04 E2E testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/e2e` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-134-01.R01** The module owns no persisted entities; each worker gets a fresh browser context whose vault (IndexedDB) starts empty, plus an optional throwaway test relay for the with-relay profile.
- **PS-134-01.R02** Test accounts are generated pseudonyms with device keys created in the browser context; no real accounts exist.
- **PS-134-01.R03** Artifacts (traces, screenshots on failure) are written under test-results/ and git-ignored.

## Specification

**Note:** Tooling module: owns no persisted entities. Its outputs are test configuration, source files under the code path and CI artifacts (JSON/JUnit/LCOV reports) that are regenerated on every run and never stored by the relay.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-134-09.T01 | e2e | PS-134-01.R01, PS-134-01.R02, PS-134-06.R02 | two workers run journeys in parallel | separate tenants and databases; no cross-test interference |
| TEST-PS-134-09.T02 | e2e | PS-134-01.R03, PS-134-07.R01 | force a failing test | artifacts only under test-results/, and Authorization headers are redacted in the trace |

## Dependencies

Module depends on: CTR-TST-001, CTR-UX-001, CTR-OBS-001, CTR-IDM-001, F17.S01.M01, F15.S01.M01, F15.S01.M02, F14.S01.M03. Predecessor: [module SPEC](SPEC.md).
