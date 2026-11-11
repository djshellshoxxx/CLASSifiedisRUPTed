# PS-071-01 — Domain schema: Receipts

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S02.M01 Receipts](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/settlement/receipts` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-071-01.R01** A Receipt stores claimId, dealId, statement type, canonical statement body, signerId, role, signedAt (the signer's claim), local receivedAt, signature and receipt cid, matching COM-6.
- **PS-071-01.R02** Receipts are P2, retained as RET-EVIDENCE, and immutable once created; corrections are new receipts.
- **PS-071-01.R03** The statement body binds the claim cid, amount and currency so a receipt cannot be moved to another claim.
- **PS-071-01.R04** signerId is the principal DID of the Deal party and signingKeyId names the device key that signed; the receipt embeds the device-link chain (root-signed classrup.identity.device_link/v1 statements) or an identity-document snapshot, so offline verification can link the key to the principal.
- **PS-071-01.R05** Key status is stored with the trusted receipt time it was derived from - local receivedAt, or a relay-signed receipt time labelled as that relay's evidence - and the revocation's effective-from time; signedAt is never used for key status.

## Specification

### Receipt

Schema `classrup.commerce.receipt/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| vaultId | uuidv7 — local vault scope (CTR-ID-001 tenant slot) |
| claimId | uuidv7 — ref F09.S01.M01 PaymentClaim |
| dealId | uuid — ref F09.S01.M01 Deal (UUIDv8) |
| statementType | enum — payer_asserts_paid \| payee_asserts_received |
| statement | object — {claimCid, amount: Money, method, text?: ≤ 280 code points} canonicalized with JCS |
| signerId | did — principal DID of the signing party as named in the Deal (or per-deletion pseudonym after deletion) |
| signingKeyId | string — F16.S02.M03 signer key ID of the device key that signed |
| keyLink | object — {deviceLinkCids[], chain: root-signed classrup.identity.device_link/v1 envelopes, or identityDocSnapshot: classrup.identity.portable_doc/v1} |
| signerRole | enum — payer \| payee |
| signedAt | timestamp — signer's claimed time, RFC 3339 UTC; never used for key status |
| receivedAt | timestamp — local clock when stored |
| relayReceipt? | object — {relayId, at, sig} relay-signed receipt time; evidence only of that relay's clock |
| sig | string — base64url Ed25519 by signingKeyId in a classrup.security.envelope/v1 with context classrup/receipt/v1 (F16.S02.M03) |
| receiptCid | string — sha256 of the signed receipt |
| verification | object — {checkedAt, result: valid\|invalid, partyBinding: verified\|unverified, keyStatus: active\|revoked_before_receipt\|revoked_after_receipt\|revoked_receipt_time_unknown\|unknown, trustedReceiptTime?: {source: local\|relay, at, relayId?}, revocationEffectiveFrom?, provenance: local\|peer} |
| peerSync | string — local_committed \| prepared \| transport_acknowledged \| peer_accepted \| not_applicable |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- One receipt per (claimId, signerId, statementType).
- signerRole matches the signer's role in the claim (payer or payee).
- sig verifies over the stored bytes at the time of storage, or the row is quarantined and not stored as a Receipt.
- A receipt is presented as valid for a party only when the signature verifies, partyBinding is verified and keyStatus is active or revoked_after_receipt.
- keyStatus is derived only from trustedReceiptTime and revocationEffectiveFrom, never from signedAt.

### Storage DDL

```sql
CREATE TABLE commerce_receipt (
  id TEXT PRIMARY KEY, vault_id TEXT NOT NULL, claim_id TEXT NOT NULL, deal_id TEXT NOT NULL,
  statement_type TEXT NOT NULL, signer_id TEXT NOT NULL, signing_key_id TEXT NOT NULL, received_at TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX commerce_receipt_unique ON commerce_receipt(vault_id, claim_id, signer_id, statement_type);
CREATE INDEX commerce_receipt_key ON commerce_receipt(vault_id, signing_key_id);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-071-09.T01 | unit | PS-071-01.R01, PS-071-01.R03, PS-071-02.R03, PS-071-09.R03 | sign a payee receipt, then flip one byte of statement text | original verifies valid; edited copy fails with COMMERCE_RECEIPT_SIGNATURE_INVALID |
| TEST-PS-071-09.T03 | unit | PS-071-01.R02, PS-071-03.R01, PS-071-03.R03 | attempt edit or delete via API and re-run verify after claim expiry | no edit path exists; verification result recomputed and receipt retained |
| TEST-PS-071-09.T04 | unit | PS-071-01.R03, PS-071-02.R03, PS-071-09.R03 | receipt for claim X replayed against claim Y | COMMERCE_RECEIPT_MISMATCH |
| TEST-PS-071-09.T16 | abuse | PS-071-01.R05, PS-071-02.R04, PS-071-04.R05 | a receipt signed with a key revoked at 09:00 and signedAt backdated to 08:00 arrives at 10:00; the same file verified offline with no trusted receipt time; a receipt with a relay-signed receipt time of 08:30 | first reads revoked_before_receipt and is quarantined with COMMERCE_RECEIPT_KEY_REVOKED, never Valid; second reads 'key revoked; signing time unverifiable'; third reads revoked_after_receipt labelled 'according to relay <name>' |
| TEST-PS-071-09.T17 | abuse | PS-071-01.R04, PS-071-02.R04 | file signed by a self-generated key with no device-link chain to the payee, and one whose chain links to a different principal | signature valid but partyBinding unverified, label 'Signature valid - party not proven'; ingest quarantines with party_unbound (COMMERCE_RECEIPT_PARTY_UNBOUND) |
| TEST-PS-071-09.T18 | integration | PS-071-01.R04, PS-071-04.R05 | export a receipt and verify the file on a device with no network and no vault | result names the signing device key and the principal it is linked to, partyBinding verified, file ≤ 8 KiB |

## Dependencies

Module depends on: F09.S01.M01, F09.S03.M03, F07.S01.M01, F07.S02.M01, F07.S02.M02, F16.S02.M03, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-IOX-001. Predecessor: [module SPEC](SPEC.md).
