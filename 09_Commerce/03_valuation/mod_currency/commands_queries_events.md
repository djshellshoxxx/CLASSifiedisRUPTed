# PS-073-04 — Commands, queries and events: Currency registry

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S03.M01 Currency registry](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/valuation/currency` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-073-04.R01** Register and set_status are vault commands (local, actor is the unlocked principal, no signed statement and no relay command); get and list are vault queries.
- **PS-073-04.R02** Registration and status changes emit events into the vault outbox in the same IndexedDB transaction as the state change.
- **PS-073-04.R03** Other modules resolve currencies through the query or the in-process CurrencyRegistry cache, refreshed within 30 s of a change.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `commerce.currency.register` | commerce.currency.register | [vault command] { code, kind: crypto, name, decimals, chainId, contract? } | { currencyId, revision: 1 } | VALIDATION_FAILED, COMMERCE_CURRENCY_EXISTS, COMMERCE_CURRENCY_CHAIN_UNSUPPORTED | commerce.currency.registered | yes (Idempotency-Key) |
| `commerce.currency.set_status` | commerce.currency.set_status | [vault command] { currencyId, status: active\|disabled\|retired, expectedRevision } | { currencyId, revision, status } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, PRECONDITION_FAILED, COMMERCE_CURRENCY_IMMUTABLE | commerce.currency.status_changed | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `commerce.currency.list` | commerce.currency.read | { status?: active\|disabled\|retired\|all, kind?: fiat\|crypto, cursor?, limit ≤ 200 } | { items: CurrencyDef[], nextCursor? } |  |
| `commerce.currency.get` | commerce.currency.read | { code } | CurrencyDef | COMMERCE_CURRENCY_UNKNOWN |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `commerce.currency.registered` | P0 | { currencyId, code, kind, decimals, chainId? } |
| `commerce.currency.status_changed` | P0 | { currencyId, code, from, to } |

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| COMMERCE_CURRENCY_UNKNOWN | 422 | no | currency code is not registered (MNY-2) |
| COMMERCE_CURRENCY_EXISTS | 409 | no | code already registered for this tenant |
| COMMERCE_CURRENCY_IMMUTABLE | 422 | no | decimals, kind or chain binding cannot change |
| COMMERCE_CURRENCY_DISABLED | 422 | no | currency exists but is not enabled for new use |
| COMMERCE_CURRENCY_CHAIN_UNSUPPORTED | 422 | no | chain is not configured or contract is invalid |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
POST /api/v1/cmd/commerce.currency.register
Idempotency-Key: 0192f3a4-0000-7000-8000-0000000000c1
{ "code": "USDC", "kind": "crypto", "name": "USD Coin", "decimals": 6, "chainId": "ethereum-mainnet", "contract": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" }
201 { "currencyId": "0192f3a5-…", "revision": 1 }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-073-09.T06 | contract | PS-073-04.R01, PS-073-04.R02, PS-073-09.R02 | execute each command and query | outputs and events validate against the registry |
| TEST-PS-073-09.T07 | integration | PS-073-04.R03, PS-073-06.R03 | vault seeding interrupted halfway and reopened twice | exactly one complete set of rows exists, second open is a no-op |

## Dependencies

Module depends on: F09.S03.M03, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
