# PS-046-09 — Contract and acceptance tests: Search query

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S01.M02 Search query](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/search/query` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-046-09.R01** Every requirement is covered by at least one automated test, including a fuzz test of the query sanitizer.
- **PS-046-09.R02** Contract tests check command inputs, query outputs and the matched event against the schema registry.
- **PS-046-09.R03** Privacy tests prove saved searches never appear in statements, relay requests or logs.

## Specification

See the module test table below (all processes).

**Fixtures:** Vault with 200 indexed documents across three authors, one blocked author, one locally hidden listing, a fake relay returning overlapping results (one forged item, one with a higher verified revision), signed projections for all relay items, fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-046-09.T01 | unit | PS-046-01.R01, PS-046-02.R01 | create saved search with valid input | record stored with status active, revision 1, matchedDocIds empty, watermarkAt equal to createdAt |
| TEST-PS-046-09.T02 | property | PS-046-02.R01, PS-046-07.R03 | 10 000 random strings including FTS5 operators and unbalanced quotes | sanitized to quoted terms, never raises an FTS syntax error, never executes operators |
| TEST-PS-046-09.T03 | unit | PS-046-01.R02, PS-046-02.R02 | limits: 201-char query, 13 terms, 26th saved search, limit 51, page depth 501 | DISCOVERY_QUERY_INVALID, DISCOVERY_QUERY_INVALID, DISCOVERY_SAVED_SEARCH_LIMIT, VALIDATION_FAILED, VALIDATION_FAILED |
| TEST-PS-046-09.T04 | unit | PS-046-02.R03 | cursor tampered, aged 16 minutes, or from another query | EXPIRED each time with no data returned |
| TEST-PS-046-09.T05 | property | PS-046-03.R01, PS-046-03.R02, PS-046-03.R03 | random sequences of update, pause, resume, delete | only declared transitions succeed; deleted has no further transitions; resume sets watermarkAt |
| TEST-PS-046-09.T06 | contract | PS-046-04.R01, PS-046-04.R02, PS-046-09.R02 | each command, the query with source local, relay and both, and the matched event run | outputs validate against registry schemas, including sections and nextCursor { local, relay } |
| TEST-PS-046-09.T07 | integration | PS-046-04.R03, PS-046-06.R03 | index event for a document matching two saved searches delivered twice, then the document edited, then op rebuilt, and a document first seen before the watermark | one matched event per search; no alert after edit or rebuild; none for the pre-watermark document even after its id was trimmed from matchedDocIds |
| TEST-PS-046-09.T08 | integration | PS-046-05.R03 | relay returns a blocked author's listing and a locally hidden listing | both filtered on the device with filterBlocked and the local hide port before display; relay request carries no block or hide data |
| TEST-PS-046-09.T09 | abuse | PS-046-05.R01, PS-046-05.R02, PS-046-07.R03 | locked vault calls saved search commands; anonymous relay caller exceeds the read.search quota | UNAUTHENTICATED for the locked vault; RATE_LIMITED with retryAfterMs for the relay |
| TEST-PS-046-09.T10 | integration | PS-046-06.R01, PS-046-06.R02 | same Idempotency-Key replayed; relay times out after local results | original response replayed; local section shown with relay section DEPENDENCY_UNAVAILABLE |
| TEST-PS-046-09.T11 | abuse | PS-046-07.R01, PS-046-07.R02 | inspect outbox, relay requests and relay logs during saved search use and queries | no saved search content present anywhere; relay request has only the chosen query and cell; relay logs contain no query text |
| TEST-PS-046-09.T12 | integration | PS-046-04.R04, PS-046-06.R02 | local and relay return the same listing, the relay copy with a higher verified sourceRevision | one card in the local section with both provenance labels and the newer verified content; the relay projection passed to federation.record.receive |
| TEST-PS-046-09.T13 | load | PS-046-08.R01, PS-046-08.R02, PS-046-08.R03 | 50 req/s on relay with 100 000 documents; vault with 5 000 documents; 500 queued matches | relay p95 <= 200 ms, vault p95 <= 120 ms, evaluation <= 2 s |
| TEST-PS-046-09.T14 | a11y | PS-046-07.R02 | search screen with relay sections and disclosure notice, and saved search list, with axe-core | zero serious or critical violations, results count announced, relay disclosure and local-only option present as text |
| TEST-PS-046-09.T15 | unit | PS-046-09.R01, PS-046-09.R03 | traceability tool run over PS-046 | every requirement maps to a passing test |
| TEST-PS-046-09.T16 | integration | PS-046-10.R01, PS-046-10.R02, PS-046-10.R03 | export then import saved searches into a fresh vault | records round-trip; imported searches paused with matchedDocIds reset and watermarkAt at import; conflicting ids rejected |
| TEST-PS-046-09.T17 | integration | PS-046-03.R01 | paused saved search receives a matching index event, then is resumed | no alert while paused; after resume, documents first seen before the resume do not alert, a newly seen one does |
| TEST-PS-046-09.T18 | integration | PS-046-01.R03 | run a query, then advance the clock 15 minutes and run the sweep | snapshot store is empty and the old cursor returns EXPIRED |
| TEST-PS-046-09.T19 | abuse | PS-046-04.R04, PS-046-07.R01 | relay returns an item with a forged title and price for a real authorDid, and an item without a projection | neither item is displayed; relay section droppedUnverified 2; DISCOVERY_RELAY_ITEM_UNVERIFIED recorded locally |
| TEST-PS-046-09.T20 | abuse | PS-046-02.R04 | anonymous relay caller sends near with a 5-character center; token caller uses search.query near with a third new center within an hour after two discovery.proximity.search centers | DISCOVERY_CENTER_TOO_PRECISE; third center RATE_LIMITED with reason center_changes from the shared budget |
| TEST-PS-046-09.T21 | contract | PS-046-04.R04 | source both with a relay page holding 5 items of one author and 6 promoted of 20 | two sections with separate cursors; local section reranked with promotionEnabled false; relay section labelled ranking policy not followed and promoted items labelled 'Promoted on <relay>' |
| TEST-PS-046-09.T22 | abuse | PS-046-04.R05, PS-046-07.R01 | capture the pull requests for 3 active saved searches with text and price filters | each request has only cells4 (L1) and a cursor, every 30 minutes, no query text, filters or saved-search ids; Settings > Search data lists the same cells |
| TEST-PS-046-09.T23 | integration | PS-046-07.R04 | export, deletion request then cancel, deletion execution, retention purge run | export has section discovery.saved_searches; saved searches survive the cancelled request and are removed only at execution by the DeletionPort plan; fields classified P3 |
| TEST-PS-046-09.T24 | integration | PS-046-04.R03 | saved search 'road bike' under 300 EUR; index event for a document in the right category and area but titled 'sofa' or priced 500 EUR | no alert because the compiled filter and FTS MATCH confirmation reject it |

## Acceptance criteria

- All tests T01-T24 pass in CI.
- Query text never reaches FTS5 operator syntax (fuzz suite green).
- Saved searches never leave the device, blocked authors never appear in displayed results, and no unverified relay item is ever displayed (privacy and abuse suites).

## Dependencies

Module depends on: F06.S01.M01, F06.S01.M03, F06.S02.M01, F06.S02.M03, F06.S03.M01, F06.S03.M02, F07.S02.M02, F11.S01.M02, F11.S01.M03, F12.S01.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-OBS-001, CTR-FLG-001, CTR-FED-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
