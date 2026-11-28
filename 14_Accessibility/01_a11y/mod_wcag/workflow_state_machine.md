# PS-111-03 — Workflow state machine: WCAG 2.2 AA conformance

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M03 WCAG 2.2 AA conformance](SPEC.md) · **Scope:** MVP · **Code:** `tests/a11y` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-111-03.R01** The gate runs as a pipeline of install, build, route discovery, axe runs, contrast check, authentication-assistance check, report and gate decision, and any failing step fails the build.
- **PS-111-03.R02** A release candidate cannot be tagged until the manual checklist for that candidate is complete.
- **PS-111-03.R03** There is no persisted lifecycle, so no entity state machine is declared.
- **PS-111-03.R04** Pull requests run the pairwise subset (light + 320 px + en and dark + desktop + ar-XB) over every route and applicable state; the full matrix runs nightly and must pass on the exact commit of a release candidate before it is tagged.

## Specification

**Note:** Pipeline tooling; steps and decisions are defined by the CI configuration and are not entity lifecycles.

### Timeouts and scheduled transitions

- Pull-request axe subset timeout 20 min and nightly full-matrix timeout 75 min in CI; a hung browser run is killed and retried once.
- Waiver warning 14 days before expiry; expired waivers fail the build.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-111-09.T04 | unit | PS-111-01.R03, PS-111-02.R03, PS-111-03.R03 | waivers with 91 days, missing owner, expired, no target, two targets, a valid route waiver and a valid lint waiver on a component path read by the F14.S01.M01 lint runner | I18N_A11Y_WAIVER_INVALID for the first five; the route waiver suppresses only its rule and route; the component waiver suppresses only its lint rule on that component; 14-day warning emitted |
| TEST-PS-111-09.T05 | integration | PS-111-03.R01, PS-111-03.R02, PS-111-03.R04 | create a release candidate with an incomplete checklist, then with a complete checklist but no full-matrix run on its commit | tagging blocked with I18N_A11Y_CHECKLIST_INCOMPLETE until all criteria have result, date, device, owner, and blocked until the full matrix passes on that commit |

## Dependencies

Module depends on: F14.S01.M01, F14.S01.M02, F14.S02.M01, F16.S02.M01, F07.S01.M03, CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
