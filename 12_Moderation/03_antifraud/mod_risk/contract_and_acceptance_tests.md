# PS-100-09 — Contract and acceptance tests: Risk scoring

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M01 Risk scoring](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/risk` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-100-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-100-09.R02** Score math, hysteresis and explanation completeness are covered by property tests.
- **PS-100-09.R03** Friction-only semantics are covered by a schema test and abuse tests.

## Specification

See the module test table below (all processes).

**Fixtures:** Store with subject B and signals: 2 no_show (weight 10, 60-day half-life, 10 days old), 1 dispute_opened (weight 10, 60-day half-life, 10 days old), 3 deal_completed; subject C with 1 shill_suspected (weight 40, 90-day half-life, new); relay X with new_key enabled; fixed clock 2026-11-04T10:00:00Z with an injectable clock.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-100-09.T01 | unit | PS-100-01.R01, PS-100-01.R03, PS-100-02.R01, PS-100-02.R02 | key assessment of B; transaction assessment of B with amountBucket medium | key: no_show 17, dispute_opened 8, deal_credit −6, score 19, low; transaction: plus amount_bucket 5, score 24, low; model risk/1 recorded; frictions empty |
| TEST-PS-100-09.T02 | property | PS-100-01.R03, PS-100-03.R02 | random signal sets and times | factors sum to score before clamping; level function of score and hysteresis state; same digest same output |
| TEST-PS-100-09.T03 | unit | PS-100-02.R03 | invalid subject, unknown model, transaction without two keys, stale read, listing_publication for another key | documented error codes |
| TEST-PS-100-09.T04 | integration | PS-100-03.R01, PS-100-03.R03 | burst of 20 signal events within 5 seconds; signals of a high subject decaying past 60 with the clock advanced to nextCrossingAt | one recompute for the burst; assessment unique per digest; a recompute runs at nextCrossingAt without waiting for a daily sweep |
| TEST-PS-100-09.T05 | contract | PS-100-04.R01, PS-100-04.R02, PS-100-09.R02 | command, queries and both events | validate against registry schemas; no signed statement produced |
| TEST-PS-100-09.T06 | integration | PS-100-04.R03, PS-100-03.R02, PS-100-03.R04 | score crossing 70 up, 65, then below 60, then below 25 | elevated once on rise; no event at 65; lowered to medium below 60 and lowered to low below 25, each in the assessment transaction |
| TEST-PS-100-09.T07 | abuse | PS-100-05.R01, PS-100-05.R02, PS-100-05.R03 | counterparty reads own assessment from the other's vault; member reads another's relay assessment | NOT_FOUND; level never in federation payloads |
| TEST-PS-100-09.T08 | abuse | PS-100-07.R01, PS-100-07.R03 | schema with a ban-like friction value; 61 recomputes in an hour | schema rejects; 61st RATE_LIMITED |
| TEST-PS-100-09.T09 | integration | PS-100-06.R01, PS-100-06.R02, PS-100-06.R03 | same digest recompute twice; signal store failure; crash after assessment before event; out-of-order signal events | single row; previous assessment valid; event delivered once after recovery; same final level |
| TEST-PS-100-09.T10 | unit | PS-100-07.R02, PS-100-01.R02 | injected clock 31 days after computation; consumer payload | assessment purged; payload has level and kinds only |
| TEST-PS-100-09.T11 | load | PS-100-08.R01, PS-100-08.R02, PS-100-08.R03 | 200 recomputes per second for 5 minutes; scheduler run over 10 000 subjects | p95 ≤ 50 ms, run ≤ 60 s, level change metric exported without keys |
| TEST-PS-100-09.T12 | unit | PS-100-09.R01, PS-100-09.R03 | traceability tool run | every PS-100 requirement maps to a passing test |
| TEST-PS-100-09.T13 | integration | PS-100-10.R01, PS-100-10.R02 | export, import, backup restore; thresholds out of range on import | assessments excluded from export and recomputed after restore with identical results; out-of-range thresholds rejected |
| TEST-PS-100-09.T14 | e2e | PS-100-01.R02, PS-100-04.R01 | mobile user confirms a trade with a high-level counterparty | caution banner and extra confirmation shown, factor sentences readable, axe zero serious issues |
| TEST-PS-100-09.T15 | abuse | PS-100-07.R01, PS-100-01.R02 | F12 privacy suite after recomputes in a vault and on a relay: scan federation payloads, public projections, notifications and logs | no assessment field, score, level or factor appears in any of them |
| TEST-PS-100-09.T16 | integration | PS-100-10.R03 | model risk/2 in shadow for 7 days next to risk/1 | both computed; only risk/1 emits events and frictions; comparison metrics exported; rollback by configuration keeps risk/1 rows readable |
| TEST-PS-100-09.T17 | unit | PS-100-01.R04 | one fixture per points-table row: compensated kind, 12 deal_completed signals, manual_positive, new key at 2 h and 3 days on X and in a vault, amount buckets, 20 own publications in 24 h with spamScore 40 by a 2-day-old principal | each factor gets the documented points; credit floors at −20; no new_key in the vault; listing_publication 45 + 10 + 20 = 75 high |
| TEST-PS-100-09.T18 | contract | PS-100-03.R04 | moderation.risk.elevated high then moderation.risk.lowered low consumed by the F12.S03.M04 and F12.S02.M01 contract fixtures | limits move to 0.5× then back to base on the lowered event; a risk_review case is opened only on the rise |
| TEST-PS-100-09.T19 | contract | PS-100-04.R04 | F01.S01.M03 contract fixture calls moderation.risk.assess for listing_publication and for a transaction; the alias assess_transaction | outputs match the documented contract with level low |

## Acceptance criteria

- All tests T01–T19 pass in CI.
- Every high level shows its factors to the subject on a relay and to the vault owner locally, and triggers friction only.
- Identical inputs always yield identical level, score and factors, and frictions lift when a level drops.

## Dependencies

Module depends on: F12.S03.M02, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
