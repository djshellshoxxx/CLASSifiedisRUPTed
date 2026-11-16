# PS-111-10 — Import, export, backup and rollback: WCAG 2.2 AA conformance

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M03 WCAG 2.2 AA conformance](SPEC.md) · **Scope:** MVP · **Code:** `tests/a11y` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-111-10.R01** The module holds no user data; its repository artifacts are versioned with each release tag.
- **PS-111-10.R02** Upgrading axe-core or @axe-core/playwright is done by pinning exact versions after a trial run, and a rollback restores the previous pin and baseline report.
- **PS-111-10.R03** The accessibility statement draft is generated from results and edited by humans, never published automatically.

## Specification

- **export:** The report (json and html), checklist and statement draft are attached to each release as artifacts; no user data.
- **import:** Nothing is imported; fixtures are generated from seeds in the repository.
- **backup:** Artifacts live in version control and the CI artifact store; no separate backup is needed.
- **migration rollback:** Pins: @axe-core/playwright 4.14.0 with a matching axe-core version; to upgrade, run the trial, review new findings, change the pin; rollback is a pin revert with the previous baseline report.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-111-09.T14 | integration | PS-111-10.R01, PS-111-10.R02, PS-111-10.R03 | generate accessibility statement draft; upgrade axe-core minor version | draft lists results and waivers; new findings from the upgrade listed before the pin changes |

## Dependencies

Module depends on: F14.S01.M01, F14.S01.M02, F14.S02.M01, CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
