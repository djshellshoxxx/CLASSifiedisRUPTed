# F09.S01.M03 — Crypto payments

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F09.S01](../SPEC.md). **Process IDs:** PS-068-01…PS-068-10. **Code:** `packages/commerce/src/payments/crypto`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Lets a payee ask for payment in a crypto asset by supplying their own receiving address, amount and chain, and lets each party's vault check a claimed transaction against the chain through a ChainVerifierPort adapter that the user configured (their own node, an Esplora-compatible or EVM JSON-RPC endpoint, or a user-selected relay that returns relay-signed observations). It tracks confirmations, applies the finality policy (Bitcoin 6 confirmations, Ethereum-family at or below the finalized tag), handles reorgs, and never confirms anything without a verifier. The platform never requests, derives or stores private keys or seed phrases and never signs or broadcasts payments.

## Responsibilities

- Own CryptoPaymentRequest (payee address, amount, asset, chain, validity) and its signed statement classrup.commerce.crypto_request/v1.
- Own ChainObservation per claimed transaction and run the observation loop through ChainVerifierPort adapters, in the vault, while the PWA is running or when periodic background sync fires.
- [object Object]
- Verify address, amount and asset (native or token contract from F09.S03.M01) before a transaction can count; underpayment or wrong destination never confirms.
- Implement the crypto MethodRulePort for F09.S01.M01 and refuse any input that looks like a private key, seed phrase or extended private key.
- Let the user configure verifier endpoints per chain and show which endpoint and trust level produced each observation.

## Not responsible for

- The Deal, PaymentClaim and payee acknowledgement commands (F09.S01.M01).
- Wallet functionality, key management, address derivation, transaction construction, signing or broadcasting; the payer pays from their own wallet outside the app.
- Currency definitions and decimals (F09.S03.M01) and FX conversion (F09.S03.M02, F09.S03.M03).
- Future: Lightning invoices, Layer 2 chains, Solana or other chains configured per tenant, and multi-endpoint quorum by default (MVP supports an optional 2-of-2 quorum when two endpoints are configured).

## User stories

- As a seller, I enter my own receiving address and the amount in BTC or USDC and send the request to the buyer, knowing the app never holds my keys.
- As a buyer, I pay from my own wallet, paste the transaction ID, and see confirmed 2 of 6 on chain, then final, or a clear reorg notice.
- As a user with no verifier configured, I still can claim payment, and I see claimed (unverified) and a prompt to set up a verifier.

## Edge cases

- No ChainVerifierPort is configured for the chain; the claim stays claimed and verification.source stays self; nothing is auto-confirmed.
- The transaction pays the right address but 4 000 sats less than requested; the observation records underpaid, the claim does not confirm, and the payee sees the difference and can dispute or ask for the remainder via a new claim.
- A Bitcoin block with the transaction is orphaned at 2 confirmations; status moves to reorged, the UI shows it, and if the transaction is re-included the claim returns to pending_confirmation.
- The verifier endpoint returns inconsistent data between polls or two configured endpoints disagree; the observation is marked disagreement, no progress is applied, and the user is warned.
- The user pastes a 12-word seed phrase or a WIF key into the txRef or note field; the input is rejected without being stored or logged.
- ERC-20 transfer is sent from a different token contract than the registered USDC contract; the observation records wrong_asset and never confirms.
- The PWA stays closed for 3 days; on open the observation catches up from the chain and applies the final status, with checkedAt showing when it was last verified.

## UX and accessibility

- Request payment sheet: asset and chain (BTC, ETH, USDC), amount, receiving address field with checksum feedback, 'Use a fresh address' hint, validity selector, Send request.
- Pay screen for the payer: address and amount with QR and copy, warning 'Send exactly this amount on this chain', then field Paste transaction ID.
- Verification panel: status chip claimed (unverified), confirming 2 of 6, confirmed, final, reorged; shows verifier endpoint host, last checked time and trust label.
- Verifier settings: endpoint URL per chain, optional second endpoint, test connection button.

**States:** no-verifier; claimed-unverified; pending; confirming-n-of-m; confirmed; final; reorged; failed; underpaid; endpoint-disagreement; offline

**Accessibility:** Confirmation progress is text such as 'confirmed 2 of 6 on chain' in an aria-live polite region, not only a bar.; Addresses are shown in monospace groups of 4 characters with a copy button and an accessible name that includes the chain.; QR codes always have the address as adjacent text.

## Owned data

- `CryptoPaymentRequest` (classrup.commerce.crypto_request/v1, P2, RET-EVIDENCE)
- `ChainObservation` (classrup.commerce.chain_observation/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `commerce.crypto_request.create`, `commerce.crypto_request.cancel`, `commerce.crypto_verifier.configure`, `commerce.crypto_observation.refresh`
- Queries: `commerce.crypto_request.get`, `commerce.crypto_observation.get_for_claim`
- Emits: `commerce.payment.confirming`, `commerce.payment.confirmed`, `commerce.payment.finalized`, `commerce.payment.reorged`, `commerce.payment.failed`
- Consumes: `commerce.payment.claimed`, `commerce.payment.expired`, `commerce.deal.cancelled`

## Dependencies

F09.S01.M01, F09.S03.M01, F09.S03.M03, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-FLG-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-068-01 | [Domain schema](domain_schema.md) | 3 |
| PS-068-02 | [Validation rules](validation_rules.md) | 3 |
| PS-068-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-068-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-068-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-068-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-068-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-068-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-068-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-068-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/commerce/src/payments/crypto/index.ts`.

## Acceptance criteria

- All tests T01 to T17 pass in CI.
- With no verifier configured, no crypto claim ever leaves claimed.
- No code path reads, requests, stores or logs a private key or seed phrase, verified by input rejection tests and static analysis.
- A reorg is always visible to the user and never leaves a stale final state.
