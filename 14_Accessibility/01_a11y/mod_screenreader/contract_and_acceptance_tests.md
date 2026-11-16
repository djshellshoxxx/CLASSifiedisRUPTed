# PS-110-09 — Contract and acceptance tests: Screen reader support

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M02 Screen reader support](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/a11y/screenreader` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-110-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-110-09.R02** Structure rules are tested with positive and negative fixtures and with axe-core rules for landmarks, labels and names.
- **PS-110-09.R03** Spoken names are tested per shipped locale with golden strings reviewed by a native speaker.

## Specification

See the module test table below (all processes).

**Fixtures:** Fixture pages with correct and broken landmarks, forms and icon buttons; golden spoken strings for en, de, fr, es and the pseudolocales; Money values 0, 1, 4500, 123456789012 and -250 in EUR, USD, JPY, BTC.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-110-09.T01 | unit | PS-110-01.R01, PS-110-02.R01 | lint fixtures with 2 main landmarks, skipped heading, duplicate nav names | V01 raised; compliant page passes |
| TEST-PS-110-09.T02 | unit | PS-110-01.R02, PS-110-02.R02, PS-110-03.R01 | form fixtures without labels or error associations; submit with 3 errors | V02 raised; compliant form focuses the first invalid field and announces 3 errors |
| TEST-PS-110-09.T03 | unit | PS-110-02.R03, PS-110-05.R03, PS-110-07.R02 | icon-only button without name; photo without alt; alt of 141 characters; decorative photo | V03 and V04 raised; decorative accepted; no tracking links rendered |
| TEST-PS-110-09.T04 | property | PS-110-03.R01, PS-110-03.R02, PS-110-06.R01 | random sequences of announce() calls (200 runs) | at most one message per 2 s per region; assertive never interrupted by polite; duplicates dropped |
| TEST-PS-110-09.T05 | contract | PS-110-04.R01, PS-110-04.R02, PS-110-04.R03, PS-110-01.R03 | inspect exports and run spoken helpers on typed inputs | no vault or network access; pure typed functions; Result for invalid input |
| TEST-PS-110-09.T06 | unit | PS-110-01.R03, PS-110-06.R02, PS-110-05.R01 | spokenMoney golden values per locale including 123456789012 and -250 and approximate label | strings equal the reviewed goldens and include quote source and time when approximate |
| TEST-PS-110-09.T07 | unit | PS-110-06.R02, PS-110-06.R03 | missing locale pattern; unknown currency | English fallback with dev warning; digits plus spelled code; never empty |
| TEST-PS-110-09.T08 | unit | PS-110-01.R03, PS-110-03.R03, PS-110-09.R02 | spokenSync for local committed, prepared, transport acknowledged, peer accepted | wording matches the state and never claims more |
| TEST-PS-110-09.T09 | abuse | PS-110-05.R02, PS-110-07.R01, PS-110-07.R03 | announcements containing recovery code or password; 10 assertive messages per minute | secrets never reach live regions; 4th assertive downgraded to polite |
| TEST-PS-110-09.T10 | a11y | PS-110-01.R01, PS-110-02.R01, PS-110-06.R01 | axe via Playwright on every screen with screen reader rule set | zero serious or critical findings |
| TEST-PS-110-09.T11 | e2e | PS-110-03.R02, PS-110-04.R01 | VoiceOver on iPhone 14 and TalkBack on Pixel 7 manual-assisted run of listing create and offer flows | landmarks navigable, values spoken in full, status announced without focus loss |
| TEST-PS-110-09.T12 | load | PS-110-08.R01, PS-110-08.R02, PS-110-08.R03 | 100 000 helper calls and 1000 announce calls | p95 ≤ 0.2 ms, enqueue ≤ 1 ms, bundle ≤ 2 KiB gzip |
| TEST-PS-110-09.T13 | unit | PS-110-09.R01, PS-110-09.R03 | traceability tool run | every PS-110 requirement maps to a passing test |
| TEST-PS-110-09.T14 | unit | PS-110-10.R01, PS-110-10.R02, PS-110-10.R03 | update a golden string file; roll back | tests fail on unreviewed change; rollback restores previous strings without migration |

## Acceptance criteria

- All tests T01–T14 pass in CI.
- Every screen has valid landmarks, labelled controls and spoken names for money, distance and time (axe and lint).
- Manual VoiceOver and TalkBack runs of the core flows find no blocking issue.

## Dependencies

Module depends on: F14.S02.M01, F14.S02.M02, CTR-UX-001, CTR-MNY-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
