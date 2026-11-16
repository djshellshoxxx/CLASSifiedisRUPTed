# PS-068-04 — Commands, queries and events: Crypto payments

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M03 Crypto payments](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/crypto` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-068-04.R01** Request commands are vault commands that produce the signed statements classrup.commerce.crypto_request/v1 and classrup.commerce.crypto_request_cancel/v1; configure and refresh are vault-local with no statement and no relay command.
- **PS-068-04.R02** Observation transitions emit the catalog events into the vault outbox in the same IndexedDB transaction as the observation update; the extra event commerce.payment.failed is also emitted.
- **PS-068-04.R03** The module consumes the claim and Deal events to start and stop observation and never writes a PaymentClaim status directly.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `commerce.crypto_request.create` | commerce.crypto_request.create | [vault command, produces signed statement classrup.commerce.crypto_request/v1] { dealId, obligationId, chainId, asset, address, amount: Money, validForMs? (default 604800000, 3600000..1209600000) } | { requestId, revision: 1, requestCid, expiresAt, peerSync } | VALIDATION_FAILED, NOT_FOUND, FORBIDDEN, CONFLICT_STATE, COMMERCE_CRYPTO_CHAIN_DISABLED, COMMERCE_CRYPTO_ADDRESS_INVALID, COMMERCE_CRYPTO_SECRET_REJECTED |  | yes (Idempotency-Key) |
| `commerce.crypto_request.cancel` | commerce.crypto_request.cancel | [vault command, produces signed statement classrup.commerce.crypto_request_cancel/v1] { requestId, expectedRevision } | { requestId, revision, status: cancelled } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `commerce.crypto_verifier.configure` | commerce.crypto_verifier.configure | [vault command, local setting] { chainId, endpoints: [{kind: esplora\|evm-jsonrpc\|relay, url, apiKeyRef?}] (1..2), quorum?: 1\|2 } | { chainId, endpoints, testedAt, ok } | VALIDATION_FAILED, COMMERCE_CRYPTO_CHAIN_DISABLED, DEPENDENCY_UNAVAILABLE |  | yes (Idempotency-Key) |
| `commerce.crypto_observation.refresh` | commerce.crypto_observation.refresh | [vault command, local] { claimId } | { observationId, status, confirmations, checkedAt } | NOT_FOUND, RATE_LIMITED, DEPENDENCY_UNAVAILABLE, COMMERCE_CRYPTO_NO_VERIFIER | commerce.payment.confirming, commerce.payment.confirmed, commerce.payment.finalized, commerce.payment.reorged, commerce.payment.failed | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `commerce.crypto_request.get` | commerce.crypto_request.read | { requestId } | { request: CryptoPaymentRequest, observation?: ChainObservation } | NOT_FOUND |
| `commerce.crypto_observation.get_for_claim` | commerce.crypto_request.read | { claimId } | { observation: ChainObservation, label: string } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `commerce.payment.confirming` | P2 | { claimId, dealId, chainId, txid, confirmations, requiredConfirmations, verifierId } |
| `commerce.payment.confirmed` | P2 | { claimId, dealId, chainId, txid, confirmations, blockHeight, verifierId } |
| `commerce.payment.finalized` | P2 | { claimId, dealId, chainId, txid, finalityPolicy, checkedAt, verifierId } |
| `commerce.payment.reorged` | P2 | { claimId, dealId, chainId, txid, previousBlockHash, reorgCount } |
| `commerce.payment.failed` | P2 | { claimId, dealId, chainId, txid, reason: absent\|reverted } |

### Events consumed

| Type | Effect |
|---|---|
| `commerce.payment.claimed` | for method crypto with a matching open request, attach txid, mark the request claimed and create a watching ChainObservation if a verifier exists; otherwise leave the claim claimed |
| `commerce.payment.expired` | stop observation and reopen the request when validity remains |
| `commerce.deal.cancelled` | cancel the open request of the Deal and stop observations |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| COMMERCE_CRYPTO_CHAIN_DISABLED | 422 | no | chain is not enabled or has no registered asset |
| COMMERCE_CRYPTO_ADDRESS_INVALID | 422 | no | address format, network or checksum is invalid |
| COMMERCE_CRYPTO_TXID_INVALID | 422 | no | transaction id format is invalid for the chain |
| COMMERCE_CRYPTO_SECRET_REJECTED | 422 | no | input looks like a private key or seed phrase and was discarded |
| COMMERCE_CRYPTO_REQUEST_NOT_OPEN | 409 | no | the payment request is not open or has expired |
| COMMERCE_CRYPTO_TX_REUSED | 409 | no | the transaction id is already attached to another claim |
| COMMERCE_CRYPTO_NO_VERIFIER | 409 | no | no chain verifier is configured; the claim stays claimed (unverified) |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command commerce.crypto_request.create
{ "dealId": "0192f3a6-…", "obligationId": "o1", "chainId": "bitcoin-mainnet", "asset": "BTC",
  "address": "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq", "amount": { "amount": "125000", "currency": "BTC" } }
=> { "requestId": "0192f3a9-…", "revision": 1, "requestCid": "sha256-1ab2…", "expiresAt": "2026-11-11T10:00:00.000Z", "peerSync": "prepared" }
later: observation moves watching -> pending -> confirmed (2 of 6) -> final; each step emits commerce.payment.* into the vault outbox
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-068-09.T08 | contract | PS-068-04.R01, PS-068-04.R02, PS-068-09.R02 | execute each command and run an observation to final | outputs, envelopes and events validate against registry schemas |
| TEST-PS-068-09.T09 | integration | PS-068-04.R03, PS-068-06.R01 | consumed events delivered twice; same command ID replayed | one request and one observation; original result returned |

## Dependencies

Module depends on: F09.S01.M01, F09.S03.M01, F09.S03.M03, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
