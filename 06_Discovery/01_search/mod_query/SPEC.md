# F06.S01.M02 — Search query

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F06.S01](../SPEC.md). **Process IDs:** PS-046-01…PS-046-10. **Code:** `packages/discovery/src/search/query`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Parses bounded full-text queries, runs them against the local vault index and, when the user has selected a relay, against that relay's index, and returns cursor-paginated results with provenance. Local and relay results are kept as separately ranked sections with their own cursors; every relay item is rendered only from its author-signed projection after the vault verifies the signature, because relays relay and vaults verify and decide (ADR-0016 decision 4). A relay request that carries a search center is checked and budgeted by the proximity rules of F06.S02.M03. Saved searches live only in the user's vault and raise local alert events when a document first seen after the search's watermark matches its compiled filter and text; they are never uploaded to a relay, and the vault's periodic pull of relay projections for saved-search areas sends only coarse L1 cells. Blocked authors and locally hidden content are filtered on the device at display time because relays do not know the user's block list.

## Responsibilities

- Parse and sanitize user query text (at most 200 characters, 12 terms) into a safe FTS5 expression where every term is quoted, so user text never reaches FTS5 operator syntax.
- Serve discovery.search.query in two deployments - a vault-local query over the local index, and a relay query over the relay index (HTTP query endpoint, HMAC-signed cursors) where any request with a center (near or filters.distanceKm) is checked and budgeted by F06.S02.M03.
- Show local and relay results as separately ranked sections with separate cursors, verify every relay item's signed projection (F11.S01.M03) before rendering, de-duplicate by (authorDid, sourceId) with the verified higher sourceRevision winning, and audit each relay page with F06.S03.M02 auditPage.
- Own SavedSearch records (vault-local, P3) and emit discovery.saved_search.matched when a document first seen after the search's watermark satisfies its compiled filter and text, with daily digest mode.
- Own the vault pull of relay projections for saved-search areas - the L1 cells of active saved-search areas and the home L1 cell, every 30 minutes while unlocked and online, through F06.S01.M01 list_by_cell, handing envelopes to F11.S01.M02 federation.record.receive.
- Register SavedSearch with the F10 privacy ports (export, deletion, retention purge) and classify its fields (N6).

## Not responsible for

- Index maintenance and the relay cell feed (F06.S01.M01), filter compilation (F06.S01.M03), proximity guards and the proximity budget (F06.S02.M03), scoring (F06.S03.M01) and diversity and page audits (F06.S03.M02).
- Verifying, deduplicating and storing pulled envelopes (F11.S01.M02).
- Delivering alerts to the user; notification channels are F13 and local notification only.
- Local hides and advisory feeds (F12.S01.M01) and block lists (F07.S02.M02); this module only applies them at display time.
- Future: relay-side saved-search matching with private set intersection, saved-search sync between the user's devices through an encrypted mailbox.

## User stories

- As a buyer, I type words and quoted phrases and get relevant results, including from my local index while offline.
- As a buyer, I save a search for a bike under 300 EUR within 10 km and get a local alert when a new matching listing is indexed.
- As a buyer, I never see listings from authors I blocked or content I hid, even if the relay returns them.
- As a buyer, I can tell which results came from this device and which from which relay, and a relay cannot show me a forged title or price under a real seller's identity.
- As a buyer, I know which coarse areas my vault asks relays about for my saved searches, and that my search words and filters are never sent for alerts.

## Edge cases

- Query text contains FTS5 operators such as NEAR, OR, a column filter or unbalanced quotes; each term is quoted so they are matched literally and never executed.
- The user pages past the 500-result depth limit; VALIDATION_FAILED is returned. A cursor older than 15 minutes returns EXPIRED and the UI offers to rerun.
- The relay is unreachable or slow; the local section shows immediately and the relay section reports DEPENDENCY_UNAVAILABLE after a 4 s timeout.
- Local and relay both return the same listing; one card is shown in the local section with both provenance labels, using the verified projection with the higher sourceRevision.
- A relay returns an item whose title and price differ from the author-signed projection, or no projection at all; the item is dropped and the relay section shows how many items failed verification.
- The 26th saved search is created; refused with DISCOVERY_SAVED_SEARCH_LIMIT.
- A document that already alerted is edited, or the index is rebuilt; no new alert fires because its firstSeenAt is not later than the watermark and op rebuilt is ignored.
- An index event matches a saved search's category and area but not its text or price; the confirmation run of the compiled filter and FTS MATCH rejects it and no alert fires.
- The vault is locked when the index changes; matching resumes on next unlock and processes at most 500 queued documents per run.
- An anonymous relay caller sends near with a 5-character center; refused with DISCOVERY_CENTER_TOO_PRECISE as discovery.proximity.search would.
- An empty query with filters only is allowed and sorted by newest.

## UX and accessibility

- Search screen: query box (max 200 chars with counter), filter chips (F06.S01.M03), sort selector (relevance, newest, price, distance bucket), a 'This device' section and one section per relay, each with its own 'Load more', provenance badges, 'Promoted on <relay>' labels and, when a relay page breaks the fairness rules, the note 'ranking policy not followed'.
- Saved searches list: name, filters summary, alert mode (off, instant, daily), pause, delete.
- Settings > Search data: relays used for pulls, the L1 areas pulled, pull interval and last pull time, with the statement that search words and filters are never sent for alerts.

**States:** loading; empty; results; local-only; relay-error; relay-unverified-items; expired-cursor; offline

**Accessibility:** The query input has a visible label and the result count is announced through an aria-live polite region.; Filter chips and the save-search button are at least 44 by 44 px and operable by keyboard.; Provenance, 'Promoted' and 'ranking policy not followed' are conveyed as text, not colour only.

## Owned data

- `SavedSearch` (classrup.discovery.saved_search/v1, P3, RET-STANDARD)

## Interfaces

- Commands: `discovery.saved_search.create`, `discovery.saved_search.update`, `discovery.saved_search.delete`
- Queries: `discovery.search.query`, `discovery.saved_search.list`, `discovery.saved_search.get_pull_scope`
- Emits: `discovery.saved_search.matched`
- Consumes: `discovery.index.updated`, `identity.block.added`, `privacy.deletion.completed`

## Dependencies

F06.S01.M01, F06.S01.M03, F06.S02.M01, F06.S02.M03, F06.S03.M01, F06.S03.M02, F07.S02.M02, F11.S01.M02, F11.S01.M03, F12.S01.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-OBS-001, CTR-FLG-001, CTR-FED-001, CTR-IOX-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-046-01 | [Domain schema](domain_schema.md) | 3 |
| PS-046-02 | [Validation rules](validation_rules.md) | 4 |
| PS-046-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-046-04 | [Commands, queries and events](commands_queries_events.md) | 5 |
| PS-046-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-046-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-046-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-046-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-046-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-046-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/discovery/src/search/query/index.ts`.

## Acceptance criteria

- All tests T01-T24 pass in CI.
- Query text never reaches FTS5 operator syntax (fuzz suite green).
- Saved searches never leave the device, blocked authors never appear in displayed results, and no unverified relay item is ever displayed (privacy and abuse suites).
