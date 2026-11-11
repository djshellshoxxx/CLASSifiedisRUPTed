# PS-098-09 — Contract and acceptance tests: Account limits

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M04 Account limits](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/limits` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-098-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-098-09.R02** Tier tables and multiplier math are covered by deterministic and property tests.
- **PS-098-09.R03** Authorization and non-disclosure are covered by abuse tests.

## Specification

See the module test table below (all processes).

**Fixtures:** Relay X, keys A (first seen 2 days ago, 0 counted completions), B (40 days, 5), C (120 days, 12), D (second device key of A's principal), moderators M1 and M2 (M2 with a second key), completion statements signed by B and C, fixed clock 2026-11-04T10:00:00Z with an injectable clock.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-098-09.T01 | unit | PS-098-01.R01, PS-098-01.R04, PS-098-02.R01 | tier table for A, B, C on the three limit keys; override for limitKey open_offers | A new (5, 20, 20), B established (20, 60, 100), C trusted (100, 200, 500); open_offers refused with VALIDATION_FAILED |
| TEST-PS-098-09.T02 | property | PS-098-01.R03, PS-098-03.R02 | random tiers, multipliers, overrides and action restrictions | effective value follows the documented formula; 0 while a restriction is active; never below 1 otherwise unless base is 0 or the override sets 0 |
| TEST-PS-098-09.T03 | unit | PS-098-02.R01, PS-098-02.R03 | override with value 10001, short reason, expiry 91 days, M2 overriding its own second key | VALIDATION_FAILED, VALIDATION_FAILED, VALIDATION_FAILED, FORBIDDEN |
| TEST-PS-098-09.T04 | integration | PS-098-03.R01, PS-098-03.R03 | B submits completions until 3 are counted on day 8 then the daily sweep runs; an override expires | tier promoted once both conditions hold; limit.changed emitted for the promotion and on expiry |
| TEST-PS-098-09.T05 | integration | PS-098-03.R02, PS-098-04.R03 | risk.elevated medium, then high, then risk.lowered medium, then risk.lowered low | 0.75×, 0.5×, 0.75× and base, each immediately on its event; one limit.changed per distinct value |
| TEST-PS-098-09.T06 | contract | PS-098-04.R01, PS-098-04.R02, PS-098-09.R02 | commands, queries and event | validate against registry schemas; check output matches the example |
| TEST-PS-098-09.T07 | integration | PS-098-02.R02, PS-098-02.R04, PS-098-06.R02 | 6th index write in a day for tier new; check with an unknown limit key; check called with currentCount 0 for a key at its limit | MODERATION_ACCOUNT_LIMIT_REACHED with resetsAt; unknown key denied; VALIDATION_FAILED and no state change |
| TEST-PS-098-09.T08 | abuse | PS-098-05.R01, PS-098-05.R02, PS-098-05.R03 | member overrides own limit; member calls check over HTTP; moderator overrides a key linked to its own principal | FORBIDDEN, no route, FORBIDDEN |
| TEST-PS-098-09.T09 | integration | PS-098-06.R01, PS-098-06.R03 | same Idempotency-Key replayed on override and on submit_completion; rate store down for a flow limit | original responses replayed; fail mode of class applies |
| TEST-PS-098-09.T10 | abuse | PS-098-07.R03 | 31 overrides by one moderator in 24 h | 31st RATE_LIMITED; weekly report lists all |
| TEST-PS-098-09.T11 | integration | PS-098-07.R02 | relay applies a member's signed deletion request; injected clock +30 days | rows and counted completions deleted after 30 days; audit history kept 1 year |
| TEST-PS-098-09.T12 | load | PS-098-08.R01, PS-098-08.R02, PS-098-08.R03 | 2 000 checks per second for 5 minutes; sweep 100 000 keys | p95 ≤ 5 ms; sweep ≤ 60 s; denial and override metrics exported without keys |
| TEST-PS-098-09.T13 | unit | PS-098-09.R01, PS-098-09.R03 | traceability tool run | every PS-098 requirement maps to a passing test |
| TEST-PS-098-09.T14 | integration | PS-098-10.R01, PS-098-10.R02, PS-098-10.R03 | export own limits, relay backup and restore; v1 row with limitKey listings_per_day | limits recomputed after restore; firstSeen set to restore time when absent; listings_per_day read as index_writes_per_day |
| TEST-PS-098-09.T15 | e2e | PS-098-01.R02, PS-098-04.R01 | mobile member hits the daily index-write limit | limit sheet shows used, allowed, reset time and next tier; axe zero serious issues |
| TEST-PS-098-09.T16 | integration | PS-098-03.R04, PS-098-04.R04 | restrict_feature with restrictedCapabilities [federation.record.ingest, auctions.bid.place, bazaar.offer.receive] for 7 days, overturned after 2 days; another such action reaches expiry | index_writes and bids 0 while active, new recipients unchanged, bazaar.offer.receive ignored; restored with cause action_reverted; second restored with cause action_expired |
| TEST-PS-098-09.T17 | abuse | PS-098-04.R05, PS-098-07.R04 | submit_completion: valid B–C statement; same completionCid again; one signature invalid; submitter not a party; A with counterparty first seen 2 days ago; second B–C completion within 30 days; A–D completion | counted once; duplicate returns the stored result; FORBIDDEN twice; PRECONDITION_FAILED with counterparty_too_new, pair_counted_recently and same_principal; no amount ever stored |
| TEST-PS-098-09.T18 | integration | PS-098-07.R05 | ExportSectionPort run in a vault holding cached limit snapshots, then privacy.deletion.completed; relay DeletionPort plan | section moderation.limits exported; cached snapshots deleted; relay plan lists rows for deletion after 30 days |
| TEST-PS-098-09.T19 | integration | PS-098-04.R03 | identity.session.started relay_token for a new key delivered twice; a first verified signed request from another key without a session | firstSeenAt set once from the relay's own observation for each; no identity.account.created or commerce.deal.completed consumer exists |
| TEST-PS-098-09.T20 | abuse | PS-098-07.R01, PS-098-07.R04 | F12 privacy suite: inspect federation payloads, public projections, relay logs, events and member exports after limit changes and counted completions | no AccountLimit field appears in federation payloads, public projections or logs; no amounts, obligations or deal context appear; limit.changed carries no counterparty key |

## Acceptance criteria

- All tests T01–T20 pass in CI.
- No limit change is ever silent: each has a cause visible to the member on their limits screen.
- Effective values follow the published tier table, multipliers and restriction rule exactly, and no relay limit relies on a count the limited party supplied.

## Dependencies

Module depends on: F12.S03.M03, F07.S02.M01, F16.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
