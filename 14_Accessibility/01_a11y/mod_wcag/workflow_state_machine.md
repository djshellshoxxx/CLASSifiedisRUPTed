# PS-111-03 — Workflow state machine: WCAG 2.2 AA conformance

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M03 WCAG 2.2 AA conformance](SPEC.md) · **Scope:** MVP · **Code:** `tests/a11y` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-111-03.R01** The gate runs as a pipeline of install, build, route discovery, axe runs, contrast check, report and gate decision, and any failing step fails the build.
- **PS-111-03.R02** A release candidate cannot be tagged until the manual checklist for that candidate is complete.
- **PS-111-03.R03** There is no persisted lifecycle, so no entity state machine is declared.

## Specification

**Note:** Pipeline tooling; steps and decisions are defined by the CI configuration and are not entity lifecycles.

### Timeouts and scheduled transitions

- Axe suite timeout 20 min in CI; a hung browser run is killed and retried once.
- Waiver warning 14 days before expiry; expired waivers fail the build.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-111-09.T04 | unit | PS-111-01.R03, PS-111-02.R03, PS-111-03.R03 | waivers with 91 days, missing owner, expired, valid | I18N_A11Y_WAIVER_INVALID for the first three; valid waiver suppresses only its rule and route; 14-day warning emitted |
| TEST-PS-111-09.T05 | integration | PS-111-03.R01, PS-111-03.R02, PS-111-01.R02 | create a release candidate with an incomplete checklist | tagging blocked with I18N_A11Y_CHECKLIST_INCOMPLETE until all criteria have result, date, device, owner |

## Dependencies

Module depends on: F14.S01.M01, F14.S01.M02, F14.S02.M01, CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
