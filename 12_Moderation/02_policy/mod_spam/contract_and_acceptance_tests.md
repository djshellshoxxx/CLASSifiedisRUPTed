# PS-097-09 — Contract and acceptance tests: Spam detection

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M02 Spam detection](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/spam` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-097-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-097-09.R02** Heuristics are covered by deterministic fixtures with expected scores.
- **PS-097-09.R03** Event payloads are validated against the schema registry.

## Specification

See the module test table below (all processes).

**Fixtures:** Corpus of 200 labelled texts (100 clean, 100 spam) in 6 scripts, fixed clock 2026-11-04T10:00:00Z, index snapshots with 0, 1 and 4 prior duplicates, relay X and vault V with an injectable clock.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-097-09.T01 | unit | PS-097-02.R01, PS-097-02.R02 | oversized text; out-of-range thresholds; operator config that would disable every heuristic | PAYLOAD_TOO_LARGE without truncation; VALIDATION_FAILED; values clamped to minimums so heuristics stay active |
| TEST-PS-097-09.T02 | unit | PS-097-03.R01 | duplicate window and simhash distance 3 and 4 on fixed snapshots | distance 3 flagged duplicate_near, distance 4 not |
| TEST-PS-097-09.T03 | property | PS-097-01.R01, PS-097-01.R03, PS-097-02.R03, PS-097-03.R01, PS-097-06.R01 | random and hostile texts evaluated twice with the same index snapshot | identical output including rulesVersion and thresholds; no exceptions; score within 0..100; bounded runtime |
| TEST-PS-097-09.T04 | unit | PS-097-04.R02 | link density on zero-length and unspaced scripts; score 49 and 50 in relay_intake; score 90 in author_presign | no division by zero; event only at ≥ 50 in relay_intake; no event for author_presign |
| TEST-PS-097-09.T05 | contract | PS-097-04.R01, PS-097-09.R02, PS-097-09.R03 | evaluate output and moderation.spam.detected; corpus fixtures | validate against registry schemas; fixtures produce their expected scores |
| TEST-PS-097-09.T06 | integration | PS-097-04.R03, PS-097-06.R01 | relay index-intake hook with projection text; identity.session.started delivered twice; federation.record.accepted for a listing in a vault with fold on | evaluated before indexing; first observation recorded once; vault filter folds the listing; no identity.account.created consumer exists |
| TEST-PS-097-09.T07 | abuse | PS-097-05.R01, PS-097-05.R02, PS-097-05.R03 | HTTP request to moderation.spam.evaluate; author_presign for another key; non-operator changes thresholds; member reads another vault's folded items | no route; FORBIDDEN; FORBIDDEN; only own folded items |
| TEST-PS-097-09.T08 | chaos | PS-097-06.R02, PS-097-06.R03, PS-097-03.R03 | index lost mid-run; signal store down; crash between index write and event | degraded true with exact-hash mode; recovery within 5 minutes; index row and event both present or both absent; events delivered later |
| TEST-PS-097-09.T09 | abuse | PS-097-07.R01 | hostile regex-like text of 20000 code points | evaluation under 50 ms; no text in logs or index rows |
| TEST-PS-097-09.T10 | integration | PS-097-03.R02 | throttle recommended then 61 minutes pass | throttle expired; no persistent penalty from this module |
| TEST-PS-097-09.T11 | load | PS-097-08.R01, PS-097-08.R02, PS-097-08.R03 | 200 evaluations per second for 5 minutes at 20000 code points; rebuild 100 000 entries; degraded episode | p95 ≤ 20 ms relay, rebuild ≤ 5 minutes, degraded and index metrics exported |
| TEST-PS-097-09.T12 | unit | PS-097-09.R01 | traceability tool run | every PS-097 requirement maps to a passing test |
| TEST-PS-097-09.T13 | integration | PS-097-10.R01, PS-097-10.R02 | export, import and backup restore; import of out-of-range thresholds | index absent from export and rebuilt after restore; configuration round-trips; out-of-range values rejected |
| TEST-PS-097-09.T14 | integration | PS-097-10.R03 | rulesVersion spam/1.3 in shadow mode for 7 days next to spam/1.2 | both versions score every input; only spam/1.2 emits events; comparison metrics exported; rollback by configuration; spam/1.2 results stay readable |
| TEST-PS-097-09.T15 | abuse | PS-097-03.R04 | 20 fresh statements with createdAt −25 h received within 10 minutes; one replayed content id | velocity triggers on receipt time and backdated_claim is added; the replay is not counted twice |
| TEST-PS-097-09.T16 | contract | PS-097-04.R04 | spam.detected with throttle at score 85 delivered to F12.S03.M03, F12.S03.M02 and F12.S02.M01 contract fixtures | the posting key's write bucket gets penalty 0.25, a spam_detected signal is recorded for subjectKey and a case is opened for the same subjectKey |
| TEST-PS-097-09.T17 | contract | PS-097-04.R05 | F01.S01.M03 contract fixture evaluates a draft in author_presign mode before signing | output has score, heuristics, rulesVersion and degraded; no event and no index row written |
| TEST-PS-097-09.T18 | unit | PS-097-01.R02, PS-097-01.R04, PS-097-07.R02 | inspect index rows after evaluations on relays X and Y; injected clock 31 days later | only hashes and counters; key hashes differ between X and Y; entries expired |
| TEST-PS-097-09.T19 | abuse | PS-097-07.R03 | legitimate seller posts 12 variant listings in an hour | signal and at most a 1 hour throttle; no removal or suspension |

## Acceptance criteria

- All tests T01–T19 pass in CI.
- On the labelled corpus, recall ≥ 80% and false-positive rate ≤ 2% at score threshold 50.
- No heuristic result ever causes removal, suspension or ban without a human or published rule in F12.S02.M01.

## Dependencies

Module depends on: F12.S03.M03, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
