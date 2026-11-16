# PS-135-01 — Domain schema: Integration testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M03 Integration testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/integration` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-135-01.R01** The module owns no persisted entities; it creates throwaway in-memory vaults (one per participant), an optional in-memory relay database and destroys them on exit.
- **PS-135-01.R02** Seed data is built through public commands where possible and through fixtures only for actors and listings, never by writing rows directly in flow suites.
- **PS-135-01.R03** Flow reports store step names, event types and IDs only; no payload content of P2–P4 data is written to the report.

## Specification

**Note:** Tooling module: owns no persisted entities. Its outputs are test configuration, source files under the code path and CI artifacts (JSON/JUnit/LCOV reports) that are regenerated on every run and never stored by the relay.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-135-09.T01 | integration | PS-135-01.R01, PS-135-03.R03 | boot harness and tear down 20 times | each database is isolated and removed; outbox drained assertion runs |
| TEST-PS-135-09.T02 | integration | PS-135-01.R02, PS-135-01.R03, PS-135-07.R01 | run flows and inspect reports | no row writes by fixtures in flow files; report holds only step names, types, IDs |

## Dependencies

Module depends on: CTR-TST-001, CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-IDM-001, CTR-COM-001, CTR-FED-001, CTR-ID-001, F17.S01.M01, F15.S02.M02, F15.S02.M03. Predecessor: [module SPEC](SPEC.md).
