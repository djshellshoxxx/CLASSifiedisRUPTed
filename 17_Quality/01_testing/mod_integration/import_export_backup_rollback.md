# PS-135-10 — Import, export, backup and rollback: Integration testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M03 Integration testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/integration` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-135-10.R01** The flow report reports/integration.json is the only export; it contains no user data.
- **PS-135-10.R02** The federation_io flow exports a bundle from relay A and imports into relay B to prove CTR-IOX-001 and CTR-FED-001 round trips.
- **PS-135-10.R03** Rollback is a git revert; harness changes never alter production code.

## Specification

- **export:** reports/integration.json (flows, steps, event types, requirement IDs) and JUnit XML; no user data.
- **import:** The federation_io flow imports a CTR-IOX-001 export bundle into a fresh relay; the harness itself imports no external data.
- **backup:** Harness code is in git; reports kept 14 days.
- **migration rollback:** Revert the harness commit; flows are versioned with the modules they test and updated in the same pull request as behavior changes.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-135-09.T15 | integration | PS-135-10.R01, PS-135-10.R02 | federation_io: export from relay A, import to relay B | entities round trip identical; conflicting IDs rejected; report contains no user data |
| TEST-PS-135-09.T16 | integration | PS-135-10.R03 | revert harness commit in a branch | production tests unaffected |

## Dependencies

Module depends on: CTR-TST-001, CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-IDM-001, CTR-COM-001, CTR-FED-001, CTR-ID-001, F17.S01.M01, F15.S02.M02, F15.S02.M03. Predecessor: [domain_schema.md](domain_schema.md).
