# PS-110-05 — Authorization and capabilities: Screen reader support

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M02 Screen reader support](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/a11y/screenreader` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-110-05.R01** The library performs no authorization and has no roles; it runs under the unlocked local principal in the browser.
- **PS-110-05.R02** It never reads vault data on its own; callers pass values in.
- **PS-110-05.R03** Announcements must not contain P3 or P4 data, so callers pass only the same text that is visible on screen.

## Specification

_None._

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-110-09.T05 | contract | PS-110-04.R01, PS-110-04.R02, PS-110-04.R03, PS-110-01.R02, PS-110-01.R03, PS-110-03.R03, PS-110-05.R01, PS-110-05.R02, PS-110-10.R01 | inspect exports, storage and network calls; run spoken helpers on typed inputs and invalid ones | no vault, IndexedDB or network access; no stored data or persisted state; pure typed functions; Ok for valid input; Err(COMMERCE_MONEY_INVALID) for amount '01'; alt text taken only from props |
| TEST-PS-110-09.T09 | abuse | PS-110-05.R03, PS-110-07.R03 | announcements containing recovery code or password; 10 assertive messages per minute | secrets never reach live regions; 4th assertive downgraded to polite |

## Dependencies

Module depends on: F14.S02.M01, F14.S02.M02, F09.S03.M01, F09.S03.M03, F06.S02.M01, F15.S01.M01, CTR-UX-001, CTR-MNY-001, CTR-IDM-001, CTR-PRV-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
