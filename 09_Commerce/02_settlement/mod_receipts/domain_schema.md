# PS-071-01 — Domain schema: Receipts

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S02.M01 Receipts](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/settlement/receipts` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-071-01.R01** A Receipt stores claimId, dealId, statement type, canonical statement body, signerId, role, signedAt (the signer's claim), local receivedAt, signature and receipt cid, matching COM-6.
- **PS-071-01.R02** Receipts are P2, retained as RET-EVIDENCE, and immutable once created; corrections are new receipts.
- **PS-071-01.R03** The statement body binds the claim cid, amount and currency so a receipt cannot be moved to another claim.

## Specification

### Receipt

Schema `classrup.commerce.receipt/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| vaultId | uuidv7 — local vault scope (CTR-ID-001 tenant slot) |
| claimId | uuidv7 — ref F09.S01.M01 PaymentClaim |
| dealId | uuid — ref F09.S01.M01 Deal |
| statementType | enum — payer_asserts_paid \| payee_asserts_received |
| statement | object — {claimCid, amount: Money, method, text?: ≤ 280 code points} canonicalized with JCS |
| signerId | did — did:key of the signing device key (or per-deletion pseudonym after deletion) |
| signerRole | enum — payer \| payee |
| signedAt | timestamp — signer's claimed time, RFC 3339 UTC |
| receivedAt | timestamp — local clock when stored |
| sig | string — base64url Ed25519 over JCS of the receipt without sig, with prefix classrup-receipt:v1 |
| receiptCid | string — sha256 of the signed receipt |
| verification | object — {checkedAt, result: valid\|invalid, keyRevokedAt?: claimed time, provenance: local\|peer} |
| peerSync | string — local_committed \| prepared \| transport_acknowledged \| peer_accepted \| not_applicable |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- One receipt per (claimId, signerId, statementType).
- signerRole matches the signer's role in the claim (payer or payee).
- sig verifies over the stored bytes at the time of storage, or the row is quarantined and not stored as a Receipt.

### Storage DDL

```sql
CREATE TABLE commerce_receipt (
  id TEXT PRIMARY KEY, vault_id TEXT NOT NULL, claim_id TEXT NOT NULL, deal_id TEXT NOT NULL,
  statement_type TEXT NOT NULL, signer_id TEXT NOT NULL, received_at TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX commerce_receipt_unique ON commerce_receipt(vault_id, claim_id, signer_id, statement_type);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-071-09.T01 | unit | PS-071-01.R01, PS-071-01.R03, PS-071-02.R03 | sign a payee receipt, then flip one byte of statement text | original verifies valid; edited copy fails with COMMERCE_RECEIPT_SIGNATURE_INVALID |
| TEST-PS-071-09.T03 | unit | PS-071-01.R02, PS-071-03.R01, PS-071-03.R03 | attempt edit or delete via API and re-run verify after claim expiry | no edit path exists; verification result recomputed and receipt retained |
| TEST-PS-071-09.T04 | unit | PS-071-01.R03, PS-071-02.R03 | receipt for claim X replayed against claim Y | COMMERCE_RECEIPT_MISMATCH |

## Dependencies

Module depends on: F09.S01.M01, F09.S03.M03, F07.S01.M01, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-IOX-001. Predecessor: [module SPEC](SPEC.md).
