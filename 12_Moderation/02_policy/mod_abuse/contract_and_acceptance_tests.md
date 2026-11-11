# PS-095-09 — Contract and acceptance tests: Abuse policy

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M03 Abuse policy](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/abuse` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-095-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-095-09.R02** Contract tests check commands, statements and events against the schema registry.
- **PS-095-09.R03** Version immutability is covered by property tests.

## Specification

See the module test table below (all processes).

**Fixtures:** Relay X with operator O, seed rules POL-FRAUD-001 v1 and POL-SPAM-001 v1 in force, fresh relay Z without policy, fixed clock 2026-11-04T10:00:00Z with an injectable clock.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-095-09.T01 | unit | PS-095-01.R01, PS-095-01.R03, PS-095-02.R01 | draft and publish a valid rule; draft with an unknown field | version row stored with changeType, version = previous + 1, ID matches pattern; VALIDATION_FAILED |
| TEST-PS-095-09.T02 | unit | PS-095-02.R02, PS-095-02.R03 | each rule V02–V10 violated | documented error code and nothing stored |
| TEST-PS-095-09.T03 | property | PS-095-01.R02, PS-095-01.R04, PS-095-03.R01 | random sequences of draft, publish, retire, edit and clock advances | published versions never change; at most one version of each ruleId in force at any instant; only declared transitions succeed |
| TEST-PS-095-09.T04 | integration | PS-095-03.R02, PS-095-03.R03 | action cites v1, v2 published and in force, rule retired | action still resolves v1 text; v1 superseded; retired rule not citable for new actions |
| TEST-PS-095-09.T05 | contract | PS-095-04.R01, PS-095-04.R02, PS-095-09.R02 | each command and query | outputs, statement and event validate against registry schemas; signature verifies with the F16.S02.M02 key |
| TEST-PS-095-09.T06 | integration | PS-095-04.R03 | policy_proposal.decided and prohibited_rule.changed delivered twice | one draft created; dependent rules flagged; nothing auto-published |
| TEST-PS-095-09.T07 | abuse | PS-095-05.R01, PS-095-05.R02, PS-095-05.R03 | moderator publishes; forged statement signature; draft read by member; HTTP call to check_citable | FORBIDDEN; vault rejects; NOT_FOUND; no route |
| TEST-PS-095-09.T08 | integration | PS-095-06.R01, PS-095-06.R02, PS-095-06.R03 | same Idempotency-Key replayed; concurrent publish; signing key unavailable | same statementCid; one wins; draft stays draft |
| TEST-PS-095-09.T09 | abuse | PS-095-07.R01, PS-095-07.R03 | attempt to modify a published row directly; 21 publishes in 24 h | rejected by schema trigger; 21st RATE_LIMITED |
| TEST-PS-095-09.T10 | integration | PS-095-07.R02 | purge sweep while an action cites a version; discarded draft with the clock advanced 31 days | cited version retained; draft deleted |
| TEST-PS-095-09.T11 | load | PS-095-08.R01, PS-095-08.R02, PS-095-08.R03 | 200 req/s public reads for 5 minutes | p95 ≤ 150 ms; index refresh ≤ 1 s after effective time |
| TEST-PS-095-09.T12 | unit | PS-095-09.R01, PS-095-09.R03 | traceability tool run | every PS-095 requirement maps to a passing test |
| TEST-PS-095-09.T13 | integration | PS-095-10.R01, PS-095-10.R02, PS-095-10.R03 | export policy, import into fresh relay, restore backup | all versions and statements verify; ruleIds unchanged; imports become drafts |
| TEST-PS-095-09.T14 | e2e | PS-095-01.R02, PS-095-04.R01 | mobile visitor reads policy offline after first visit | cached policy shown with fetch date; axe zero serious issues |
| TEST-PS-095-09.T15 | integration | PS-095-02.R04, PS-095-02.R02 | fresh relay Z adopts the seed set as initial with effectiveAt = publication; relay X publishes a restrictive v2 with 3 days notice, a non_restrictive text fix with immediate effect, a new rule version 1 labelled non_restrictive, and an initial version | Z's rules in force at once; NOTICE_TOO_SHORT; text fix in force at once; VALIDATION_FAILED; VALIDATION_FAILED |
| TEST-PS-095-09.T16 | integration | PS-095-03.R04, PS-095-04.R04 | v2 scheduled for next week; check_citable for v2 now and after effectiveAt, and for v1 after v2 takes effect | scheduled and not citable; in_force and citable; v1 superseded and not citable for later decisions while still readable |

## Acceptance criteria

- All tests T01–T16 pass in CI.
- Published rule versions are immutable and every action's citation resolves to the exact text in force at decision time.
- Seed set of 12 rule families is available for adoption in a fresh relay, and restrictive changes always give 14 days' notice.

## Dependencies

Module depends on: F18.S01.M02, F16.S02.M02, F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
