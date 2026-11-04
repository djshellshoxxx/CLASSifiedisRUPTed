# PS-060-06 — Failure recovery and idempotency: Private messages

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M01 Private messages](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/private` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-060-06.R01** Vault commands commit locally first and relay delivery is a retried outbox step; mailbox put is idempotent on (mailboxId, messageId) so replays return the original receipt.
- **PS-060-06.R02** Inbound processing is idempotent on messageId and fetch followed by acknowledge is at-least-once; a lost acknowledgement only causes a duplicate fetch.
- **PS-060-06.R03** Offline vaults queue sends and replay them in creation order; no distributed lock is used and forked sender chains are detected and frozen rather than merged.

## Specification

- **idempotency:** Vault commands are idempotent on messageId; relay commands require Idempotency-Key with a 24 h replay window and put is also naturally idempotent on (mailboxId, messageId).
- **concurrency:** Within a vault each command runs in one IndexedDB transaction; the per-sender seq is allocated in that transaction; on the relay put uses INSERT with the unique index; fetch is read-only; two devices of one principal choose seq from a shared counter synchronized through the sender's own self-mailbox, and a collision on (threadId, senderDid, seq) is treated as a fork and surfaced.
- **retries:** Outbox retries network errors and RATE_LIMITED with CTR-IDM-001 backoff (base 1 s, factor 2, jitter, cap 15 min) for 14 days; non-retryable relay refusals mark the message failed.
- **offline:** Compose and queue offline; the message shows saved on this device; fetch resumes from the last stored envelope ID; decrypted history exists only in the vault.
- **partial failure:** If some recipient mailboxes accept and others do not, per-recipient outbox entries retry independently and the message stays prepared until all are acknowledged; if the relay stops entirely, delivery status becomes unknown and local records are unaffected.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-060-09.T09 | integration | PS-060-06.R01, PS-060-06.R02 | 50 concurrent sends plus 10 replays of mailbox put and duplicate fetches | one envelope per messageId, contiguous seq, duplicates deduplicated |
| TEST-PS-060-09.T10 | e2e | PS-060-06.R03, PS-060-03.R01 | relay down for 4 days, then restored | messages stay prepared, then become transport acknowledged; recipient receives 30 messages in sender order; UI never shows delivered early |
| TEST-PS-060-09.T13 | chaos | PS-060-06.R03 | one of two recipient mailboxes rejects with 503 while the other accepts | message stays prepared, accepted copy not re-sent, retry completes the other |

## Dependencies

Module depends on: F08.S01.M02, F07.S01.M01, F07.S02.M02, F16.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FED-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
