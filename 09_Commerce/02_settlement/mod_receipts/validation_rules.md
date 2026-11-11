# PS-071-02 — Validation rules: Receipts

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S02.M01 Receipts](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/settlement/receipts` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-071-02.R01** Receipt input is validated strictly; unknown fields are rejected with VALIDATION_FAILED.
- **PS-071-02.R02** Role and claim-state rules check that the signer is a party and that the claim status supports the assertion.
- **PS-071-02.R03** Signature verification is exact, so any byte change in the canonical content invalidates the receipt.
- **PS-071-02.R04** Verification is delegated to F16.S02.M03 with expected context classrup/receipt/v1 and a key registry snapshot, party binding is checked through the embedded device-link chain against F07.S01.M01 and F07.S02.M01, and a key revoked before the trusted receipt time is refused at ingest.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | claim exists in this vault and signer is a party of its Deal | NOT_FOUND |
| V02 | payer_asserts_paid requires the signer to be the claim payer and claim status not expired; payee_asserts_received requires the payee and claim status acknowledged, confirmed or final | COMMERCE_RECEIPT_ROLE |
| V03 | statement.claimCid, amount and currency equal the stored claim | COMMERCE_RECEIPT_MISMATCH |
| V04 | text at most 280 code points, plain text | VALIDATION_FAILED |
| V05 | signature is valid Ed25519 under F16.S02.M03 expected context classrup/receipt/v1 and signingKeyId is a valid device key ID | COMMERCE_RECEIPT_SIGNATURE_INVALID |
| V06 | no receipt of the same type by the same signer exists for the claim | CONFLICT_STATE |
| V07 | signedAt is not more than 10 minutes in the future of the local clock | COMMERCE_RECEIPT_SKEW |
| V08 | signingKeyId is linked to signerId by a verified root-signed device-link chain or identity-document snapshot, and signerId is the claim party for the role; otherwise partyBinding is unverified and ingest quarantines with reason party_unbound | COMMERCE_RECEIPT_PARTY_UNBOUND |
| V09 | the signing key was not revoked with an effective-from time before the trusted receipt time (local receivedAt or a relay-signed receipt time) | COMMERCE_RECEIPT_KEY_REVOKED |
| V10 | neither party has blocked the other (F07.S02.M02 isBlockedEither); issue returns BLOCKED_PARTY and ingest drops receipts from a blocked did silently unless the claim's Deal has an open dispute case | BLOCKED_PARTY |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-071-09.T01 | unit | PS-071-01.R01, PS-071-01.R03, PS-071-02.R03, PS-071-09.R03 | sign a payee receipt, then flip one byte of statement text | original verifies valid; edited copy fails with COMMERCE_RECEIPT_SIGNATURE_INVALID |
| TEST-PS-071-09.T02 | unit | PS-071-02.R01, PS-071-02.R02 | rules V01 to V10 violated in turn | documented error code returned and nothing stored |
| TEST-PS-071-09.T04 | unit | PS-071-01.R03, PS-071-02.R03, PS-071-09.R03 | receipt for claim X replayed against claim Y | COMMERCE_RECEIPT_MISMATCH |
| TEST-PS-071-09.T16 | abuse | PS-071-01.R05, PS-071-02.R04, PS-071-04.R05 | a receipt signed with a key revoked at 09:00 and signedAt backdated to 08:00 arrives at 10:00; the same file verified offline with no trusted receipt time; a receipt with a relay-signed receipt time of 08:30 | first reads revoked_before_receipt and is quarantined with COMMERCE_RECEIPT_KEY_REVOKED, never Valid; second reads 'key revoked; signing time unverifiable'; third reads revoked_after_receipt labelled 'according to relay <name>' |
| TEST-PS-071-09.T17 | abuse | PS-071-01.R04, PS-071-02.R04 | file signed by a self-generated key with no device-link chain to the payee, and one whose chain links to a different principal | signature valid but partyBinding unverified, label 'Signature valid - party not proven'; ingest quarantines with party_unbound (COMMERCE_RECEIPT_PARTY_UNBOUND) |

## Dependencies

Module depends on: F09.S01.M01, F09.S03.M03, F07.S01.M01, F07.S02.M01, F07.S02.M02, F16.S02.M03, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
