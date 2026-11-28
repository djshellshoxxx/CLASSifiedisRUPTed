# PS-111-07 — Privacy, retention and abuse: WCAG 2.2 AA conformance

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M03 WCAG 2.2 AA conformance](SPEC.md) · **Scope:** MVP · **Code:** `tests/a11y` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-111-07.R01** Test runs use synthetic data only, so reports contain no user data.
- **PS-111-07.R02** Reports contain selectors and rule ids, never text typed by users, and are kept as CI artifacts for 90 days.
- **PS-111-07.R03** The gate cannot be silently weakened, because waivers expire, require two reviewers and are listed in every report, and state exclusions in routes.yaml carry a reviewer.

## Specification

**Data classification**
- Report and checklist: repository artifacts, P0 (no personal data).

**Retention**
- CI artifacts 90 days; checklists and accessibility statement drafts are kept in the repository with each release tag.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Gate bypass by broad rule disabling or never-expiring waivers | waiver schema (max 90 days, exactly one target), two reviewers, report lists active waivers, CI blocks rule disabling in config |
| T02 | Tests passing only on the default state while other states are inaccessible | V02 requires a test for every applicable state, each excluded state carries a reviewed reason, and the state fixtures are seeded |
| T03 | Contrast regression via new tokens or themes | V03 runs on all token pairs and all themes on every change to tokens |
| T04 | Authentication screens regress into blocking paste or autofill, locking out users who rely on password managers | V07 automated check on every pull request with a paste-blocking fixture that must fail |

**Abuse controls**
- Changes to tests/a11y/waivers.yaml, the excluded states in tests/a11y/routes.yaml and axe configuration require CODEOWNERS approval from two reviewers.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-111-09.T08 | abuse | PS-111-05.R01, PS-111-05.R02, PS-111-07.R01, PS-111-07.R03 | PR that edits waivers.yaml, the excluded states of routes.yaml or disables an axe rule with one reviewer | CI requires two CODEOWNERS approvals; rule disabling in config rejected |
| TEST-PS-111-09.T10 | unit | PS-111-06.R01, PS-111-07.R01, PS-111-07.R02, PS-111-05.R03 | run twice on the same commit; scan reports for page text or user data; regenerate fixtures from their seeds | identical findings; reports contain selectors and rule ids only; regenerated fixtures are byte-identical to the committed ones and contain only synthetic data |

## Dependencies

Module depends on: F14.S01.M01, F14.S01.M02, F14.S02.M01, F16.S02.M01, F07.S01.M03, CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
