# PS-062-06 — Failure recovery and idempotency: Explicit consent capture

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S02.M02 Explicit consent capture](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/negotiation/consent` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-062-06.R01** Signing is idempotent on the content address, so signing the same payload again returns the stored statement unchanged.
- **PS-062-06.R02** Inbound acceptance is idempotent on cid and order-insensitive with subject, key and wording arrival.
- **PS-062-06.R03** There is no distributed lock; conflicting statements are stored side by side, flagged conflicted, and handled by explicit renegotiation in the owning module.
- **PS-062-06.R04** Duplicate resolution is deterministic - every vault keeps the lowest cid of a dedupe tuple and stores the others as aliases, and a revocation that targets the tuple revokes every matching cid - so references and revocations resolve the same way in every vault.

## Specification

- **idempotency:** Statement id is the cid, so duplicates collapse; the dedupe key (signerDid, subjectRef, subjectRevisionHash, statementKey, kind) is evaluated over non-revoked records only, so a re-consent after revocation is a new valid record; signing the same payload with a different signedAtClaim inside the dedupe key returns the stored record; inbound duplicates keep the lowest cid as record and the others as aliases.
- **concurrency:** Each command runs in one IndexedDB transaction; revoke uses expectedRevision on the consent row; a consent and a revocation racing from two devices of one signer both store, and because the revocation targets the dedupe tuple and revocation is monotonic, verify returns revoked (or conflicted after commit) in every vault regardless of arrival order.
- **retries:** Delivery of the signed statement to other parties uses F11.S02.M01 on the F15.S01.M01 outbox with states prepared, transport acknowledged and peer accepted (signed acknowledgement by the counterparty vault) and its timers (CTR-IDM-001 IDM-4 backoff base 500 ms, cap 30 s, 6 attempts; unsent entries expire 7 days after creation, transport_acknowledged entries 30 days after the relay receipt).
- **offline:** Signing, revoking and verifying work fully offline; the UI shows signed on this device until the peer acknowledgement arrives and never claims the counterparty has seen it.
- **partial failure:** If the process stops between signing and storing, nothing is stored and no event is emitted; if delivery fails the record stays and the outbox entry shows failed or expired with resend; quarantined inbound statements never produce a valid state until verification passes.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-062-09.T08 | integration | PS-062-06.R01, PS-062-06.R02, PS-062-06.R03 | sign twice, accept the same statement five times in shuffled order with subject arriving late | one record, one event per origin, same verify result |
| TEST-PS-062-09.T09 | integration | PS-062-06.R04, PS-062-01.R04 | P1 signs the same consent on both devices; P2 and P3 receive the two copies in opposite orders; P1 then revokes by dedupe tuple | P2 and P3 both keep the lowest cid with the other as alias; the revocation revokes both cids in both vaults |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, F16.S02.M02, F16.S02.M03, F11.S01.M01, F11.S02.M01, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-COM-001, CTR-IOX-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
