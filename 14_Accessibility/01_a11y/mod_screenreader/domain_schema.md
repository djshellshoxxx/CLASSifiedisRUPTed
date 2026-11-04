# PS-110-01 — Domain schema: Screen reader support

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M02 Screen reader support](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/a11y/screenreader` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-110-01.R01** The module owns no stored entity; its artifacts are page shell and form components, the announcer service and spoken-name helpers with typed inputs.
- **PS-110-01.R02** Spoken-name helpers take typed values (Money, DistanceBucket, Instant, SyncState) and a locale and return a plain string; they never take pre-formatted strings.
- **PS-110-01.R03** Alt text is stored by the owning feature module (for example listing photos in F01) with a 140 character limit and is passed in, not owned here.

## Specification

**Note:** UI library and tooling; it stores no data and owns no catalog entity.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-110-09.T01 | unit | PS-110-01.R01, PS-110-02.R01 | lint fixtures with 2 main landmarks, skipped heading, duplicate nav names | V01 raised; compliant page passes |
| TEST-PS-110-09.T02 | unit | PS-110-01.R02, PS-110-02.R02, PS-110-03.R01 | form fixtures without labels or error associations; submit with 3 errors | V02 raised; compliant form focuses the first invalid field and announces 3 errors |
| TEST-PS-110-09.T05 | contract | PS-110-04.R01, PS-110-04.R02, PS-110-04.R03, PS-110-01.R03 | inspect exports and run spoken helpers on typed inputs | no vault or network access; pure typed functions; Result for invalid input |
| TEST-PS-110-09.T06 | unit | PS-110-01.R03, PS-110-06.R02, PS-110-05.R01 | spokenMoney golden values per locale including 123456789012 and -250 and approximate label | strings equal the reviewed goldens and include quote source and time when approximate |
| TEST-PS-110-09.T08 | unit | PS-110-01.R03, PS-110-03.R03, PS-110-09.R02 | spokenSync for local committed, prepared, transport acknowledged, peer accepted | wording matches the state and never claims more |
| TEST-PS-110-09.T10 | a11y | PS-110-01.R01, PS-110-02.R01, PS-110-06.R01 | axe via Playwright on every screen with screen reader rule set | zero serious or critical findings |

## Dependencies

Module depends on: F14.S02.M01, F14.S02.M02, CTR-UX-001, CTR-MNY-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [module SPEC](SPEC.md).
