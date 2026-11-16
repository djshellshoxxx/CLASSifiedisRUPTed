# PS-110-03 — Workflow state machine: Screen reader support

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M02 Screen reader support](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/a11y/screenreader` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-110-03.R01** The announcer is a queue with deterministic rules for priority, de-duplication and rate limiting.
- **PS-110-03.R02** Polite messages never interrupt assertive messages and an assertive message replaces queued polite ones of the same region.
- **PS-110-03.R03** There is no persisted lifecycle, so no entity state machine is declared.

## Specification

**Note:** Stateless UI services; the announcer queue exists only in memory for the page lifetime.

### Timeouts and scheduled transitions

- Announcer clears each live region text 5 s after announcement so repeated identical messages are announced again.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-110-09.T02 | unit | PS-110-01.R02, PS-110-02.R02, PS-110-03.R01 | form fixtures without labels or error associations; submit with 3 errors | V02 raised; compliant form focuses the first invalid field and announces 3 errors |
| TEST-PS-110-09.T04 | property | PS-110-03.R01, PS-110-03.R02, PS-110-06.R01 | random sequences of announce() calls (200 runs) | at most one message per 2 s per region; assertive never interrupted by polite; duplicates dropped |
| TEST-PS-110-09.T08 | unit | PS-110-01.R03, PS-110-03.R03, PS-110-09.R02 | spokenSync for local committed, prepared, transport acknowledged, peer accepted | wording matches the state and never claims more |
| TEST-PS-110-09.T11 | e2e | PS-110-03.R02, PS-110-04.R01 | VoiceOver on iPhone 14 and TalkBack on Pixel 7 manual-assisted run of listing create and offer flows | landmarks navigable, values spoken in full, status announced without focus loss |

## Dependencies

Module depends on: F14.S02.M01, F14.S02.M02, CTR-UX-001, CTR-MNY-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
