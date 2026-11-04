# PS-068-02 — Validation rules: Crypto payments

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M03 Crypto payments](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/crypto` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-068-02.R01** Request input is validated strictly, including address format and checksum for the chain and the asset registry binding.
- **PS-068-02.R02** Any free-text or reference field is scanned for private key, seed phrase and extended private key patterns and rejected before storage or logging.
- **PS-068-02.R03** Observation results are validated by amount, destination, asset and chain before any state advances.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | chainId is enabled in the vault and asset belongs to that chain in the registry | COMMERCE_CRYPTO_CHAIN_DISABLED |
| V02 | address is valid for the chain, mainnet only, with EIP-55 checksum when mixed case | COMMERCE_CRYPTO_ADDRESS_INVALID |
| V03 | amount is positive and within 38 digits in the asset's minor units | VALIDATION_FAILED |
| V04 | txid format is valid for the chain | COMMERCE_CRYPTO_TXID_INVALID |
| V05 | no field contains a WIF key, xprv or xpub-private form, hex of 64 characters labelled key, or a 12/15/18/21/24-word BIP39 phrase | COMMERCE_CRYPTO_SECRET_REJECTED |
| V06 | actor is the obligation payee when creating or cancelling a request | FORBIDDEN |
| V07 | request is open and not expired when a claim references it | COMMERCE_CRYPTO_REQUEST_NOT_OPEN |
| V08 | request is not claimed when cancelling | CONFLICT_STATE |
| V09 | the same txid is not already attached to another claim in this vault | COMMERCE_CRYPTO_TX_REUSED |
| V10 | at most 3 manual refreshes per observation per minute | RATE_LIMITED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-068-09.T01 | unit | PS-068-01.R01, PS-068-01.R02, PS-068-02.R01 | create a request with valid and invalid addresses for each chain | valid request stored and signed; invalid returns COMMERCE_CRYPTO_ADDRESS_INVALID |
| TEST-PS-068-09.T02 | unit | PS-068-01.R03, PS-068-02.R02 | inputs with a WIF key, an xprv string, and a 12-word phrase in note and txRef | COMMERCE_CRYPTO_SECRET_REJECTED, nothing stored or logged |
| TEST-PS-068-09.T03 | unit | PS-068-02.R03, PS-068-03.R02 | no verifier configured and a crypto claim made | claim stays claimed, verification.source self, no observation, COMMERCE_CRYPTO_NO_VERIFIER on refresh |
| TEST-PS-068-09.T04 | integration | PS-068-02.R03 | underpaid, wrong address, wrong token contract and reverted transactions | matchResult recorded; claim never confirmed |

## Dependencies

Module depends on: F09.S01.M01, F09.S03.M01, F09.S03.M03, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
