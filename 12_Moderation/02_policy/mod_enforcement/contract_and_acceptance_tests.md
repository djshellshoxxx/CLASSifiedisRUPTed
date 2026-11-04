# PS-096-09 — Contract and acceptance tests: Enforcement actions

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M01 Enforcement actions](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/enforcement` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-096-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-096-09.R02** Contract tests check commands, statements and event payloads against the schema registry.
- **PS-096-09.R03** Race, conflict and no-silent-action cases are covered by deterministic tests.

## Specification

See the module test table below (all processes).

**Fixtures:** Relay X, moderators M1 and M2, operator O, author S with listing L, three reports, fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-096-09.T01 | unit | PS-096-01.R01, PS-096-01.R02, PS-096-02.R01 | apply remove_from_index with valid rule and facts | action stored with ruleRefs and statement CID; case resolved actioned |
| TEST-PS-096-09.T02 | unit | PS-096-02.R02, PS-096-02.R03 | each rule V01–V07 violated | documented error code, nothing stored, no effect on index |
| TEST-PS-096-09.T03 | property | PS-096-03.R01 | random sequences of assign, close, apply, revert, expiry | only declared transitions succeed; terminal states never change |
| TEST-PS-096-09.T04 | integration | PS-096-03.R02 | mailbox down on apply; imminent-harm rule | stays pending_notice up to 24 h; imminent-harm effect first and notice follows |
| TEST-PS-096-09.T05 | integration | PS-096-03.R03, PS-096-04.R03 | appeal overturn event and expiry | action reverted, reversal statement signed, original statement unchanged |
| TEST-PS-096-09.T06 | contract | PS-096-04.R01, PS-096-04.R02, PS-096-09.R02 | each command, statement and event | validate against registry schemas; statements verify with relay key |
| TEST-PS-096-09.T07 | integration | PS-096-04.R03, PS-096-06.R03 | report.filed delivered twice; spam.detected score 79 and 80 | one case; 79 adds signals only, 80 opens or extends a case |
| TEST-PS-096-09.T08 | abuse | PS-096-05.R01, PS-096-05.R03 | moderator suspends permanently; moderator decides case about self; non-moderator applies | MODERATION_ACTION_LIMIT, FORBIDDEN, FORBIDDEN |
| TEST-PS-096-09.T09 | abuse | PS-096-05.R02, PS-096-07.R03 | statement signed by wrong key; unsigned statement; schema with shadow kind | vault ignores first two; shadow kind rejected by validation |
| TEST-PS-096-09.T10 | integration | PS-096-06.R01, PS-096-06.R02 | same Idempotency-Key replayed; two moderators apply concurrently | original response replayed; one succeeds, other CONFLICT_REVISION |
| TEST-PS-096-09.T11 | chaos | PS-096-06.R02, PS-096-06.R03 | index port fails mid-apply | no action row, no event, DEPENDENCY_UNAVAILABLE |
| TEST-PS-096-09.T12 | integration | PS-096-01.R03, PS-096-07.R01, PS-096-07.R02 | subject deletes own account after action | pseudonymized case kept; legal hold prevents purge |
| TEST-PS-096-09.T13 | abuse | PS-096-07.R03 | moderator applies 51 actions in a day | 51st returns RATE_LIMITED; operator report lists all |
| TEST-PS-096-09.T14 | load | PS-096-08.R01, PS-096-08.R02, PS-096-08.R03 | 50 req/s mixed apply and list for 5 minutes; 10 000 expiring actions | p95 ≤ 300 ms, sweep ≤ 5 s, no keys in logs |
| TEST-PS-096-09.T15 | unit | PS-096-09.R01, PS-096-09.R03 | traceability tool run | every PS-096 requirement maps to a passing test |
| TEST-PS-096-09.T16 | integration | PS-096-10.R01, PS-096-10.R02, PS-096-10.R03 | export subject statements, relay backup and restore | statements verify; restored active actions still enforce |

## Acceptance criteria

- All tests T01–T16 pass in CI.
- No action exists without rule IDs, facts summary and a retrievable signed statement of reasons.
- No module produces any effect outside the issuing relay; statements say so.

## Dependencies

Module depends on: F12.S02.M03, F12.S01.M02, F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
