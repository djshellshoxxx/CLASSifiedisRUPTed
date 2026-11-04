# PS-145-09 — Contract and acceptance tests: Jurisdiction profiles

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M01 Jurisdiction profiles](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/jurisdictions` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-145-09.R01** Every requirement is covered by at least one automated test.
- **PS-145-09.R02** Contract tests validate statements, commands and events against the registry and verify signatures.
- **PS-145-09.R03** Privacy-floor tests fail the build if any profile field can loosen CTR-PRV-001.

## Specification

See the module test table below (all processes).

**Fixtures:** Publisher vault P with key KP, trusted and untrusted publisher keys, categories C1 (restricted) and C2, approved proposal D1 for code eu-de, user vault U, clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-145-09.T01 | unit | PS-145-01.R01, PS-145-02.R01, PS-145-02.R02 | draft a valid profile and one with bad code | stored revision 1; invalid input rejected with documented code |
| TEST-PS-145-09.T02 | unit | PS-145-01.R02, PS-145-01.R03, PS-145-02.R03 | violate each rule V01-V09 | documented error code returned; nothing released or stored |
| TEST-PS-145-09.T03 | property | PS-145-01.R03, PS-145-02.R02 | random retention and location values | values outside bounds or above L2 never accepted |
| TEST-PS-145-09.T04 | property | PS-145-03.R01, PS-145-03.R02 | random lifecycle commands | only declared transitions; at most one active version per code; retired terminal |
| TEST-PS-145-09.T05 | integration | PS-145-03.R03, PS-145-04.R03 | select two overlapping profiles | stricter value wins per field; sources reported |
| TEST-PS-145-09.T06 | contract | PS-145-04.R01, PS-145-04.R02, PS-145-09.R02 | release, receive, select | statements validate and verify; activated event payload valid |
| TEST-PS-145-09.T07 | abuse | PS-145-05.R01, PS-145-05.R02 | untrusted publisher, tampered statement, non-publisher release | pending or FORBIDDEN or rejected; selection and age never sent over network (spy) |
| TEST-PS-145-09.T08 | abuse | PS-145-05.R03, PS-145-07.R02 | relay serves and uploads; scan logs for age declaration | anonymous read allowed, upload needs operator key, no age data in logs |
| TEST-PS-145-09.T09 | integration | PS-145-06.R01, PS-145-06.R02 | replay release; crash after supersede | one active version; consistent after restart |
| TEST-PS-145-09.T10 | chaos | PS-145-06.R03 | relay rejects upload | local release stands with relay_rejected delivery |
| TEST-PS-145-09.T11 | abuse | PS-145-07.R01, PS-145-07.R03 | inspect UI strings and stored data | disclaimer present; no age verification claim; no personal data in profiles |
| TEST-PS-145-09.T12 | load | PS-145-08.R01, PS-145-08.R02, PS-145-08.R03 | 100 resolves per second for 1 minute on Moto G profile; relay 50 req/s | resolve p95 <= 15 ms, relay p95 <= 150 ms, no telemetry |
| TEST-PS-145-09.T13 | unit | PS-145-09.R01, PS-145-09.R03 | traceability tool run | every PS-145 requirement maps to a passing test |
| TEST-PS-145-09.T14 | integration | PS-145-10.R01, PS-145-10.R02, PS-145-10.R03 | export, import to fresh vault, import profile with bad bounds | round-trip; invalid profile rejected in dry-run |

## Acceptance criteria

- All tests T01-T14 pass in CI.
- No profile can weaken a privacy floor, set evidence retention outside 180 to 3 650 days, or be activated without a verified decision (except a publisher's first profile).
- The age declaration and selection never leave the device.

## Dependencies

Module depends on: F18.S01.M03, F18.S02.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
