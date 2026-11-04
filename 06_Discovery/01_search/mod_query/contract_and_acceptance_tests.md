# PS-046-09 — Contract and acceptance tests: Search query

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S01.M02 Search query](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/search/query` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-046-09.R01** Every requirement is covered by at least one automated test, including a fuzz test of the query sanitizer.
- **PS-046-09.R02** Contract tests check command inputs, query outputs and the matched event against the schema registry.
- **PS-046-09.R03** Privacy tests prove saved searches never appear in statements, relay requests or logs.

## Specification

See the module test table below (all processes).

**Fixtures:** Vault with 200 indexed documents across three authors, one blocked author, a fake relay returning overlapping results, fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-046-09.T01 | unit | PS-046-01.R01, PS-046-02.R01 | create saved search with valid input | record stored with status active, revision 1, matchedDocIds empty |
| TEST-PS-046-09.T02 | property | PS-046-02.R01, PS-046-07.R03 | 10 000 random strings including FTS5 operators and unbalanced quotes | sanitized to quoted terms, never raises an FTS syntax error, never executes operators |
| TEST-PS-046-09.T03 | unit | PS-046-01.R02, PS-046-02.R02 | limits: 201-char query, 13 terms, 26th saved search, limit 51 | DISCOVERY_QUERY_INVALID, DISCOVERY_SAVED_SEARCH_LIMIT or VALIDATION_FAILED respectively |
| TEST-PS-046-09.T04 | unit | PS-046-02.R03, PS-046-03.R01 | cursor tampered, aged 16 minutes, or from another query | EXPIRED or VALIDATION_FAILED with no data returned |
| TEST-PS-046-09.T05 | property | PS-046-03.R01, PS-046-03.R02, PS-046-03.R03 | random sequences of update, pause, resume, delete | only declared transitions succeed; deleted has no further transitions |
| TEST-PS-046-09.T06 | contract | PS-046-04.R01, PS-046-04.R02, PS-046-09.R02 | each command, the query and the matched event run | outputs validate against registry schemas |
| TEST-PS-046-09.T07 | integration | PS-046-04.R03, PS-046-06.R03 | index event for a document matching two saved searches, delivered twice, and then edited | one matched event per search, no duplicate after edit |
| TEST-PS-046-09.T08 | integration | PS-046-05.R03 | relay returns a blocked author's listing | the item is filtered on the device before display |
| TEST-PS-046-09.T09 | abuse | PS-046-05.R01, PS-046-05.R02, PS-046-07.R03 | locked vault calls saved search commands; anonymous relay caller exceeds quota | FORBIDDEN or UNAUTHENTICATED for the vault; RATE_LIMITED with retryAfterMs for relay |
| TEST-PS-046-09.T10 | integration | PS-046-06.R01, PS-046-06.R02 | same Idempotency-Key replayed; relay times out after local results | original response replayed; local results shown with relay row DEPENDENCY_UNAVAILABLE |
| TEST-PS-046-09.T11 | abuse | PS-046-07.R01, PS-046-07.R02 | inspect outbox, relay requests and logs during saved search use | no saved search content present anywhere; relay request has only chosen query and cell |
| TEST-PS-046-09.T12 | integration | PS-046-01.R03, PS-046-04.R02, PS-046-06.R02 | local and relay return the same listing | merged into one card with both provenance labels |
| TEST-PS-046-09.T13 | load | PS-046-08.R01, PS-046-08.R02, PS-046-08.R03 | 50 req/s on relay with 100 000 documents; vault with 5 000 documents; 500 queued matches | relay p95 <= 200 ms, vault p95 <= 120 ms, evaluation <= 2 s |
| TEST-PS-046-09.T14 | a11y | PS-046-04.R02 | search screen and saved search list with axe-core | zero serious or critical violations and results count announced |
| TEST-PS-046-09.T15 | unit | PS-046-09.R01, PS-046-09.R03 | traceability tool run over PS-046 | every requirement maps to a passing test |
| TEST-PS-046-09.T16 | integration | PS-046-10.R01, PS-046-10.R02, PS-046-10.R03 | export then import saved searches into a fresh vault | records round-trip; matchedDocIds reset; conflicting ids rejected |

## Acceptance criteria

- All tests T01-T16 pass in CI.
- Query text never reaches FTS5 operator syntax (fuzz suite green).
- Saved searches never leave the device and blocked authors never appear in displayed results (privacy suite).

## Dependencies

Module depends on: F06.S01.M01, F06.S01.M03, F06.S02.M03, F06.S03.M01, F06.S03.M02, F07.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
