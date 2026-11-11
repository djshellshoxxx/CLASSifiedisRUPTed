# F09.S03.M01 — Currency registry

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F09.S03](../SPEC.md). **Process IDs:** PS-073-01…PS-073-10. **Code:** `packages/commerce/src/valuation/currency`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The registry of currencies a vault can use in Money values: the ISO 4217 table with its minor-unit exponents plus principal-registered crypto assets (BTC 8, ETH 18, USDC 6 by default) with explicit decimals and chain binding. Each vault has an allowed-currency list that every local price, offer, deal and quote must respect; relays publish their own accepted list as a hosting policy row. The registry lives in the vault (ADR-0016) and is seeded from the bundled signed snapshot. Decimals are immutable once registered because Money amounts are stored as minor units.

## Responsibilities

- Seed each new vault with the bundled ISO 4217 snapshot and the default crypto assets, with a local allowed-currency list.
- Own CurrencyDef records (code, kind, decimals, chain binding, enabled state) and answer lookups for every other module.
- Let the local principal register additional crypto assets, enable and disable currencies in the vault, and retire withdrawn codes; relay operators set the relay's accepted list through relay policy rows, not through this module's records.
- Guarantee that decimals never change after registration and that unknown currencies fail with COMMERCE_CURRENCY_UNKNOWN (MNY-2).

## Not responsible for

- Money arithmetic, rounding and formatting (F09.S03.M03 precision).
- FX rates and quotes (F09.S03.M02 rates).
- Verifying on-chain payments (F09.S01.M03 crypto); this module only records which chain and contract an asset maps to.
- Relay-side enforcement of accepted currencies for indexed listings (relay hosting policy in F11 and F15).
- Future: per-listing allowed-currency overrides are held by the listing modules; Future: automatic ISO table updates fetched from the network (MVP ships a signed snapshot with each release).

## User stories

- As a seller, I can only price my listing in currencies enabled in my vault, with the right number of decimals.
- As a user, I can enable a new stablecoin in my vault by registering its chain, contract and decimals, and I see its checksummed contract before using it.
- As a developer, I can look up the minor-unit exponent of any currency from one authoritative place.

## Edge cases

- The principal tries to change decimals of USDC from 6 to 18 after deals exist; refused with COMMERCE_CURRENCY_IMMUTABLE.
- A currency is disabled while open offers use it; existing Money values stay valid and readable, but new use is refused with COMMERCE_CURRENCY_DISABLED.
- A code is registered twice with different decimals in two concurrent requests; the unique index lets exactly one succeed.
- ISO code withdrawn by the standard (for example a replaced currency) is retired only when no open deal references it.
- A signed statement from a peer uses a currency code missing from the local registry; the statement is quarantined with COMMERCE_CURRENCY_UNKNOWN and the user may register the asset after reviewing it.
- Crypto asset registered with a contract address on an unconfigured chain is refused with COMMERCE_CURRENCY_CHAIN_UNSUPPORTED.
- A client holding an older snapshot sends a currency that the relay has just retired; the relay rejects it and the client refreshes its list.

## UX and accessibility

- Currency settings list: table with code, name, decimals, kind, enabled switch, and a Register crypto asset form (code, name, decimals, chain, contract).
- Currency picker in price inputs: only enabled currencies, recently used first, shows decimals in the helper text.

**States:** loading; empty; enabled; disabled; retired; error

**Accessibility:** Enable switches are labelled with the currency code and name and announce state changes politely.; The picker is a listbox with type-ahead and visible focus; options are at least 44 px high.

## Owned data

- `CurrencyDef` (classrup.commerce.currency_def/v1, P0, RET-STANDARD)

## Interfaces

- Commands: `commerce.currency.register`, `commerce.currency.set_status`
- Queries: `commerce.currency.list`, `commerce.currency.get`
- Emits: `commerce.currency.registered`, `commerce.currency.status_changed`
- Consumes: none

## Dependencies

F09.S03.M03, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FLG-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-073-01 | [Domain schema](domain_schema.md) | 3 |
| PS-073-02 | [Validation rules](validation_rules.md) | 3 |
| PS-073-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-073-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-073-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-073-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-073-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-073-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-073-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-073-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/commerce/src/valuation/currency/index.ts`.

## Acceptance criteria

- All tests T01–T13 pass in CI.
- Decimals of an existing currency can never change through any API or migration.
- A tenant seeded from the snapshot offers exactly the configured allowed list to price inputs.
