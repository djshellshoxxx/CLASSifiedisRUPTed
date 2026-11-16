# PS-097-09 — Contract and acceptance tests: Spam detection

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M02 Spam detection](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/spam` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-097-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-097-09.R02** Heuristics are covered by deterministic fixtures with expected scores.
- **PS-097-09.R03** Event payloads are validated against the schema registry.

## Specification

See the module test table below (all processes).

**Fixtures:** Corpus of 200 labelled texts (100 clean, 100 spam) in 6 scripts, fixed clock 2026-11-04T10:00:00Z, index snapshots with 0, 1 and 4 prior duplicates.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-097-09.T01 | unit | PS-097-01.R03, PS-097-02.R01, PS-097-02.R02 | oversized text; out-of-range thresholds | PAYLOAD_TOO_LARGE; VALIDATION_FAILED; operator cannot set all heuristics off |
| TEST-PS-097-09.T02 | unit | PS-097-01.R02, PS-097-03.R01 | duplicate window and simhash distance 3 and 4 | distance 3 flagged duplicate_near, distance 4 not |
| TEST-PS-097-09.T03 | property | PS-097-01.R01, PS-097-03.R02 | random texts evaluated twice with the same index snapshot | identical output; no exceptions; bounded runtime |
| TEST-PS-097-09.T04 | unit | PS-097-02.R03, PS-097-04.R02 | link density on zero-length and unspaced scripts; score 49 and 50 | no division by zero; event only at score ≥ 50 |
| TEST-PS-097-09.T05 | contract | PS-097-04.R01, PS-097-04.R02, PS-097-09.R02 | evaluate and event emission | port output and moderation.spam.detected validate against registry schemas |
| TEST-PS-097-09.T06 | integration | PS-097-04.R03 | listing.published, account.created and rate.exceeded events delivered twice | counters updated once; one event per (targetCid, rulesVersion) |
| TEST-PS-097-09.T07 | abuse | PS-097-05.R01, PS-097-05.R02, PS-097-05.R03 | HTTP request to evaluator; non-operator changes thresholds | no route exists; FORBIDDEN |
| TEST-PS-097-09.T08 | chaos | PS-097-06.R01, PS-097-06.R02, PS-097-06.R03, PS-097-03.R03 | index lost mid-run; signal store down | degraded true with exact-hash mode; recovery within 5 minutes; events delivered later |
| TEST-PS-097-09.T09 | abuse | PS-097-07.R01, PS-097-07.R03 | hostile regex-like text of 20000 code points | evaluation under 50 ms; no text in logs |
| TEST-PS-097-09.T10 | integration | PS-097-03.R02, PS-097-07.R02 | throttle recommended then 61 minutes pass | throttle expired; no persistent penalty from this module |
| TEST-PS-097-09.T11 | load | PS-097-08.R01, PS-097-08.R02, PS-097-08.R03 | 200 evaluations per second for 5 minutes at 20000 code points; rebuild 100 000 entries | p95 ≤ 20 ms relay, rebuild ≤ 5 minutes, metrics exported |
| TEST-PS-097-09.T12 | unit | PS-097-09.R01, PS-097-09.R03 | traceability tool run | every PS-097 requirement maps to a passing test |
| TEST-PS-097-09.T13 | integration | PS-097-10.R01, PS-097-10.R02, PS-097-10.R03 | export, import and backup restore | index absent from export and rebuilt after restore; configuration round-trips |

## Acceptance criteria

- All tests T01–T13 pass in CI.
- On the labelled corpus, recall ≥ 80% and false-positive rate ≤ 2% at score threshold 50.
- No heuristic result ever causes removal, suspension or ban without a human or published rule in F12.S02.M01.

## Dependencies

Module depends on: F12.S03.M02, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
