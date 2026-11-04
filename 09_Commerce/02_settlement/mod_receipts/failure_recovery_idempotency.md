# PS-071-06 — Failure recovery and idempotency: Receipts

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S02.M01 Receipts](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/settlement/receipts` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-071-06.R01** Issue is idempotent per CTR-IDM-001 using vault command IDs and unique (claim, signer, type).
- **PS-071-06.R02** Signing and storing are one local transaction so there is no signed-but-unstored receipt.
- **PS-071-06.R03** Delivery uses the sync outbox; the UI never claims the counterparty has the receipt before peer_accepted.

## Specification

- **idempotency:** Vault command ID recorded for 24 h; receipts deduplicated by receiptCid; unique index on (claim, signer, type).
- **concurrency:** Unique index serializes two tabs signing the same receipt; one wins and the other gets CONFLICT_STATE. No cross-vault lock is needed because each party signs independently.
- **retries:** Sync outbox retry 5 s, 30 s, 5 min, 1 h, then every 6 h for 14 days.
- **offline:** Signing works offline with the local key; delivery waits in the outbox and shows prepared.
- **partial failure:** If delivery fails after signing, the receipt exists locally and the user can export it as a file and send it by any channel; nothing is rolled back.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-071-09.T08 | integration | PS-071-06.R01, PS-071-06.R02, PS-071-06.R03 | two tabs sign simultaneously; delivery fails after signing | one receipt; export still possible; UI shows prepared |

## Dependencies

Module depends on: F09.S01.M01, F09.S03.M03, F07.S01.M01, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
