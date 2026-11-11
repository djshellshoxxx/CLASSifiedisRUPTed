# PS-068-04 — Commands, queries and events: Crypto payments

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M03 Crypto payments](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/crypto` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-068-04.R01** Request commands are vault commands that produce the signed statements classrup.commerce.crypto_request/v1 and classrup.commerce.crypto_request_cancel/v1; configure and refresh are vault-local with no statement and no relay command.
- **PS-068-04.R02** Observation transitions emit the catalog events into the vault outbox in the same IndexedDB transaction as the observation update; the extra event commerce.payment.failed is also emitted.
- **PS-068-04.R03** The module consumes the claim and Deal events to start and stop observation and never writes a PaymentClaim status directly.
- **PS-068-04.R04** The module registers a StatementHandlerPort handler with F09.S01.M01 for classrup.commerce.crypto_request/v1 and classrup.commerce.crypto_request_cancel/v1 (signer - obligation payee) that checks the signer role, re-validates address, chain and asset descriptor, deduplicates by cid, buffers statements whose Deal is unknown for 24 h, quarantines with reasons signer_not_payee, address_invalid, asset_mismatch or request_unknown, and drops statements from blocked dids silently.
- **PS-068-04.R05** Every commerce.payment.* event this module produces carries contextRef, payerId and payeeId besides claimId and dealId, so consumers route and filter without reading the Deal (N4, N5).
- **PS-068-04.R06** The crypto MethodRulePort returns fail for invalid, secret-looking, reused or out-of-request input, hold(txid_lookup_pending) while a configured verifier has not found the txid, and release or discard through the F09.S01.M01 callbacks; with no verifier it fails with COMMERCE_CLAIM_METHOD_RULE unless txidAttested is true.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `commerce.crypto_request.create` | commerce.crypto_request.create | [vault command, produces signed statement classrup.commerce.crypto_request/v1] { dealId, obligationId, chainId, asset, address, amount: Money, validForMs? (default 604800000, 3600000..1209600000) }; chainTipAtCreation and assetDescriptor are filled by the vault | { requestId, revision: 1, requestCid, expiresAt, chainTipAtCreation?, peerSync } | VALIDATION_FAILED, NOT_FOUND, FORBIDDEN, CONFLICT_STATE, COMMERCE_CRYPTO_CHAIN_DISABLED, COMMERCE_CRYPTO_ADDRESS_INVALID, COMMERCE_CRYPTO_ADDRESS_REUSED, COMMERCE_CRYPTO_SECRET_REJECTED |  | yes (Idempotency-Key) |
| `commerce.crypto_request.cancel` | commerce.crypto_request.cancel | [vault command, produces signed statement classrup.commerce.crypto_request_cancel/v1] { requestId, expectedRevision } | { requestId, revision, status: cancelled } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `commerce.crypto_verifier.configure` | commerce.crypto_verifier.configure | [vault command, local setting] { chainId, endpoints: [{kind: own-node\|esplora\|evm-jsonrpc\|relay, url, apiKeyRef?}] (1..2), quorum?: 1\|2 }; requests never carry a DID, device-key signature or relay access token | { chainId, endpoints, testedAt, ok, consent: granted\|missing } | VALIDATION_FAILED, COMMERCE_CRYPTO_CHAIN_DISABLED, DEPENDENCY_UNAVAILABLE, PRECONDITION_FAILED |  | yes (Idempotency-Key) |
| `commerce.crypto_observation.refresh` | commerce.crypto_observation.refresh | [vault command, local] { claimId } | { observationId, status, confirmations, checkedAt, label } | NOT_FOUND, RATE_LIMITED, DEPENDENCY_UNAVAILABLE, PRECONDITION_FAILED, COMMERCE_CRYPTO_NO_VERIFIER | commerce.payment.confirming, commerce.payment.confirmed, commerce.payment.finalized, commerce.payment.reorged, commerce.payment.failed | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `commerce.crypto_request.get` | commerce.crypto_request.read | { requestId } | { request: CryptoPaymentRequest, observations: ChainObservation[] } | NOT_FOUND |
| `commerce.crypto_observation.get_for_claim` | commerce.crypto_request.read | { claimId } | { observation: ChainObservation, label: string, deepReorgAlert?, budgetPaused? } | NOT_FOUND |
| `commerce.crypto_observation.diagnostics` | commerce.crypto_request.read | { since? } | { polls, disagreements, reorgs, deepReorgAlerts, mismatches, budgetUsed, budgetPaused } local diagnostics only |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `commerce.payment.confirming` | P2 | { claimId, dealId, contextRef, payerId, payeeId, chainId, txid, confirmations, requiredConfirmations, finalityPolicy, verifierId, label } |
| `commerce.payment.confirmed` | P2 | { claimId, dealId, contextRef, payerId, payeeId, chainId, txid, confirmations, blockHeight, verifierId } |
| `commerce.payment.finalized` | P2 | { claimId, dealId, contextRef, payerId, payeeId, chainId, txid, finalityPolicy, checkedAt, verifierId, observerRole: payer\|payee } |
| `commerce.payment.reorged` | P2 | { claimId, dealId, contextRef, payerId, payeeId, chainId, txid, previousBlockHash, reorgCount } |
| `commerce.payment.failed` | P2 | { claimId, dealId, contextRef, payerId, payeeId, chainId, txid, reason: absent\|reverted\|underpaid\|wrong_address\|wrong_asset\|before_request, receivedAmount? } |

### Events consumed

| Type | Effect |
|---|---|
| `commerce.payment.claimed` | for method crypto with a matching request, attach the claim to the request and create a watching ChainObservation when a verifier exists and chain_lookup consent is granted; otherwise leave the claim claimed |
| `commerce.payment.acknowledged` | for a crypto claim acknowledged by the payee with verificationSource chain, add its amount to coveredAmount and settle the request when covered, also in a payer vault without its own verifier |
| `commerce.payment.expired` | stop observation and reopen the request when validity remains and no other claim is pending |
| `commerce.deal.cancelled` | cancel the open or claimed request of the Deal and stop observations |
| `privacy.deletion.completed` | through the DeletionPort plan, replace the deleted principal's did in retained requests and observations with the per-deletion pseudonym; chain data cannot be erased and the UI says so |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| COMMERCE_CRYPTO_CHAIN_DISABLED | 422 | no | chain is not enabled or has no registered asset |
| COMMERCE_CRYPTO_ADDRESS_INVALID | 422 | no | address format, network or checksum is invalid |
| COMMERCE_CRYPTO_TXID_INVALID | 422 | no | transaction id format is invalid for the chain |
| COMMERCE_CRYPTO_SECRET_REJECTED | 422 | no | input looks like a private key or seed phrase and was discarded |
| COMMERCE_CRYPTO_REQUEST_NOT_OPEN | 409 | no | the payment request is not open, has no uncovered remainder or has expired |
| COMMERCE_CRYPTO_TX_REUSED | 409 | no | the transaction id is already attached to another claim |
| COMMERCE_CRYPTO_NO_VERIFIER | 409 | no | no chain verifier is configured; the claim stays claimed (unverified) |
| COMMERCE_CRYPTO_ADDRESS_REUSED | 409 | no | the receiving address is still used by another open or claimed request in this vault |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statement registry (N2, registered in F11.S01.M01): classrup.commerce.crypto_request/v1 - obligation payee; classrup.commerce.crypto_request_cancel/v1 - obligation payee. Both reach this module through the F09.S01.M01 ingest dispatcher and the StatementHandlerPort handler registered here, which mirrors the request in the payer's vault with origin peer. MethodRulePort crypto rule - check(claimInput) -> fail(COMMERCE_CRYPTO_TXID_INVALID | COMMERCE_CRYPTO_SECRET_REJECTED | COMMERCE_CRYPTO_TX_REUSED | COMMERCE_CRYPTO_REQUEST_NOT_OPEN | COMMERCE_CLAIM_METHOD_RULE), pass({requestId, requestCid}) or hold(txid_lookup_pending); release(claimId) when the verifier finds the txid, discard(claimId) after 24 h. ChainVerifierPort {tip(chainId), tx(chainId, txid), finalized(chainId)} with adapters own-node, esplora, evm-jsonrpc and relay (relay-signed observations verified with F11.S01.M03). Lookups are a third-party disclosure: privacy.consent.check purpose chain_lookup must be granted for the endpoint, requests are unauthenticated (no DID, device-key signature, relay access token or cookie) and use a fetch context and connection separate from mailbox traffic. In the payee's vault the F09.S01.M01 consumer of commerce.payment.finalized signs classrup.commerce.payment_ack/v1 with verification.source chain.

### Example

```
vault command commerce.crypto_request.create (payee vault)
{ "dealId": "5b1d0c7e-3a2f-8e41-9c0d-…", "obligationId": "o1", "chainId": "bitcoin-mainnet", "asset": "BTC",
  "address": "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq", "amount": { "amount": "125000", "currency": "BTC" } }
=> { "requestId": "0192f3a9-…", "revision": 1, "requestCid": "sha256-1ab2…", "expiresAt": "2026-11-11T10:00:00.000Z", "chainTipAtCreation": 871204, "peerSync": "prepared" }
payer vault: commerce.statement.ingest dispatches the request to this module's handler, which stores it with origin peer
later in each vault: observation watching -> pending -> confirmed (2 of 6 per your verifier) -> final; each step emits commerce.payment.* with contextRef, payerId and payeeId
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-068-09.T08 | contract | PS-068-04.R01, PS-068-04.R02, PS-068-09.R02 | execute each command and run an observation to final | outputs, envelopes and events validate against registry schemas |
| TEST-PS-068-09.T09 | integration | PS-068-04.R03, PS-068-06.R01 | consumed events delivered twice; same command ID replayed | one request and one observation; original result returned |
| TEST-PS-068-09.T18 | unit | PS-068-02.R04, PS-068-04.R06 | with a verifier configured, claim with a 0x plus 64-hex value the verifier never finds, then with a real txid; without a verifier, claim without and with txidAttested | first held with sendHold txid_lookup_pending, never signed into a claim or sent to the payee, discarded after 24 h; real txid released and sent; without verifier refused with COMMERCE_CLAIM_METHOD_RULE until attested |
| TEST-PS-068-09.T27 | integration | PS-068-04.R04 | payer vault ingests a crypto_request signed by the payee, one signed by the payer, one with an invalid address, one with an 18-decimal USDC descriptor, a duplicate and one from a blocked did | first stored with origin peer and its address; then signer_not_payee, address_invalid and asset_mismatch (COMMERCE_CURRENCY_MISMATCH) quarantined; duplicate no-op; blocked dropped silently |
| TEST-PS-068-09.T28 | contract | PS-068-04.R05 | assert every produced event against the expectations of F09.S01.M01, F01.S01.M03, F05.S01.M02, F03.S02.M02, F02.S04.M01 and F13.S01.M03 | each commerce.payment.* event carries contextRef, payerId and payeeId |

## Dependencies

Module depends on: F09.S01.M01, F09.S03.M01, F09.S03.M03, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
