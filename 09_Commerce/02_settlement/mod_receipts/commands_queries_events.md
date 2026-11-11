# PS-071-04 — Commands, queries and events: Receipts

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S02.M01 Receipts](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/settlement/receipts` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-071-04.R01** Issue is a vault command that produces the signed statement classrup.commerce.receipt/v1; ingest is a vault command for received statements; verify and export are vault queries; no relay command exists.
- **PS-071-04.R02** Issue and ingest emit commerce.receipt.issued into the vault outbox in the same IndexedDB transaction as the insert.
- **PS-071-04.R03** The module consumes claim and key-revocation events to prompt for receipts and to update key status.
- **PS-071-04.R04** classrup.commerce.receipt/v1 (signer - the claim payer for payer_asserts_paid, the claim payee for payee_asserts_received, through a device key linked to that principal) is registered with the F09.S01.M01 ingest dispatcher through StatementHandlerPort, which hands it to commerce.receipt.ingest with cid deduplication, quarantine reasons and block filtering.
- **PS-071-04.R05** The verify output names both the device key that signed and the principal it is linked to, with partyBinding, keyStatus and the trusted receipt time used, and its label never shows Valid together with 'revoked later' on the strength of signedAt.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `commerce.receipt.issue` | commerce.receipt.issue | [vault command, produces signed statement classrup.commerce.receipt/v1 under F16.S02.M03 context classrup/receipt/v1] { claimId, statementType, text? } | { receiptId, receiptCid, signerId, signingKeyId, signedAt, peerSync } | VALIDATION_FAILED, NOT_FOUND, FORBIDDEN, CONFLICT_STATE, BLOCKED_PARTY, COMMERCE_RECEIPT_ROLE, COMMERCE_RECEIPT_MISMATCH, COMMERCE_RECEIPT_SKEW | commerce.receipt.issued | yes (Idempotency-Key) |
| `commerce.receipt.ingest` | commerce.receipt.ingest | [vault command, internal; dispatched by F09.S01.M01 commerce.statement.ingest] { envelope: signed classrup.commerce.receipt/v1, relayReceipt? } | { outcome: stored\|quarantined\|duplicate\|dropped, reason?: signer_not_party\|party_unbound\|key_revoked\|signature_invalid\|claim_unknown\|blocked } | VALIDATION_FAILED, COMMERCE_RECEIPT_SIGNATURE_INVALID, COMMERCE_RECEIPT_ROLE, COMMERCE_RECEIPT_MISMATCH, COMMERCE_RECEIPT_PARTY_UNBOUND, COMMERCE_RECEIPT_KEY_REVOKED, UNSUPPORTED_SCHEMA_VERSION | commerce.receipt.issued | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `commerce.receipt.verify` | commerce.receipt.read | { receiptId } or { file: classrup-receipt/v1 JSON, ≤ 16 KiB } | { result: valid\|invalid, reasons[], signerId (principal), signingKeyId (device key), partyBinding: verified\|unverified, signedAt (signer's claim), keyStatus: active\|revoked_before_receipt\|revoked_after_receipt\|revoked_receipt_time_unknown\|unknown, trustedReceiptTime?, label } | VALIDATION_FAILED, NOT_FOUND, PAYLOAD_TOO_LARGE |
| `commerce.receipt.export` | commerce.receipt.read | { receiptId } | { file: classrup-receipt/v1 JSON with keyLink chain, sizeBytes ≤ 8192 } | NOT_FOUND |
| `commerce.receipt.list_for_claim` | commerce.receipt.read | { claimId } | { items: Receipt[] } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `commerce.receipt.issued` | P2 | { receiptId, claimId, dealId, statementType, signerId, signingKeyId, parties[{did, role}], partyBinding, provenance: local\|peer } |

### Events consumed

| Type | Effect |
|---|---|
| `commerce.payment.acknowledged` | for external (non-cash) claims offer an optional receipt to both parties; the cash receipt prompt is owned by F09.S01.M02, which calls commerce.receipt.issue; no automatic signing ever occurs |
| `commerce.payment.finalized` | prompt the payee to sign a payee_asserts_received receipt for the final crypto claim |
| `identity.device_key.revoked` | record the revocation's effective-from time for that key and recompute keyStatus of stored receipts from their trusted receipt time - revoked_before_receipt, revoked_after_receipt or revoked_receipt_time_unknown - never from signedAt |
| `privacy.deletion.completed` | through the DeletionPort plan, replace signerId display with the per-deletion pseudonym in retained receipts and mark signatures unverifiable-after-pseudonymization |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| COMMERCE_RECEIPT_ROLE | 403 | no | signer role does not allow this statement for the claim status |
| COMMERCE_RECEIPT_MISMATCH | 422 | no | statement does not match the claim cid, amount or currency |
| COMMERCE_RECEIPT_SIGNATURE_INVALID | 422 | no | signature, context or signer key encoding is invalid |
| COMMERCE_RECEIPT_SKEW | 422 | no | signedAt is too far in the future of the local clock |
| COMMERCE_RECEIPT_PARTY_UNBOUND | 422 | no | the signing device key is not linked to the claim party by a verified device-link chain |
| COMMERCE_RECEIPT_KEY_REVOKED | 422 | no | the signing key was revoked before this vault (or a named relay) received the receipt |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statement registry (N2, registered in F11.S01.M01): classrup.commerce.receipt/v1 - signer role is the claim payer for payer_asserts_paid and the claim payee for payee_asserts_received; the signing device key must be linked to that principal by a root-signed classrup.identity.device_link/v1 chain. Signing and verification use the F16.S02.M03 envelope classrup.security.envelope/v1 with context classrup/receipt/v1 and its verifier receipt time; this module supplies as receipt time the local receivedAt or a relay-signed receipt time (labelled 'according to relay <name>'). The type is registered with the F09.S01.M01 ingest dispatcher through StatementHandlerPort. Labels - valid and bound 'Valid for <party>'; party unbound 'Signature valid - party not proven'; revoked_before_receipt 'Key revoked before this receipt arrived'; revoked_after_receipt 'Key revoked after this receipt arrived'; revoked_receipt_time_unknown 'Key revoked; signing time unverifiable'.

### Example

```
vault command commerce.receipt.issue (payee vault)
{ "claimId": "0192f3a7-…", "statementType": "payee_asserts_received", "text": "Received EUR 45.00 in cash at the station." }
=> { "receiptId": "0192f3aa-…", "receiptCid": "sha256-77de…", "signerId": "did:key:z6MkSeller…", "signingKeyId": "kid-orbit-maple…", "signedAt": "2026-11-04T10:20:00.000Z", "peerSync": "prepared" }
exported file: { "format": "classrup-receipt/v1", "claimId": "0192f3a7-…", "statement": { … }, "signerId": "did:key:z6MkSeller…",
  "signingKeyId": "kid-orbit-maple…", "keyLink": { "chain": [ { "type": "classrup.identity.device_link/v1", … } ] }, "signedAt": "…", "sig": "…" }
verify of that file offline => { "result": "valid", "partyBinding": "verified", "keyStatus": "active", "label": "Valid for seller" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-071-09.T05 | contract | PS-071-04.R01, PS-071-04.R02, PS-071-09.R02 | execute issue, ingest, verify and export | outputs and events validate against registry schemas; commerce.receipt.issued carries parties with roles |
| TEST-PS-071-09.T06 | integration | PS-071-04.R03, PS-071-09.R03 | identity.device_key.revoked with effective-from after the stored receipt's receivedAt, delivered twice | keyStatus revoked_after_receipt set once from receivedAt and the effective-from time, not from signedAt; receipt still listed |
| TEST-PS-071-09.T16 | abuse | PS-071-01.R05, PS-071-02.R04, PS-071-04.R05 | a receipt signed with a key revoked at 09:00 and signedAt backdated to 08:00 arrives at 10:00; the same file verified offline with no trusted receipt time; a receipt with a relay-signed receipt time of 08:30 | first reads revoked_before_receipt and is quarantined with COMMERCE_RECEIPT_KEY_REVOKED, never Valid; second reads 'key revoked; signing time unverifiable'; third reads revoked_after_receipt labelled 'according to relay <name>' |
| TEST-PS-071-09.T18 | integration | PS-071-01.R04, PS-071-04.R05 | export a receipt and verify the file on a device with no network and no vault | result names the signing device key and the principal it is linked to, partyBinding verified, file ≤ 8 KiB |
| TEST-PS-071-09.T19 | integration | PS-071-04.R04 | receipt delivered through F09.S01.M01 commerce.statement.ingest, then the same envelope again | dispatched once to commerce.receipt.ingest and stored; duplicate is a no-op |

## Dependencies

Module depends on: F09.S01.M01, F09.S03.M03, F07.S01.M01, F07.S02.M01, F07.S02.M02, F16.S02.M03, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
