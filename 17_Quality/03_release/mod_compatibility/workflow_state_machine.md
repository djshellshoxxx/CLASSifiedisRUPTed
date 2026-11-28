# PS-142-03 — Workflow state machine: Compatibility

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S03.M03 Compatibility](SPEC.md) · **Scope:** MVP · **Code:** `tests/compat` · **Contracts:** [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-142-03.R01** Vault upgrade runs through states N-1, upgrading and N; interruption in upgrading must resume or roll back on next start with zero lost or duplicated records.
- **PS-142-03.R02** Automated browser matrix cells move through queued, running and pass, fail or unsupported, and manual cells through pending checklist, then signed pass or signed fail; a cell marked unsupported needs an entry in the support policy.
- **PS-142-03.R03** A release is blocked when any automated cell fails its smoke journey, and when any manual cell (Firefox stable N and N-1, Safari desktop and iOS Safari last 2, iOS 16.4+ installed-PWA push) has a missing or failed signed checklist; F17.S03.M02 reads both from reports/compat.json.

## Specification

**Note:** Tooling module: no domain entity has a lifecycle. Runs are stateless processes that exit 0 (pass) or non-zero (fail).

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-142-09.T05 | chaos | PS-142-03.R01, PS-142-06.R01 | interrupt vault upgrade at each step, then restart | resumes or rolls back; zero lost and zero duplicated records; second upgrade identical |
| TEST-PS-142-09.T06 | e2e | PS-142-03.R02, PS-142-03.R03 | automated matrix smoke on Chrome N and N-1 (Chrome for Testing), Chrome beta (Playwright channel), Playwright Firefox build and Playwright WebKit build, then merge the manual checklist | each cell labelled with its engine source and real version and no automated cell labelled Safari; unsupported cells match the policy; a failing automated cell blocks with exit 2; a missing or failed manual cell blocks the release |
| TEST-PS-142-09.T16 | manual | PS-142-03.R03 | release checklist - smoke journeys on Firefox stable N and N-1, Safari desktop last 2 (macOS), iOS Safari last 2, and push delivery to an iOS 16.4+ installed PWA | each cell signed in gates/manual/<version>/ with device, OS, browser version, result and approver; compat:checklist merges them into reports/compat.json |
| TEST-PS-142-09.T17 | unit | PS-142-03.R02 | matrix report fixtures - a WebKit run labelled safari, a Playwright Firefox run labelled firefox stable, a cell without engine version | each fails with QUALITY_COMPAT_MATRIX_MISLABELED |

## Dependencies

Module depends on: CTR-SCH-001, CTR-ERR-001, CTR-FED-001, CTR-IOX-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F15.S02.M03, F11.S01.M02, F11.S01.M03, F10.S01.M03. Predecessor: [domain_schema.md](domain_schema.md).
