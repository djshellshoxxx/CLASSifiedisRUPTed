# PS-073-09 — Contract and acceptance tests: Currency registry

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S03.M01 Currency registry](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/valuation/currency` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-073-09.R01** Every requirement is covered by at least one automated test.
- **PS-073-09.R02** Contract tests validate command outputs and event payloads against the registry schemas.
- **PS-073-09.R03** Immutability is covered by property and migration tests.

## Specification

See the module test table below (all processes).

**Fixtures:** Vault seeded from ISO snapshot 2026-01-01 with BTC, ETH, USDC; local principal P; peer statement fixtures with a matching USDC descriptor, an 18-decimal USDC descriptor, a look-alike contract and an unknown token; two vaults A and B; two tabs.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-073-09.T01 | unit | PS-073-01.R01, PS-073-01.R02, PS-073-02.R01 | register a crypto asset with valid data | row stored with revision 1, decimals and chain binding intact |
| TEST-PS-073-09.T02 | unit | PS-073-02.R01, PS-073-02.R02 | lookup of XXX9 and of a withdrawn code | COMMERCE_CURRENCY_UNKNOWN with code in params |
| TEST-PS-073-09.T03 | unit | PS-073-01.R03, PS-073-02.R03, PS-073-09.R03 | update attempt on decimals and chain binding | COMMERCE_CURRENCY_IMMUTABLE and nothing stored |
| TEST-PS-073-09.T04 | property | PS-073-03.R01, PS-073-03.R02 | random status transitions | only active, disabled, retired transitions succeed; retired is final; existing Money stays readable |
| TEST-PS-073-09.T05 | integration | PS-073-03.R03, PS-073-02.R03 | retire a currency referenced by an open offer | PRECONDITION_FAILED until references are closed |
| TEST-PS-073-09.T06 | contract | PS-073-04.R01, PS-073-04.R02, PS-073-09.R02 | execute each command and query | outputs and events validate against the registry |
| TEST-PS-073-09.T07 | integration | PS-073-06.R01 | vault seeding interrupted halfway and reopened twice | exactly one complete set of rows exists, second open is a no-op |
| TEST-PS-073-09.T08 | abuse | PS-073-05.R01, PS-073-05.R02, PS-073-05.R03 | peer statement with unknown currency; anonymous reads relay accepted list; attempt to call register without unlocking | statement quarantined with COMMERCE_CURRENCY_UNKNOWN; only the relay's published list visible; locked vault refuses; local audit entry written |
| TEST-PS-073-09.T09 | integration | PS-073-06.R01, PS-073-06.R02 | two tabs concurrently registering the same code | one succeeds, one COMMERCE_CURRENCY_EXISTS |
| TEST-PS-073-09.T10 | integration | PS-073-07.R01, PS-073-07.R02, PS-073-07.R03 | register USDC and read via query | contract shown with EIP-55 checksum; audit retained |
| TEST-PS-073-09.T11 | load | PS-073-08.R01, PS-073-08.R02, PS-073-08.R03 | 1 000 lookups per second for 2 minutes | p95 ≤ 20 ms and metrics exported |
| TEST-PS-073-09.T12 | unit | PS-073-09.R01 | traceability tool run | every PS-073 requirement maps to a passing test |
| TEST-PS-073-09.T13 | integration | PS-073-10.R01, PS-073-10.R02, PS-073-10.R03 | export and re-import the registry into a fresh vault; roll back one release | rows identical; v1 rows readable by previous release |
| TEST-PS-073-09.T14 | unit | PS-073-01.R04, PS-073-02.R04, PS-073-07.R04 | check_descriptor with the matching USDC descriptor, with 18 decimals, with a look-alike contract and with a wrong digest | first matches; the others return COMMERCE_CURRENCY_MISMATCH naming the differing field; nothing is registered |
| TEST-PS-073-09.T15 | integration | PS-073-04.R04, PS-073-07.R04 | vault A sends a USDC obligation whose descriptor says 18 decimals to vault B (6 decimals); then an unknown token statement is registered from its descriptor with and without checksumConfirmed | B quarantines the statement with COMMERCE_CURRENCY_MISMATCH and shows the difference; registration without confirmation fails with VALIDATION_FAILED, with confirmation stores exactly the descriptor fields and origin peer_statement |
| TEST-PS-073-09.T16 | integration | PS-073-04.R03, PS-073-06.R03 | disable a currency in tab 1 and resolve it in tab 2 within 30 s; then drop the BroadcastChannel invalidation message | tab 2 sees disabled within 30 s; with the message lost the cache refresh retries and then reads through to IndexedDB and still returns disabled |

## Acceptance criteria

- All tests T01–T16 pass in CI.
- Decimals of an existing currency can never change through any API or migration.
- A tenant seeded from the snapshot offers exactly the configured allowed list to price inputs.
- A Money value in a crypto or non-snapshot currency is never accepted from a peer statement whose asset descriptor differs from the local definition.

## Dependencies

Module depends on: F09.S03.M03, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
