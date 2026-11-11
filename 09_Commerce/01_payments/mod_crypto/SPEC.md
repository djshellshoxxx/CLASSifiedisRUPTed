# F09.S01.M03 — Crypto payments

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F09.S01](../SPEC.md). **Process IDs:** PS-068-01…PS-068-10. **Code:** `packages/commerce/src/payments/crypto`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Lets a payee ask for payment in a crypto asset by supplying their own receiving address, amount and chain, and lets each party's vault check a claimed transaction against the chain through a ChainVerifierPort adapter that the user configured (their own node, an Esplora-compatible or EVM JSON-RPC endpoint, or a user-selected relay that returns relay-signed observations). It tracks confirmations, applies the finality policy (Bitcoin 6 confirmations, Ethereum-family at or below the finalized tag), handles reorgs, and never confirms anything without a verifier. Observations are per vault: the payee's vault, once its own verifier reports final, has F09.S01.M01 sign a payment acknowledgement with verification source chain, and only that signed statement completes the Deal in both vaults. Only a transaction that matches the request (address, asset, amount, included after the request's chain tip) is ever shown as confirming. Verifier lookups are an explicit, consented, unauthenticated disclosure to the endpoint the user chose. The platform never requests, derives or stores private keys or seed phrases and never signs or broadcasts payments.

## Responsibilities

- Own CryptoPaymentRequest (payee address, amount, asset, chain, validity, chain tip at creation) and its signed statement classrup.commerce.crypto_request/v1.
- Own ChainObservation per claimed transaction and run the observation loop through ChainVerifierPort adapters, in the vault, while the PWA is running or when periodic background sync fires.
- Apply finality (COM-5): Bitcoin 6 confirmations, Ethereum-family block number at or below the finalized tag, other chains disabled; emit commerce.payment.confirming only for matching transactions, plus confirmed, finalized, reorged and failed with its reason.
- Verify address, amount and asset (native or token contract from F09.S03.M01) before a transaction can count; underpayment or wrong destination never confirms.
- Implement the crypto MethodRulePort for F09.S01.M01, refuse any input that looks like a private key, seed phrase or extended private key, and hold a claim local and unsent until its txid is found on chain or attested by the payer.
- Let the user configure verifier endpoints per chain and show which endpoint and trust level produced each observation.
- Register the StatementHandlerPort handler for classrup.commerce.crypto_request/v1 and crypto_request_cancel/v1 (signer payee) with the F09.S01.M01 ingest dispatcher, so the payer's vault stores the payee's address.
- Bind each request to the chain tip at creation, count only outputs included after it, and refuse an address already used by another open or claimed request in the vault.
- Gate verifier lookups by privacy.consent.check purpose chain_lookup and send them without DID, device-key signature or relay access token, on a connection separate from mailbox traffic.
- Keep polling inside a per-vault budget and keep final observations under a 100-block watch that raises a deep-reorg alert without regressing state.

## Not responsible for

- The Deal, PaymentClaim and payee acknowledgement commands (F09.S01.M01), including signing the chain acknowledgement in the payee's vault.
- Wallet functionality, key management, address derivation, transaction construction, signing or broadcasting; the payer pays from their own wallet outside the app.
- Currency definitions, decimals and asset descriptors (F09.S03.M01) and FX conversion (F09.S03.M02, F09.S03.M03).
- Purpose consent records (F10.S01.M01); this module only calls privacy.consent.check.
- Future: Lightning invoices, Layer 2 chains, Solana or other chains configured per tenant, and multi-endpoint quorum by default (MVP supports an optional 2-of-2 quorum when two endpoints are configured).

## User stories

- As a seller, I enter my own receiving address and the amount in BTC or USDC and send the request to the buyer, knowing the app never holds my keys.
- As a buyer, I pay from my own wallet, paste the transaction ID, and see confirmed 2 of 6 per my verifier, then final, or a clear reorg notice.
- As a user with no verifier configured, I still can claim payment, and I see claimed (unverified) and a prompt to set up a verifier.
- As a buyer whose seller has no verifier yet, I see 'final per your verifier; payee has not confirmed' and know the Deal completes only when the seller's own verifier confirms it.
- As a seller, I am told which endpoint learns my addresses before any lookup happens, and I can keep lookups on my own node.

## Edge cases

- No ChainVerifierPort is configured for the chain; the claim stays claimed and verification.source stays self; nothing is auto-confirmed.
- The transaction pays the right address but 4 000 sats less than requested; the observation records underpaid with receivedAmount, emits commerce.payment.failed with reason underpaid and no confirming event, the label reads 'transaction does not match request', and the payer may claim the received amount and pay the remainder in a second transaction against the same request.
- A Bitcoin block with the transaction is orphaned at 2 confirmations; status moves to reorged, the UI shows it, and if the transaction is re-included the claim returns to pending_confirmation.
- The verifier endpoint returns inconsistent data between polls or two configured endpoints disagree; the observation is marked disagreement, no progress is applied, and the user is warned.
- The user pastes a 12-word seed phrase or a WIF key into the txRef or note field; the input is rejected without being stored or logged.
- ERC-20 transfer is sent from a different token contract than the registered USDC contract; the observation records wrong_asset and never confirms.
- The PWA stays closed for 3 days; on open the observation catches up from the chain and applies the final status, with checkedAt showing when it was last verified.
- The payer pastes a raw 0x-prefixed 64-hex private key as the transaction ID; it has txid format, so the claim is held on the device unsigned and unsent, the verifier does not find it, and it is discarded locally after 24 h without ever reaching the payee.
- An older transaction that paid the same address before the request existed is claimed for a new request; it is included at or below chainTipAtCreation, so it fails with reason before_request.
- The payee tries to reuse an address that another open request in the vault still uses; the request is refused with COMMERCE_CRYPTO_ADDRESS_REUSED.
- Only the payer configured a verifier; the payer's vault reaches final and shows 'final per your verifier; payee has not confirmed', and the Deal completes in both vaults only after the payee's own verifier reaches final and its vault signs the chain acknowledgement.
- The inclusion block of a final Bitcoin transaction is replaced 40 blocks later; the observation stays final, a deep-reorg alert is raised and shown to both parties, and no state regresses.
- Sixty claims are watched at once and the hourly poll budget runs out; observations closest to finality are checked first and the rest show 'verification paused - check budget reached' until the next hour.

## UX and accessibility

- Request payment sheet: asset and chain (BTC, ETH, USDC), amount, receiving address field with checksum feedback, 'Use a fresh address' hint and a refusal when the address is still used by another open request, validity selector, Send request.
- Pay screen for the payer: address and amount with QR and copy, warning 'Send exactly this amount on this chain', then field Paste transaction ID with the note 'A transaction ID is public. Never paste a key or seed phrase.'
- Verification panel: status chip claimed (unverified), held on this device until the transaction is found, confirming 2 of 6 per your verifier, awaiting finalized checkpoint (EVM), confirmed, final per your verifier, final - confirmed by the payee's verifier (signed), transaction does not match request, reorged, deep-reorg alert, verification paused; shows verifier endpoint host, last checked time and trust label.
- Verifier settings: endpoint URL per chain (own node or direct endpoint by default; relay endpoint only as an explicit choice), optional second endpoint, test connection button, and the disclosure 'This endpoint learns which transactions and addresses you look up' with the chain_lookup consent switch.

**States:** no-verifier; claimed-unverified; held-on-device; pending; confirming-n-of-m; awaiting-finalized-checkpoint; confirmed; final-per-your-verifier; final-confirmed-by-payee; reorged; deep-reorg-alert; failed; mismatched; underpaid; endpoint-disagreement; verification-paused; offline

**Accessibility:** Confirmation progress is text such as 'confirmed 2 of 6 per your verifier' in an aria-live polite region, not only a bar.; Addresses are shown in monospace groups of 4 characters with a copy button and an accessible name that includes the chain.; QR codes always have the address as adjacent text.

## Owned data

- `CryptoPaymentRequest` (classrup.commerce.crypto_request/v1, P2, RET-EVIDENCE)
- `ChainObservation` (classrup.commerce.chain_observation/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `commerce.crypto_request.create`, `commerce.crypto_request.cancel`, `commerce.crypto_verifier.configure`, `commerce.crypto_observation.refresh`
- Queries: `commerce.crypto_request.get`, `commerce.crypto_observation.get_for_claim`, `commerce.crypto_observation.diagnostics`
- Emits: `commerce.payment.confirming`, `commerce.payment.confirmed`, `commerce.payment.finalized`, `commerce.payment.reorged`, `commerce.payment.failed`
- Consumes: `commerce.payment.claimed`, `commerce.payment.acknowledged`, `commerce.payment.expired`, `commerce.deal.cancelled`, `privacy.deletion.completed`

## Dependencies

F09.S01.M01, F09.S03.M01, F09.S03.M03, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-FLG-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-068-01 | [Domain schema](domain_schema.md) | 5 |
| PS-068-02 | [Validation rules](validation_rules.md) | 5 |
| PS-068-03 | [Workflow state machine](workflow_state_machine.md) | 9 |
| PS-068-04 | [Commands, queries and events](commands_queries_events.md) | 6 |
| PS-068-05 | [Authorization and capabilities](authorization_capabilities.md) | 4 |
| PS-068-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-068-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 7 |
| PS-068-08 | [Observability and performance](observability_performance.md) | 4 |
| PS-068-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-068-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/commerce/src/payments/crypto/index.ts`.

## Acceptance criteria

- All tests T01 to T32 pass in CI.
- With no verifier configured, no crypto claim ever leaves claimed.
- Recognizable secret formats (WIF, xprv, BIP39 phrases) are rejected before storage or logging, and a value in txid format is never signed into a claim or sent to the payee until a verifier found it on chain or the payer attested it is a public transaction ID; the residual risk that the lookup discloses a mistyped key to the user's chosen verifier is stated in the UI.
- final is set only when the finality policy is met; a reorg before final is always visible, and a reorg after final raises a deep-reorg alert without regressing state.
- No transaction that does not match its request ever produces a confirming label.
- Crypto observation status is per vault and labelled according to that vault's verifier, and crypto-driven completion converges through the payee's signed chain acknowledgement.
