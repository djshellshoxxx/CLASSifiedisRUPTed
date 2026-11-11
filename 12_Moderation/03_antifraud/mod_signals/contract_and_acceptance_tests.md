# PS-101-09 — Contract and acceptance tests: Fraud signals

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M02 Fraud signals](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/signals` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-101-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-101-09.R02** Decay math and cap logic are covered by deterministic and property tests.
- **PS-101-09.R03** Consumer mapping is covered by contract tests per consumed event.

## Specification

See the module test table below (all processes).

**Fixtures:** Store with subject key B, fixed clock 2026-11-04T10:00:00Z, events from catalog modules, half-life 60 days example weight 10.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-101-09.T01 | unit | PS-101-01.R01, PS-101-02.R01, PS-101-02.R02 | record valid manual signals; invalid weight and kind | stored with expiry = observedAt + 5 half-lives; documented errors otherwise |
| TEST-PS-101-09.T02 | property | PS-101-01.R03, PS-101-03.R01, PS-101-03.R02 | random signal sets and times | decayed weight equals w × 0.5^(age/h); order of ingestion does not change totals |
| TEST-PS-101-09.T03 | unit | PS-101-02.R03 | compensation referencing a missing signal, another subject, or a compensation | NOT_FOUND |
| TEST-PS-101-09.T04 | integration | PS-101-04.R03, PS-101-06.R01 | each consumed event delivered twice | exactly one signal per source event with documented weight |
| TEST-PS-101-09.T05 | contract | PS-101-04.R01, PS-101-04.R02, PS-101-09.R02 | command, queries and event | validate against registry schemas |
| TEST-PS-101-09.T06 | abuse | PS-101-05.R01, PS-101-05.R02, PS-101-05.R03 | other member queries signals; relay moderator without case; subject reads own categories | NOT_FOUND, FORBIDDEN, categories only |
| TEST-PS-101-09.T07 | abuse | PS-101-07.R03, PS-101-02.R03 | 4th signal from the same source in 30 days; manual weight above cap | 4th ignored for scoring; SIGNALS_MANUAL_CAP |
| TEST-PS-101-09.T08 | integration | PS-101-01.R02, PS-101-03.R03, PS-101-07.R02 | daily sweep at expiry and subject deletion | rows purged, rollup counts kept; vault signals removed on deletion |
| TEST-PS-101-09.T09 | integration | PS-101-06.R02, PS-101-06.R03 | transaction aborted mid-ingest; outbox dispatcher down | no partial row; event delivered after recovery |
| TEST-PS-101-09.T10 | abuse | PS-101-07.R01, PS-101-07.R03 | UPDATE and DELETE on signal rows | aborted by trigger |
| TEST-PS-101-09.T11 | load | PS-101-08.R01, PS-101-08.R02, PS-101-08.R03 | 200 ingests per second for 5 minutes; summarize 5 000-signal subject; purge 100 000 rows | p95 targets met, purge ≤ 30 s |
| TEST-PS-101-09.T12 | unit | PS-101-09.R01, PS-101-09.R03 | traceability tool run | every PS-101 requirement maps to a passing test |
| TEST-PS-101-09.T13 | integration | PS-101-10.R01, PS-101-10.R02, PS-101-10.R03 | vault export, import into fresh vault, relay backup restore | signals round-trip with original observedAt; imported signals marked source import with weight cap |

## Acceptance criteria

- All tests T01–T13 pass in CI.
- No signal row is ever modified or deleted before expiry.
- Decayed totals match the closed-form formula within 1e-9 in property tests.

## Dependencies

Module depends on: F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
