# PS-067-04 — Commands, queries and events: Cash payments

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M02 Cash payments](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/cash` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-067-04.R01** Terms commands are vault commands that produce the signed statements classrup.commerce.cash_terms/v1 and classrup.commerce.cash_terms_accept/v1; no relay command exists.
- **PS-067-04.R02** The module emits no domain events (catalog emits is empty); state is observable through queries and the Deal card.
- **PS-067-04.R03** The module consumes Deal and claim events to create default terms and show safety guidance.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `commerce.cash_terms.set` | commerce.cash_terms.set | [vault command, produces signed statement classrup.commerce.cash_terms/v1] { dealId, obligationId, receiptRequired, handoverHint? } | { termsId, revision: 1, status: proposed, expiresAt, peerSync } | VALIDATION_FAILED, NOT_FOUND, FORBIDDEN, COMMERCE_CASH_NOT_ALLOWED, COMMERCE_CASH_LIMIT_EXCEEDED, COMMERCE_CASH_HINT_PRIVATE, RATE_LIMITED |  | yes (Idempotency-Key) |
| `commerce.cash_terms.accept` | commerce.cash_terms.accept | [vault command, produces signed statement classrup.commerce.cash_terms_accept/v1] { termsId, expectedRevision } | { termsId, revision, status: accepted } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE, EXPIRED |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `commerce.cash_terms.get` | commerce.cash_terms.read | { dealId, obligationId } | { current: CashTerms, history: CashTerms[], guidance: { level, keys[] } } | NOT_FOUND |

### Events produced

_None._

### Events consumed

| Type | Effect |
|---|---|
| `commerce.deal.opened` | create default accepted CashTerms (acknowledgement required, no receipt) for every obligation that allows cash |
| `commerce.payment.claimed` | for cash claims show the safety guidance and, when receiptRequired, prompt both parties to sign receipts after acknowledgement |
| `commerce.payment.acknowledged` | for cash claims with receiptRequired, show the pending receipt prompt (F09.S02.M01); no state change here |
| `commerce.payment.expired` | close open receipt prompts for the expired cash claim |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| COMMERCE_CASH_NOT_ALLOWED | 422 | no | the obligation does not allow cash or the Deal is not open |
| COMMERCE_CASH_LIMIT_EXCEEDED | 422 | no | obligation exceeds the cash limit of the active jurisdiction profile |
| COMMERCE_CASH_TERMS_UNACCEPTED | 409 | no | receipt-required terms are not yet accepted by the payer |
| COMMERCE_CASH_HINT_PRIVATE | 422 | no | hint appears to contain a stored private address |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command commerce.cash_terms.set
{ "dealId": "0192f3a6-…", "obligationId": "o1", "receiptRequired": true, "handoverHint": "Outside the library main entrance, daytime" }
=> { "termsId": "0192f3a8-…", "revision": 1, "status": "proposed", "expiresAt": "2026-11-11T10:00:00.000Z", "peerSync": "prepared" }
vault command commerce.cash_terms.accept { "termsId": "0192f3a8-…", "expectedRevision": 1 }
=> { "termsId": "0192f3a8-…", "revision": 2, "status": "accepted" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-067-09.T05 | contract | PS-067-04.R01, PS-067-04.R02, PS-067-09.R02 | execute both commands and ingest in vault B | outputs and envelopes validate; no events emitted |
| TEST-PS-067-09.T06 | integration | PS-067-04.R03, PS-067-01.R02 | commerce.deal.opened delivered twice | exactly one default terms row per cash obligation |

## Dependencies

Module depends on: F09.S01.M01, F09.S03.M03, F18.S01.M01, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
