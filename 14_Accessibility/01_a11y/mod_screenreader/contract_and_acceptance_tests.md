# PS-110-09 — Contract and acceptance tests: Screen reader support

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M02 Screen reader support](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/a11y/screenreader` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-110-09.R01** Every requirement of this module is covered by at least one automated test, except 09.R04, which is the manual assistive-technology requirement itself and is covered by the recorded manual test.
- **PS-110-09.R02** Structure rules are tested with positive and negative fixtures and with axe-core rules for landmarks, labels and names.
- **PS-110-09.R03** Spoken names are tested per shipped locale with golden strings reviewed by a native speaker.
- **PS-110-09.R04** Manual VoiceOver (iPhone 14) and TalkBack (Pixel 7) runs of the core flows are recorded per release in the F14.S01.M03 release checklist (V05) with device, date and owner.

## Specification

See the module test table below (all processes).

**Fixtures:** Fixture pages with correct and broken landmarks, forms, icon buttons and Photo call sites; golden spoken strings for en, de, fr, es and the pseudolocales with a reviewer sign-off record (reviewer, locale, date) per golden file; Money values 0, 1, 4500, 123456789012 and -250 in EUR, USD and JPY, 12345 and 100000000 in BTC, 1000000000000000000 in ETH, and an unregistered code XYZ; QuoteLabel fixtures fresh, expired, manual, unverified and pinned; every SyncState value; every DistanceBucket value.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-110-09.T01 | unit | PS-110-01.R01, PS-110-02.R01, PS-110-09.R02 | lint fixtures with 2 main landmarks, skipped heading, duplicate nav names | V01 raised; compliant page passes |
| TEST-PS-110-09.T02 | unit | PS-110-02.R02, PS-110-03.R01 | form fixtures without labels or error associations; submit with 3 errors | V02 raised; compliant form focuses the first invalid field and announces 3 errors |
| TEST-PS-110-09.T03 | unit | PS-110-02.R03, PS-110-07.R02 | icon-only button without name; Photo call site without alt prop; alt of 141 characters; decorative photo with empty alt; V04 violation under a valid component-target waiver | V03 and V04 raised; decorative accepted; waiver honoured from tests/a11y/waivers.yaml; no links rendered from alt text |
| TEST-PS-110-09.T04 | property | PS-110-03.R01, PS-110-03.R02, PS-110-03.R04, PS-110-06.R01, PS-110-07.R04 | random sequences of announce() calls (200 runs), plus 1 000 distinct polite messages with one coalesce key within 1 s, plus messages left queued for 11 s | at most one message per 2 s per region; assertive never interrupted by polite; duplicates dropped; queue never exceeds 3; at most 4 announcements for the 1 000 messages and the last is the '{count} updates' summary; stale messages dropped |
| TEST-PS-110-09.T05 | contract | PS-110-04.R01, PS-110-04.R02, PS-110-04.R03, PS-110-01.R02, PS-110-01.R03, PS-110-03.R03, PS-110-05.R01, PS-110-05.R02, PS-110-10.R01 | inspect exports, storage and network calls; run spoken helpers on typed inputs and invalid ones | no vault, IndexedDB or network access; no stored data or persisted state; pure typed functions; Ok for valid input; Err(COMMERCE_MONEY_INVALID) for amount '01'; alt text taken only from props |
| TEST-PS-110-09.T06 | unit | PS-110-09.R03 | spokenMoney goldens per locale including 123456789012, -250, BTC 12345, ETH 10^18, fresh, manual, unverified, pinned and expired approximate labels; spokenDistance for every bucket | strings equal the goldens; each golden file has a reviewer sign-off record; approximate wording and 'expired quote' match the F14.S02.M02 visual label for the same input |
| TEST-PS-110-09.T07 | unit | PS-110-06.R02, PS-110-06.R03 | missing locale pattern; unregistered code XYZ with spec null; BTC and ETH amounts with their CurrencyDef | English fallback with dev warning; Err(COMMERCE_CURRENCY_UNKNOWN) rendered as 'amount unavailable, unknown currency XYZ'; BTC and ETH spoken with 8 and 18 decimals; never empty and never raw minor-unit digits |
| TEST-PS-110-09.T08 | unit | PS-110-01.R04 | spokenSync for all ten values local_committed, prepared, sending, transport_acknowledged (relay and direct), peer_accepted, completed, conflict, failed, expired, discarded | each uses its sync.state key, the same text as the F15.S01.M01 chip, names the transport and never claims more than the state |
| TEST-PS-110-09.T09 | abuse | PS-110-05.R03, PS-110-07.R03 | announcements containing recovery code or password; 10 assertive messages per minute | secrets never reach live regions; 4th assertive downgraded to polite |
| TEST-PS-110-09.T10 | a11y | PS-110-01.R01, PS-110-02.R01, PS-110-09.R02 | axe via Playwright on every screen with screen reader rule set | zero serious or critical findings |
| TEST-PS-110-09.T11 | manual | PS-110-09.R04 | VoiceOver on iPhone 14 and TalkBack on Pixel 7 run of listing create and offer flows | landmarks navigable, values spoken in full, status announced without focus loss; recorded with device, date and owner in the F14.S01.M03 release checklist |
| TEST-PS-110-09.T12 | load | PS-110-08.R01, PS-110-08.R02, PS-110-08.R03 | 100 000 helper calls and 1000 announce calls | p95 ≤ 0.2 ms, enqueue ≤ 1 ms, bundle ≤ 2 KiB gzip |
| TEST-PS-110-09.T13 | unit | PS-110-09.R01 | traceability tool run | every PS-110 requirement maps to a passing test, and 09.R04 to a recorded manual test |
| TEST-PS-110-09.T14 | unit | PS-110-10.R02, PS-110-10.R03 | update a golden string file; roll back | tests fail on unreviewed change; rollback restores previous strings without migration |
| TEST-PS-110-09.T15 | unit | PS-110-07.R01 | fake timers: announce 'Saved', advance 5 s, announce 'Saved' again | live-region text is empty 5 s after the first announcement and the repeated text is emitted again |
| TEST-PS-110-09.T16 | e2e | PS-110-02.R04 | render a received listing with 5 photos, photo 2 without alt and not decorative, and the user's own listing with the same media | received listing announces 'Photo 2 of 5, no description' with no prompt; own listing shows the add-description prompt; publish refusal is asserted in the F01.S01.M03 suite |
| TEST-PS-110-09.T17 | e2e | PS-110-03.R05 | switch language en to de on a page using the PageShell | exactly one polite announcement 'Sprache auf Deutsch geändert' after the localechange event; focus unchanged |

## Acceptance criteria

- All automated tests pass in CI; manual test T11 is recorded as passed in the release checklist (F14.S01.M03 V05).
- Every screen has valid landmarks, labelled controls and spoken names for money, distance, time and sync state (axe and lint).
- Manual VoiceOver and TalkBack runs of the core flows find no blocking issue.

## Dependencies

Module depends on: F14.S02.M01, F14.S02.M02, F09.S03.M01, F09.S03.M03, F06.S02.M01, F15.S01.M01, CTR-UX-001, CTR-MNY-001, CTR-IDM-001, CTR-PRV-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
