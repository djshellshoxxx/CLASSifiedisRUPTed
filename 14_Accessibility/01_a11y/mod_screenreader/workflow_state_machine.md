# PS-110-03 — Workflow state machine: Screen reader support

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M02 Screen reader support](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/a11y/screenreader` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-110-03.R01** The announcer keeps one bounded queue per region, holding at most 3 messages, with deterministic rules for priority, de-duplication, rate limiting and coalescing.
- **PS-110-03.R02** Polite messages never interrupt assertive messages and an assertive message replaces queued polite ones of the same region.
- **PS-110-03.R03** There is no persisted lifecycle, so no entity state machine is declared.
- **PS-110-03.R04** On overflow the queued polite messages of the region are replaced by one catalog summary tp(summaryKey, count) for the caller-supplied coalesceKey (default key a11y.announce.updates, '{count} updates'), later messages with that key increase the count, and queued polite messages older than 10 s are dropped unannounced.
- **PS-110-03.R05** The PageShell listens for the localechange event that F14.S02.M01 setLocale dispatches after re-rendering and announces 'Language changed to <language>' once, in the new language, through the polite status region, without moving focus.

## Specification

**Note:** Stateless UI services; the announcer queues (at most 3 messages per region) exist only in memory for the page lifetime.

### Timeouts and scheduled transitions

- Announcer clears each live region text 5 s after announcement so repeated identical messages are announced again.
- Queued polite messages older than 10 s are dropped without being announced.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-110-09.T02 | unit | PS-110-02.R02, PS-110-03.R01 | form fixtures without labels or error associations; submit with 3 errors | V02 raised; compliant form focuses the first invalid field and announces 3 errors |
| TEST-PS-110-09.T04 | property | PS-110-03.R01, PS-110-03.R02, PS-110-03.R04, PS-110-06.R01, PS-110-07.R04 | random sequences of announce() calls (200 runs), plus 1 000 distinct polite messages with one coalesce key within 1 s, plus messages left queued for 11 s | at most one message per 2 s per region; assertive never interrupted by polite; duplicates dropped; queue never exceeds 3; at most 4 announcements for the 1 000 messages and the last is the '{count} updates' summary; stale messages dropped |
| TEST-PS-110-09.T05 | contract | PS-110-04.R01, PS-110-04.R02, PS-110-04.R03, PS-110-01.R02, PS-110-01.R03, PS-110-03.R03, PS-110-05.R01, PS-110-05.R02, PS-110-10.R01 | inspect exports, storage and network calls; run spoken helpers on typed inputs and invalid ones | no vault, IndexedDB or network access; no stored data or persisted state; pure typed functions; Ok for valid input; Err(COMMERCE_MONEY_INVALID) for amount '01'; alt text taken only from props |
| TEST-PS-110-09.T17 | e2e | PS-110-03.R05 | switch language en to de on a page using the PageShell | exactly one polite announcement 'Sprache auf Deutsch geändert' after the localechange event; focus unchanged |

## Dependencies

Module depends on: F14.S02.M01, F14.S02.M02, F09.S03.M01, F09.S03.M03, F06.S02.M01, F15.S01.M01, CTR-UX-001, CTR-MNY-001, CTR-IDM-001, CTR-PRV-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
