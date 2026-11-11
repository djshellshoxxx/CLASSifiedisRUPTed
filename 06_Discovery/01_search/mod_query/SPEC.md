# F06.S01.M02 — Search query

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F06.S01](../SPEC.md). **Process IDs:** PS-046-01…PS-046-10. **Code:** `packages/discovery/src/search/query`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Parses bounded full-text queries, runs them against the local vault index and, when the user has selected a relay, against that relay's index, and returns cursor-paginated results with provenance. Saved searches live only in the user's vault and raise local alert events when newly indexed documents match; they are never uploaded to a relay. Blocked authors are filtered on the device because relays do not know the user's block list.

## Responsibilities

- Parse and sanitize user query text (at most 200 characters, 12 terms) into a safe FTS5 expression where every term is quoted, so user text never reaches FTS5 operator syntax.
- Serve discovery.search.query in two deployments - a vault-local query over the local index, and a relay query over the relay index (HTTP query endpoint, HMAC-signed cursors).
- Merge local and relay results client-side, de-duplicating by (authorDid, sourceId) and labelling provenance.
- Own SavedSearch records (vault-local, P3) and emit discovery.saved_search.matched when a newly indexed document satisfies one, with daily digest mode.

## Not responsible for

- Index maintenance (F06.S01.M01), filter compilation (F06.S01.M03), proximity guards (F06.S02.M03), scoring (F06.S03.M01) and diversity (F06.S03.M02).
- Delivering alerts to the user; notification channels are F13 and local notification only.
- Future: relay-side saved-search matching with private set intersection, saved-search sync between the user's devices through an encrypted mailbox.

## User stories

- As a buyer, I type words and quoted phrases and get relevant results, including from my local index while offline.
- As a buyer, I save a search for a bike under 300 EUR within 10 km and get a local alert when a new matching listing is indexed.
- As a buyer, I never see listings from authors I blocked, even if the relay returns them.
- As a buyer, I can tell which results came from this device and which from which relay.

## Edge cases

- Query text contains FTS5 operators such as NEAR, OR, a column filter or unbalanced quotes; each term is quoted so they are matched literally and never executed.
- The user pages past the 500-result depth limit or reuses a cursor older than 15 minutes; EXPIRED is returned and the UI offers to rerun.
- The relay is unreachable or slow; local results show immediately and the relay section reports DEPENDENCY_UNAVAILABLE after a 4 s timeout.
- Local and relay both return the same listing; one card is shown with both provenance labels.
- The 26th saved search is created; refused with DISCOVERY_SAVED_SEARCH_LIMIT.
- A document matches the same saved search twice because of an edit; only the first match raises an alert (dedupe by (savedSearchId, documentId)).
- The vault is locked when the index changes; matching resumes on next unlock and processes at most 500 queued documents per run.
- An empty query with filters only is allowed and sorted by newest.

## UX and accessibility

- Search screen: query box (max 200 chars with counter), filter chips (F06.S01.M03), sort selector (relevance, newest, price, distance bucket), result list with provenance badges and 'Promoted' labels.
- Saved searches list: name, filters summary, alert mode (off, instant, daily), pause, delete.

**States:** loading; empty; results; local-only; relay-error; expired-cursor; offline

**Accessibility:** The query input has a visible label and the result count is announced through an aria-live polite region.; Filter chips and the save-search button are at least 44 by 44 px and operable by keyboard.; Provenance and 'Promoted' are conveyed as text, not colour only.

## Owned data

- `SavedSearch` (classrup.discovery.saved_search/v1, P3, RET-STANDARD)

## Interfaces

- Commands: `discovery.saved_search.create`, `discovery.saved_search.update`, `discovery.saved_search.delete`
- Queries: `discovery.search.query`, `discovery.saved_search.list`
- Emits: `discovery.saved_search.matched`
- Consumes: `discovery.index.updated`, `identity.block.added`, `privacy.deletion.completed`

## Dependencies

F06.S01.M01, F06.S01.M03, F06.S02.M03, F06.S03.M01, F06.S03.M02, F07.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-OBS-001, CTR-FLG-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-046-01 | [Domain schema](domain_schema.md) | 3 |
| PS-046-02 | [Validation rules](validation_rules.md) | 3 |
| PS-046-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-046-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-046-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-046-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-046-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-046-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-046-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-046-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/discovery/src/search/query/index.ts`.

## Acceptance criteria

- All tests T01-T16 pass in CI.
- Query text never reaches FTS5 operator syntax (fuzz suite green).
- Saved searches never leave the device and blocked authors never appear in displayed results (privacy suite).
