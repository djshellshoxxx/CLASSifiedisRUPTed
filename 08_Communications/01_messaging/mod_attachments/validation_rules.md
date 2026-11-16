# PS-059-02 — Validation rules: Message attachments

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M03 Message attachments](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/attachments` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-059-02.R01** Slot requests and uploads are validated against declared limits before any bytes are accepted.
- **PS-059-02.R02** Finalization verifies stored length and hash against the declared values before the blob becomes downloadable.
- **PS-059-02.R03** Every violation maps to one stable error code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | declaredType is one of image/jpeg, image/png, image/webp | COMMS_ATTACHMENT_TYPE_UNSUPPORTED |
| V02 | plainSize between 1 and 5 242 880 and chunkCount equals ceil(plainSize / 65 536) | COMMS_ATTACHMENT_TOO_LARGE |
| V03 | in the vault the thread exists, is active and the sender is a participant; at the relay the caller holds a valid relay access token | NOT_FOUND |
| V04 | uploader has fewer than 3 pending slots and used less than 50 MiB of ciphertext in the last 24 h | COMMS_ATTACHMENT_QUOTA |
| V05 | each uploaded chunk has index within range, length 65 536 plus 16 (last chunk shorter) and arrives within the slot lifetime | VALIDATION_FAILED |
| V06 | finalize ciphertext length equals cipherSize and SHA-256 equals the declared hash | COMMS_ATTACHMENT_HASH_MISMATCH |
| V07 | slot not expired at upload or finalize | EXPIRED |
| V08 | a member requests at most 60 slots per day | RATE_LIMITED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-059-09.T01 | unit | PS-059-01.R01, PS-059-01.R03, PS-059-02.R01, PS-059-02.R02 | create slots for allowed types and sizes and for boundary 5 242 880 and 5 242 881 | allowed accepted; larger refused with COMMS_ATTACHMENT_TOO_LARGE; svg refused with TYPE_UNSUPPORTED |
| TEST-PS-059-09.T03 | unit | PS-059-02.R03, PS-059-07.R01 | finalize with wrong hash and with truncated blob | COMMS_ATTACHMENT_HASH_MISMATCH and blob not downloadable |
| TEST-PS-059-09.T10 | abuse | PS-059-07.R03, PS-059-02.R03 | after message delete try to decrypt remaining message copy with key | blob missing so decryption impossible; 61st slot in a day returns RATE_LIMITED |

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
