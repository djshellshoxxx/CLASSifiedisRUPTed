# PS-059-06 — Failure recovery and idempotency: Message attachments

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M03 Message attachments](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/attachments` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-059-06.R01** Slot creation and finalize are idempotent per CTR-IDM-001; chunk upload is idempotent on (attachmentId, index) and a repeated chunk with different bytes is refused.
- **PS-059-06.R02** Interrupted uploads resume at the first missing chunk index within the 1 hour slot life without re-encrypting.
- **PS-059-06.R03** Finalize is one relay transaction; MediaBlob storage and the attachment row remain consistent through write-then-rename and a reconciliation sweep, and the vault records the response and emits its event in one IndexedDB transaction.

## Specification

- **idempotency:** Relay commands require Idempotency-Key on create_slot, finalize and delete; the vault attach and remove commands are idempotent on attachmentId; put_chunk is naturally idempotent on (attachmentId, index) with a content hash check; replay window 24 h.
- **concurrency:** expectedRevision on finalize and delete; two finalize calls race on the pending-to-uploaded transition and exactly one wins, the other replays the result.
- **retries:** Upload relay commands use the F15.S01.M01 outbox timers (CTR-IDM-001 IDM-4 backoff base 500 ms, cap 30 s, full jitter, 6 attempts; unsent entries expire 7 days after creation after a day-6 prompt); the whole upload restarts with a new slot after EXPIRED.
- **offline:** Photo processing and encryption happen in the vault; the ciphertext is held as a local MediaBlob and outbox entries carry only its reference, so the 5 MiB outbox cap is not used up; the message referencing it is sent only after finalize succeeds, and until then it shows prepared.
- **partial failure:** If the relay process crashes between blob rename and database commit the reconciliation sweep (every 10 minutes) deletes orphan MediaBlobs without a row and marks rows without a blob as expired; if the vault never receives the finalize response it repeats finalize with the same Idempotency-Key.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-059-09.T08 | integration | PS-059-06.R01, PS-059-06.R02 | upload 10 chunks, kill connection after 3, resume, repeat chunk 2 with different bytes | upload completes; conflicting repeat refused |
| TEST-PS-059-09.T09 | chaos | PS-059-06.R03 | crash between blob rename and commit; lost finalize response | reconciliation sweep removes orphan blob and expires row; repeated finalize replays the stored response |

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, F15.S02.M03, F10.S02.M03, F11.S02.M01, F15.S01.M01, F16.S02.M03, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
