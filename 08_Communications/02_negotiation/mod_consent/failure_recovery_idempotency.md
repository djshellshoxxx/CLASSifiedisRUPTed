# PS-062-06 — Failure recovery and idempotency: Explicit consent capture

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S02.M02 Explicit consent capture](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/negotiation/consent` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-062-06.R01** Signing is idempotent on the content address, so signing the same payload again returns the stored statement unchanged.
- **PS-062-06.R02** Inbound acceptance is idempotent on cid and order-insensitive with subject and key arrival.
- **PS-062-06.R03** There is no distributed lock; conflicting statements are stored side by side, flagged conflicted, and handled by explicit renegotiation in the owning module.

## Specification

- **idempotency:** Statement id is the sha256 cid, so duplicates collapse; sign with the same payload but a different signedAtClaim creates a different cid and is rejected as duplicate by the dedupe key (signerDid, subjectRef, subjectRevisionHash, statementKey, kind) with the original returned.
- **concurrency:** Each command runs in one IndexedDB transaction; revoke uses expectedRevision on the consent row; a consent and revocation racing from two devices of one signer both store and verify returns revoked because revocation of a valid consent is monotonic.
- **retries:** Delivery of the signed statement to other parties uses the sync outbox with states prepared, transport acknowledged and peer accepted (signed acknowledgement by the counterparty vault); retries use backoff base 1 s, factor 2, cap 15 min for 14 days.
- **offline:** Signing, revoking and verifying work fully offline; the UI shows signed on this device until the peer acknowledgement arrives and never claims the counterparty has seen it.
- **partial failure:** If the process stops between signing and storing, nothing is stored and no event is emitted; if delivery fails the record stays and the outbox keeps retrying; quarantined inbound statements never produce a valid state until verification passes.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-062-09.T08 | integration | PS-062-06.R01, PS-062-06.R02, PS-062-06.R03 | sign twice, accept the same statement five times in shuffled order with subject arriving late | one record, one event per origin, same verify result |
| TEST-PS-062-09.T09 | integration | PS-062-06.R03, PS-062-03.R01 | two signer devices sign and revoke concurrently | both stored, verify returns revoked, no overwrite |

## Dependencies

Module depends on: F07.S01.M01, F16.S02.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-COM-001. Predecessor: [domain_schema.md](domain_schema.md).
