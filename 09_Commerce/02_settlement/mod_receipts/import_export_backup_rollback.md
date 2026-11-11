# PS-071-10 — Import, export, backup and rollback: Receipts

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S02.M01 Receipts](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/settlement/receipts` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-071-10.R01** The vault export contains the principal's receipts with signatures in the section commerce.receipts.
- **PS-071-10.R02** Import re-verifies every signature and quarantines receipts that fail or whose signer is not a party of an imported claim.
- **PS-071-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** ExportSectionPort section commerce.receipts in classrup-export/v1; one line per Receipt (schema classrup.commerce.receipt/v1) with its keyLink chain; single receipts also export as classrup-receipt/v1 files.
- **import:** Receipts import as read-only evidence after signature, party-binding and key-status re-verification; the import time is not a trusted receipt time for earlier revocations, so revoked keys without a stored receivedAt read revoked_receipt_time_unknown; failures go to quarantine with reason.
- **backup:** The vault export is the primary backup (IOX-6); relays hold only ciphertext envelopes of receipts in transit.
- **migration rollback:** Signed bytes are never rewritten by a migration; the F16.S02.M03 header signed bytes JCS({v, ctx, kid, alg, signedAt, payloadHash}) are the only receipt signature format in v1; signingKeyId and keyLink are additive, and v1 receipts signed before this change keep their stored device did as signingKeyId with partyBinding recomputed; rollback is safe because older readers ignore unknown optional fields.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-071-09.T15 | integration | PS-071-10.R01, PS-071-10.R02, PS-071-10.R03 | export vault, import to fresh vault with one tampered receipt, roll back one release | valid receipts round-trip; tampered one quarantined; v1 readable |

## Dependencies

Module depends on: F09.S01.M01, F09.S03.M03, F07.S01.M01, F07.S02.M01, F07.S02.M02, F16.S02.M03, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
