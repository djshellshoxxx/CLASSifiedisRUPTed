# PS-071-04 — Commands, queries and events: Receipts

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S02.M01 Receipts](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/settlement/receipts` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-071-04.R01** Issue is a vault command that produces the signed statement classrup.commerce.receipt/v1; ingest is a vault command for received statements; verify and export are vault queries; no relay command exists.
- **PS-071-04.R02** Issue and ingest emit commerce.receipt.issued into the vault outbox in the same IndexedDB transaction as the insert.
- **PS-071-04.R03** The module consumes claim and key-revocation events to prompt for receipts and to update key status.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `commerce.receipt.issue` | commerce.receipt.issue | [vault command, produces signed statement classrup.commerce.receipt/v1] { claimId, statementType, text? } | { receiptId, receiptCid, signedAt, peerSync } | VALIDATION_FAILED, NOT_FOUND, FORBIDDEN, CONFLICT_STATE, COMMERCE_RECEIPT_ROLE, COMMERCE_RECEIPT_MISMATCH, COMMERCE_RECEIPT_SKEW | commerce.receipt.issued | yes (Idempotency-Key) |
| `commerce.receipt.ingest` | commerce.receipt.ingest | [vault command, internal] { envelope: signed classrup.commerce.receipt/v1 } | { outcome: stored\|quarantined\|duplicate, reason? } | VALIDATION_FAILED, COMMERCE_RECEIPT_SIGNATURE_INVALID, COMMERCE_RECEIPT_ROLE, COMMERCE_RECEIPT_MISMATCH, UNSUPPORTED_SCHEMA_VERSION | commerce.receipt.issued | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `commerce.receipt.verify` | commerce.receipt.read | { receiptId } or { file: classrup-receipt/v1 JSON, ≤ 8 KiB } | { result: valid\|invalid, reasons[], signerId, signedAt, keyStatus: ok\|revoked_later\|unknown } | VALIDATION_FAILED, NOT_FOUND, PAYLOAD_TOO_LARGE |
| `commerce.receipt.export` | commerce.receipt.read | { receiptId } | { file: classrup-receipt/v1 JSON, sizeBytes ≤ 4096 } | NOT_FOUND |
| `commerce.receipt.list_for_claim` | commerce.receipt.read | { claimId } | { items: Receipt[] } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `commerce.receipt.issued` | P2 | { receiptId, claimId, dealId, statementType, signerId, provenance: local\|peer } |

### Events consumed

| Type | Effect |
|---|---|
| `commerce.payment.acknowledged` | if the payee's cash terms require receipts, prompt both parties to sign; no automatic signing ever occurs |
| `commerce.payment.finalized` | prompt the payee to sign a payee_asserts_received receipt for the final crypto claim |
| `identity.device_key.revoked` | update keyStatus of stored receipts signed by that key to revoked_later with the revocation time claimed by the signer |
| `privacy.deletion.completed` | replace signerId display with the per-deletion pseudonym in retained receipts and mark signatures unverifiable-after-pseudonymization |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| COMMERCE_RECEIPT_ROLE | 403 | no | signer role does not allow this statement for the claim status |
| COMMERCE_RECEIPT_MISMATCH | 422 | no | statement does not match the claim cid, amount or currency |
| COMMERCE_RECEIPT_SIGNATURE_INVALID | 422 | no | signature or signer key encoding is invalid |
| COMMERCE_RECEIPT_SKEW | 422 | no | signedAt is too far in the future of the local clock |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command commerce.receipt.issue (payee vault)
{ "claimId": "0192f3a7-…", "statementType": "payee_asserts_received", "text": "Received EUR 45.00 in cash at the station." }
=> { "receiptId": "0192f3aa-…", "receiptCid": "sha256-77de…", "signedAt": "2026-11-04T10:20:00.000Z", "peerSync": "prepared" }
exported file: { "format": "classrup-receipt/v1", "claimId": "0192f3a7-…", "statement": { … }, "signerId": "did:key:z6Mk…", "signedAt": "…", "sig": "…" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-071-09.T05 | contract | PS-071-04.R01, PS-071-04.R02, PS-071-09.R02 | execute issue, ingest, verify and export | outputs and events validate against registry schemas |
| TEST-PS-071-09.T06 | integration | PS-071-04.R03 | identity.device_key.revoked delivered twice | keyStatus revoked_later set once and receipt still listed |

## Dependencies

Module depends on: F09.S01.M01, F09.S03.M03, F07.S01.M01, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
