# PS-111-05 — Authorization and capabilities: WCAG 2.2 AA conformance

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M03 WCAG 2.2 AA conformance](SPEC.md) · **Scope:** MVP · **Code:** `tests/a11y` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-111-05.R01** The tooling needs no application authorization and runs only in CI and on developer machines.
- **PS-111-05.R02** Waiver changes require review by two maintainers (CODEOWNERS) because they weaken the gate.
- **PS-111-05.R03** Test fixtures use synthetic vaults and never real user data.

## Specification

_None._

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-111-09.T08 | abuse | PS-111-05.R01, PS-111-05.R02, PS-111-05.R03, PS-111-07.R01, PS-111-07.R03 | PR that edits waivers.yaml or disables an axe rule with one reviewer | CI requires two CODEOWNERS approvals; rule disabling in config rejected |

## Dependencies

Module depends on: F14.S01.M01, F14.S01.M02, F14.S02.M01, CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
