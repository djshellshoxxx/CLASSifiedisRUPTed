# F09.S03.M01 — Currency registry

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F09.S03](../SPEC.md). **Process IDs:** PS-073-01…PS-073-10. **Code:** `packages/commerce/src/valuation/currency`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The registry of currencies a vault can use in Money values: the ISO 4217 table with its minor-unit exponents plus principal-registered crypto assets (BTC 8, ETH 18, USDC 6 by default) with explicit decimals and chain binding. Each vault has an allowed-currency list that every local price, offer, deal and quote must respect; relays publish their own accepted list as a hosting policy row. The registry lives in the vault (ADR-0016) and is seeded from the bundled signed snapshot. Decimals are immutable once registered because Money amounts are stored as minor units. Because every vault keeps its own registry, a statement that carries Money in a crypto currency or a code outside the bundled snapshot embeds an asset descriptor {code, kind, chainId, contract, decimals} with its digest, and a receiving vault accepts it only when the descriptor equals its own definition.

## Responsibilities

- Seed each new vault with the bundled ISO 4217 snapshot and the default crypto assets, with a local allowed-currency list.
- Own CurrencyDef records (code, kind, decimals, chain binding, enabled state) and answer lookups for every other module.
- Let the local principal register additional crypto assets, enable and disable currencies in the vault, and retire withdrawn codes; relay operators set the relay's accepted list through relay policy rows, not through this module's records.
- Guarantee that decimals never change after registration and that unknown currencies fail with COMMERCE_CURRENCY_UNKNOWN (MNY-2).
- Define the AssetDescriptor and its digest that statements embed for crypto and non-snapshot currencies, and provide the equality check every ingesting module runs (COMMERCE_CURRENCY_MISMATCH on any difference).
- Let the principal register an asset seen in a peer statement only from exactly that statement's descriptor, after an explicit checksum review.

## Not responsible for

- Money arithmetic, rounding and formatting (F09.S03.M03 precision).
- FX rates and quotes (F09.S03.M02 rates).
- Verifying on-chain payments (F09.S01.M03 crypto); this module only records which chain and contract an asset maps to.
- Relay-side enforcement of accepted currencies for indexed listings (relay hosting policy in F11 and F15).
- Quarantining the statements that fail the descriptor check; each ingesting module (F09.S01.M01, F09.S01.M03, F09.S03.M02) quarantines its own statements.
- Future: per-listing allowed-currency overrides are held by the listing modules; Future: automatic ISO table updates fetched from the network (MVP ships a signed snapshot with each release).

## User stories

- As a seller, I can only price my listing in currencies enabled in my vault, with the right number of decimals.
- As a user, I can enable a new stablecoin in my vault by registering its chain, contract and decimals, and I see its checksummed contract before using it.
- As a developer, I can look up the minor-unit exponent of any currency from one authoritative place.
- As a buyer receiving a USDC payment request, I am protected from a request whose token contract or decimals differ from the USDC my vault knows, because the statement is quarantined instead of being read with the wrong scale.

## Edge cases

- The principal tries to change decimals of USDC from 6 to 18 after deals exist; refused with COMMERCE_CURRENCY_IMMUTABLE.
- A currency is disabled while open offers use it; existing Money values stay valid and readable, but new use is refused with COMMERCE_CURRENCY_DISABLED.
- A code is registered twice with different decimals in two concurrent requests; the unique index lets exactly one succeed.
- ISO code withdrawn by the standard (for example a replaced currency) is retired only when no open deal references it.
- A signed statement from a peer uses a currency code missing from the local registry; the statement is quarantined with COMMERCE_CURRENCY_UNKNOWN and the user may register the asset after reviewing it.
- Crypto asset registered with a contract address on an unconfigured chain is refused with COMMERCE_CURRENCY_CHAIN_UNSUPPORTED.
- A vault holding an older snapshot prices a listing in a currency that a relay no longer accepts; that relay declines to index the listing under its own hosting policy, the vault's records stay intact, and the UI suggests another relay or currency.
- A peer statement carries USDC with an asset descriptor stating 18 decimals and another contract while the local registry has 6 decimals; the check returns COMMERCE_CURRENCY_MISMATCH, the ingesting module quarantines the statement, and nothing is read with the wrong scale.
- A peer statement carries an unknown token code with a descriptor; the registration sheet is pre-filled with exactly that code, chain, contract and decimals, shows the checksummed contract, and nothing is registered until the principal confirms the checksum review.

## UX and accessibility

- Currency settings list: table with code, name, decimals, kind, enabled switch, and a Register crypto asset form (code, name, decimals, chain, contract).
- Currency picker in price inputs: only enabled currencies, recently used first, shows decimals in the helper text.
- Register from statement sheet: descriptor fields pre-filled and read-only, contract in EIP-55 checksum groups, the line 'Check this contract with a source you trust before registering', and a confirmation checkbox.

**States:** loading; empty; enabled; disabled; retired; descriptor-mismatch; error

**Accessibility:** Enable switches are labelled with the currency code and name and announce state changes politely.; The picker is a listbox with type-ahead and visible focus; options are at least 44 px high.; The checksum review checkbox has a visible label and the contract groups are read out with their position.

## Owned data

- `CurrencyDef` (classrup.commerce.currency_def/v1, P0, RET-STANDARD)

## Interfaces

- Commands: `commerce.currency.register`, `commerce.currency.set_status`
- Queries: `commerce.currency.list`, `commerce.currency.get`, `commerce.currency.check_descriptor`
- Emits: `commerce.currency.registered`, `commerce.currency.status_changed`
- Consumes: none

## Dependencies

F09.S03.M03, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FLG-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-073-01 | [Domain schema](domain_schema.md) | 4 |
| PS-073-02 | [Validation rules](validation_rules.md) | 4 |
| PS-073-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-073-04 | [Commands, queries and events](commands_queries_events.md) | 4 |
| PS-073-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-073-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-073-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-073-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-073-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-073-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/commerce/src/valuation/currency/index.ts`.

## Acceptance criteria

- All tests T01–T16 pass in CI.
- Decimals of an existing currency can never change through any API or migration.
- A tenant seeded from the snapshot offers exactly the configured allowed list to price inputs.
- A Money value in a crypto or non-snapshot currency is never accepted from a peer statement whose asset descriptor differs from the local definition.
