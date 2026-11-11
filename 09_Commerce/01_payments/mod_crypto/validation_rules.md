# PS-068-02 — Validation rules: Crypto payments

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M03 Crypto payments](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/crypto` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-068-02.R01** Request input is validated strictly, including address format and checksum for the chain and the asset registry binding.
- **PS-068-02.R02** Any free-text or reference field is scanned for private key, seed phrase and extended private key patterns and rejected before storage or logging.
- **PS-068-02.R03** Observation results are validated by amount, destination, asset and chain before any state advances.
- **PS-068-02.R04** A raw 64-hex private key has the same format as a txid, so before a crypto claim is signed or sent its txid is looked up through the configured verifier and the claim stays local and unsent until it is found; with no verifier the payer must confirm 'this is a public transaction ID, never a key', and the residual risk that the lookup itself discloses a mistyped key to the chosen verifier is stated in the UI.
- **PS-068-02.R05** An address already used by another open or claimed request in the vault is refused, and a transaction included at or below the request's chainTipAtCreation counts as before_request and never matches.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | chainId is enabled in the vault and asset belongs to that chain in the registry | COMMERCE_CRYPTO_CHAIN_DISABLED |
| V02 | address is valid for the chain, mainnet only, with EIP-55 checksum when mixed case | COMMERCE_CRYPTO_ADDRESS_INVALID |
| V03 | amount is positive and within 38 digits in the asset's minor units | VALIDATION_FAILED |
| V04 | txid format is valid for the chain | COMMERCE_CRYPTO_TXID_INVALID |
| V05 | no field contains a WIF key, xprv or xpub-private form, hex of 64 characters labelled key, or a 12/15/18/21/24-word BIP39 phrase | COMMERCE_CRYPTO_SECRET_REJECTED |
| V06 | actor is the obligation payee when creating or cancelling a request | FORBIDDEN |
| V07 | request is open, or claimed with an uncovered remainder, and not expired when a claim references it, and the claim amount is at most the uncovered remainder | COMMERCE_CRYPTO_REQUEST_NOT_OPEN |
| V08 | request is not claimed when cancelling | CONFLICT_STATE |
| V09 | the same txid is not already attached to another claim in this vault | COMMERCE_CRYPTO_TX_REUSED |
| V10 | at most 3 manual refreshes per observation per minute | RATE_LIMITED |
| V11 | the receiving address is not used by another open or claimed request in this vault | COMMERCE_CRYPTO_ADDRESS_REUSED |
| V12 | with a verifier configured the txid was found on chain before the claim is signed and sent; without one txidAttested is true | COMMERCE_CLAIM_METHOD_RULE |
| V13 | an ingested crypto_request or crypto_request_cancel is signed by the obligation payee and its address is valid for the chain | COMMERCE_STATEMENT_INVALID |
| V14 | the request's asset descriptor equals the local CurrencyDef (F09.S03.M01) | COMMERCE_CURRENCY_MISMATCH |
| V15 | verifier lookups run only when privacy.consent.check grants purpose chain_lookup for the endpoint, and carry no DID, device-key signature, relay access token or cookie | PRECONDITION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-068-09.T01 | unit | PS-068-01.R01, PS-068-01.R02, PS-068-02.R01 | create a request with valid and invalid addresses for each chain | valid request stored and signed; invalid returns COMMERCE_CRYPTO_ADDRESS_INVALID |
| TEST-PS-068-09.T02 | unit | PS-068-01.R03, PS-068-02.R02, PS-068-07.R02 | inputs with a WIF key, an xprv string, and a 12-word phrase in note and txRef | COMMERCE_CRYPTO_SECRET_REJECTED, nothing stored or logged |
| TEST-PS-068-09.T03 | unit | PS-068-02.R03, PS-068-03.R02 | no verifier configured and a crypto claim made | claim stays claimed, verification.source self, no observation, COMMERCE_CRYPTO_NO_VERIFIER on refresh |
| TEST-PS-068-09.T04 | integration | PS-068-02.R03, PS-068-03.R05 | underpaid, wrong address, wrong token contract and reverted transactions | matchResult recorded; no commerce.payment.confirming emitted; commerce.payment.failed with the matching reason; claim never confirmed |
| TEST-PS-068-09.T18 | unit | PS-068-02.R04, PS-068-04.R06 | with a verifier configured, claim with a 0x plus 64-hex value the verifier never finds, then with a real txid; without a verifier, claim without and with txidAttested | first held with sendHold txid_lookup_pending, never signed into a claim or sent to the payee, discarded after 24 h; real txid released and sent; without verifier refused with COMMERCE_CLAIM_METHOD_RULE until attested |
| TEST-PS-068-09.T19 | integration | PS-068-03.R05, PS-068-02.R03 | each matchResult underpaid, wrong_address, wrong_asset, before_request and reverted, from watching, pending and reorged | observation mismatched or failed; commerce.payment.failed carries the reason; label 'transaction does not match request'; no confirming event |
| TEST-PS-068-09.T24 | abuse | PS-068-01.R04, PS-068-02.R05, PS-068-07.R05 | a transaction to a reused address included before chainTipAtCreation is claimed for a new request; payee creates a second open request with an address still in use | claim fails with before_request; second request refused with COMMERCE_CRYPTO_ADDRESS_REUSED |

## Dependencies

Module depends on: F09.S01.M01, F09.S03.M01, F09.S03.M03, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
