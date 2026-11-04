# PS-075-04 — Commands, queries and events: FX rates and quotes

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S03.M02 FX rates and quotes](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/valuation/rates` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-075-04.R01** Commands request, issue_manual and revoke are vault commands (local, actor is the unlocked principal); relay_issue is a relay command that returns a relay-signed quote; revoke additionally produces the signed statement classrup.commerce.fx_quote_revocation/v1.
- **PS-075-04.R02** Each issue emits commerce.fx_quote.issued into the vault outbox in the same IndexedDB transaction as the insert.
- **PS-075-04.R03** Consumers pin quotes by ID only and never copy rates without the ID.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `commerce.fx_quote.request` | commerce.fx_quote.request | [vault command] { base, quote, validForMs? (default 900000, 60000..3600000), sourceId? (user-chosen RateSourcePort) } | FxQuote with id, rate, source, expiresAt | VALIDATION_FAILED, COMMERCE_RATE_PAIR_INVALID, COMMERCE_RATE_UNAVAILABLE, COMMERCE_RATE_STALE, COMMERCE_RATE_SUSPECT, COMMERCE_RATE_SIGNATURE_INVALID, DEPENDENCY_UNAVAILABLE | commerce.fx_quote.issued | yes (Idempotency-Key) |
| `commerce.fx_quote.issue_manual` | commerce.fx_quote.issue_manual | [vault command] { base, quote, rate: {num, den}, reason, validForMs? (900000..86400000) } | FxQuote labelled manual | VALIDATION_FAILED, COMMERCE_RATE_PAIR_INVALID | commerce.fx_quote.issued | yes (Idempotency-Key) |
| `commerce.fx_quote.relay_issue` | commerce.fx_quote.relay_issue | [relay command] signed request { base, quote, validForMs? } over the relay API | relay-signed FxQuote (sig by relay key) | VALIDATION_FAILED, COMMERCE_RATE_PAIR_INVALID, COMMERCE_RATE_UNAVAILABLE, COMMERCE_RATE_STALE, COMMERCE_RATE_SUSPECT, RATE_LIMITED |  | yes (Idempotency-Key) |
| `commerce.fx_quote.revoke` | commerce.fx_quote.revoke | [vault command, produces signed statement classrup.commerce.fx_quote_revocation/v1] { quoteId, expectedRevision } | { quoteId, revision, status: revoked } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | commerce.fx_quote.revoked | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `commerce.fx_quote.check` | commerce.fx_quote.read | { quoteId } | { valid: boolean, status, expiresAt, msRemaining } | NOT_FOUND, EXPIRED |
| `commerce.fx_quote.get` | commerce.fx_quote.read | { quoteId } | FxQuote (full record) | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `commerce.fx_quote.issued` | P1 | { quoteId, base, quote, rate: {num, den}, source, sourceKind, expiresAt } |
| `commerce.fx_quote.revoked` | P1 | { quoteId, base, quote } |

### Events consumed

| Type | Effect |
|---|---|
| `commerce.currency.registered` | register supported pairs for adapters and manual quotes when a new asset is added |
| `commerce.currency.status_changed` | invalidate cached provider rates and refuse quotes for disabled or retired currencies |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| COMMERCE_RATE_PAIR_INVALID | 422 | no | base or quote is unknown, disabled or equal |
| COMMERCE_RATE_SIGNATURE_INVALID | 422 | no | relay-signed quote failed signature verification |
| COMMERCE_RATE_UNAVAILABLE | 422 | no | no adapter or manual quote supplies this pair |
| COMMERCE_RATE_STALE | 422 | yes | provider data is older than the allowed age for this pair |
| COMMERCE_RATE_SUSPECT | 422 | no | provider rate deviates more than 50 percent from the last accepted quote |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
POST /api/v1/cmd/commerce.fx_quote.request
Idempotency-Key: 0192f3a4-0000-7000-8000-0000000000d1
{ "base": "EUR", "quote": "USD" }
201 { "id": "0192f3a5-…", "base": "EUR", "quote": "USD", "rate": { "num": "1087", "den": "1000" },
      "source": "ecb-daily", "sourceKind": "provider", "asOf": "2026-11-04T09:00:00.000Z", "expiresAt": "2026-11-04T10:15:00.000Z" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-075-09.T06 | contract | PS-075-04.R01, PS-075-04.R02, PS-075-09.R02 | execute each command and query | outputs and events validate against registry schemas |
| TEST-PS-075-09.T07 | integration | PS-075-04.R03, PS-075-06.R01 | replayed request with same key | same quote ID returned; no second event |

## Dependencies

Module depends on: F09.S03.M01, F09.S03.M03, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
