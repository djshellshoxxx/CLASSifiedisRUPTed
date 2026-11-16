# PS-073-01 — Domain schema: Currency registry

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S03.M01 Currency registry](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/valuation/currency` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-073-01.R01** A CurrencyDef stores code, kind (fiat or crypto), name, decimals, optional chain binding, status and revision per CTR-ID-001, scoped per vault.
- **PS-073-01.R02** Currency definitions are P0 reference data retained as RET-STANDARD; they hold no personal data.
- **PS-073-01.R03** Decimals, kind and chain binding are immutable after registration; only status and display name can change.

## Specification

### CurrencyDef

Schema `classrup.commerce.currency_def/v1` · storage **device** · privacy **P0** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| vaultId | uuidv7 — local vault scope (CTR-ID-001 tenant slot) |
| code | string — ISO 4217 alpha-3 uppercase, or crypto code 2..10 chars A-Z0-9; unique per vault |
| kind | enum — fiat \| crypto |
| name | string — 1..60 code points |
| decimals | int — 0..18 for fiat (ISO list), 0..36 for crypto; immutable |
| chainId? | string — required for crypto; one of the configured chains (bitcoin-mainnet, ethereum-mainnet) |
| contract? | string — token contract address for ERC-20 style assets; absent for native assets |
| status | enum — active \| disabled \| retired |
| snapshotVersion? | string — ISO table snapshot date for fiat rows, e.g. 2026-01-01 |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- code is unique per vault and never reused after retirement.
- decimals never change after creation.
- A crypto row has chainId; a fiat row has neither chainId nor contract.

### Storage DDL

```sql
CREATE TABLE commerce_currency_def (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL /* vault id */, code TEXT NOT NULL, kind TEXT NOT NULL,
  decimals INTEGER NOT NULL, chain_id TEXT, status TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX commerce_currency_code ON commerce_currency_def(tenant_id, code);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-073-09.T01 | unit | PS-073-01.R01, PS-073-01.R02, PS-073-02.R01 | register a crypto asset with valid data | row stored with revision 1, decimals and chain binding intact |
| TEST-PS-073-09.T03 | unit | PS-073-01.R03, PS-073-02.R03, PS-073-09.R03 | update attempt on decimals and chain binding | COMMERCE_CURRENCY_IMMUTABLE and nothing stored |

## Dependencies

Module depends on: F09.S03.M03, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FLG-001. Predecessor: [module SPEC](SPEC.md).
