# PS-110-05 — Authorization and capabilities: Screen reader support

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M02 Screen reader support](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/a11y/screenreader` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

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
| TEST-PS-110-09.T03 | unit | PS-110-02.R03, PS-110-05.R03, PS-110-07.R02 | icon-only button without name; photo without alt; alt of 141 characters; decorative photo | V03 and V04 raised; decorative accepted; no tracking links rendered |
| TEST-PS-110-09.T06 | unit | PS-110-01.R03, PS-110-06.R02, PS-110-05.R01 | spokenMoney golden values per locale including 123456789012 and -250 and approximate label | strings equal the reviewed goldens and include quote source and time when approximate |
| TEST-PS-110-09.T09 | abuse | PS-110-05.R02, PS-110-07.R01, PS-110-07.R03 | announcements containing recovery code or password; 10 assertive messages per minute | secrets never reach live regions; 4th assertive downgraded to polite |

## Dependencies

Module depends on: F14.S02.M01, F14.S02.M02, CTR-UX-001, CTR-MNY-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
