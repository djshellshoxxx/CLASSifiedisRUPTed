# PS-110-07 — Privacy, retention and abuse: Screen reader support

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M02 Screen reader support](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/a11y/screenreader` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-110-07.R01** Nothing is collected, and announcement text is held in memory only until cleared after 5 s.
- **PS-110-07.R02** Alt text is written by authors, carried in the owning record's MediaRef under that record's privacy class, limited to 140 characters of plain text and rendered by this module as text only.
- **PS-110-07.R03** Live regions never include secrets such as recovery codes or key material.
- **PS-110-07.R04** Remote parties cannot flood screen-reader users, because each region queues at most 3 messages, overflow collapses into one summary per coalesce key, stale polite messages are dropped after 10 s and assertive messages are capped per minute.

## Specification

**Data classification**
- Announcement text: transient, mirrors visible UI text.
- Alt text: owned by the referencing record (F01.S01.M01 MediaRef, F08.S01.M03 attachment); P0 inside a public listing projection, otherwise the record's class.

**Retention**
- None for announcements; alt text follows the owning record retention.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Announcement flood by remote content causing denial of service for screen reader users | rate limit 1 per 2 s per region, queue depth 3 per region with overflow coalescing into one '{count} updates' summary, polite messages older than 10 s dropped, de-duplication, polite default |
| T02 | Alt text used for spam or tracking links | plain text only, 140 characters, links not rendered, spam heuristics of the owning feature apply |
| T03 | Secrets spoken aloud in a shared space | secret fields use password type and are never announced; recovery code reveal requires an explicit action |
| T04 | Spoken text overclaims delivery or misstates an amount | spoken sync text comes from the same sync.state keys as the visual chip; spoken money comes from the same formatMoneyParts as the visual price; unknown currencies are never spoken as digits |

**Abuse controls**
- At most 3 assertive announcements per minute per page; further ones are downgraded to polite.
- Each region queues at most 3 messages; overflow is coalesced per caller-supplied coalesce key.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-110-09.T03 | unit | PS-110-02.R03, PS-110-07.R02 | icon-only button without name; Photo call site without alt prop; alt of 141 characters; decorative photo with empty alt; V04 violation under a valid component-target waiver | V03 and V04 raised; decorative accepted; waiver honoured from tests/a11y/waivers.yaml; no links rendered from alt text |
| TEST-PS-110-09.T04 | property | PS-110-03.R01, PS-110-03.R02, PS-110-03.R04, PS-110-06.R01, PS-110-07.R04 | random sequences of announce() calls (200 runs), plus 1 000 distinct polite messages with one coalesce key within 1 s, plus messages left queued for 11 s | at most one message per 2 s per region; assertive never interrupted by polite; duplicates dropped; queue never exceeds 3; at most 4 announcements for the 1 000 messages and the last is the '{count} updates' summary; stale messages dropped |
| TEST-PS-110-09.T09 | abuse | PS-110-05.R03, PS-110-07.R03 | announcements containing recovery code or password; 10 assertive messages per minute | secrets never reach live regions; 4th assertive downgraded to polite |
| TEST-PS-110-09.T15 | unit | PS-110-07.R01 | fake timers: announce 'Saved', advance 5 s, announce 'Saved' again | live-region text is empty 5 s after the first announcement and the repeated text is emitted again |

## Dependencies

Module depends on: F14.S02.M01, F14.S02.M02, F09.S03.M01, F09.S03.M03, F06.S02.M01, F15.S01.M01, CTR-UX-001, CTR-MNY-001, CTR-IDM-001, CTR-PRV-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
