# F06.S01.M03 — Search filters

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F06.S01](../SPEC.md). **Process IDs:** PS-044-01…PS-044-10. **Code:** `packages/discovery/src/search/filter`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Pure, isomorphic library that defines the typed search filter object (category, listing kind, price range per currency, condition, distance bucket, barter-acceptable, in-stock, condition accepted by a wanted listing, posted-within), validates it, and compiles it into a parameterized SQL fragment over the SearchDocument columns. The same code runs in the vault and on a relay, so filters mean the same thing everywhere. It owns no data and sends nothing.

## Responsibilities

- Define the Filter schema with exact ranges and limits and reject unknown keys.
- Compile a validated filter to a WHERE fragment with bound parameters only; no value is ever concatenated into SQL.
- Map distance filters to cell sets through F06.S02.M01 and never to numeric distances, compiling mixed precision correctly - precision-5 cells against geo_cell, precision-4 cells against the stored geo_cell4 column - so 50 and 100 km filters and L1 (4-character) documents match.
- Provide a canonical form (sorted keys, normalized values) used for cache keys and saved search equality.
- Filter on the barterAcceptable, inStock and want.minCondition values that F06.S01.M01 copies from the signed listing projection into the barter, in_stock and want_min_condition columns.

## Not responsible for

- Running queries, ranking and pagination (F06.S01.M02, F06.S03.M01).
- Owning the category taxonomy (F18 governance catalog) and currency registry (F09.S03.M01); the library receives them as read ports.
- Future: attribute filters per category (size, brand), multi-currency price range with FX conversion.

## User stories

- As a buyer, I filter to a category, a maximum price in EUR and items posted in the last 7 days.
- As a buyer, I filter to results within 10 km and see only distance buckets, never exact distances.
- As a developer, I use one filter definition for both the vault index and the relay index.

## Edge cases

- priceMin is greater than priceMax; the filter is rejected with DISCOVERY_FILTER_INVALID.
- A price filter has no currency; rejected with DISCOVERY_FILTER_CURRENCY_REQUIRED because amounts in different currencies are never compared.
- A distance filter is given without a search center; rejected with DISCOVERY_FILTER_CENTER_REQUIRED.
- A filter lists 11 categories or contains an unknown key; rejected, never silently truncated.
- Category has descendants in the taxonomy; the filter expands to at most 200 category ids and rejects larger expansions.
- A string value contains SQL metacharacters; it is only ever a bound parameter.
- A 50 or 100 km distance filter yields precision-4 cells; they compile to d.geo_cell4 IN (...) so L1 and L2 documents in those cells match instead of nothing.
- A listing published at L1 (4-character cell) is filtered with 10 km around an L2 center; it is not matched because its position is coarser than the radius, and it is matched from 25 km upward.
- distanceKm is 7 or 200; rejected with DISCOVERY_RADIUS_NOT_ALLOWED, while 3 is rejected with DISCOVERY_RADIUS_TOO_SMALL.
- wantAcceptsCondition good is combined with listingKinds sell; nothing matches, because only wanted listings carry want_min_condition, and the filter is still valid.
- inStock is given as the string "yes" or wantAcceptsCondition as "mint"; rejected with DISCOVERY_FILTER_INVALID.

## UX and accessibility



Library module with no screens. Filter chips in the search screen (F06.S01.M02) render the canonical filter and show the localized label for each active filter with a remove button.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

F06.S02.M01, CTR-ID-001, CTR-ERR-001, CTR-SCH-001, CTR-PRV-001, CTR-MNY-001, CTR-TST-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-044-01 | [Domain schema](domain_schema.md) | 5 |
| PS-044-02 | [Validation rules](validation_rules.md) | 3 |
| PS-044-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-044-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-044-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-044-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-044-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-044-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-044-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-044-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/discovery/src/search/filter/index.ts`.

## Acceptance criteria

- All tests T01-T14 pass in CI.
- Compiled queries return exactly the brute-force result on the 1 000 document fixture.
- No filter value can alter SQL structure (fuzz suite green).
