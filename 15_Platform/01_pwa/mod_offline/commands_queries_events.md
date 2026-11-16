# PS-116-04 — Commands, queries and events: Offline outbox

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M01 Offline outbox](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/offline` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-116-04.R01** Every command here is a vault-local command with actor = unlocked local principal; none is a relay command and none produces a signed statement itself, although the entries it manages carry statements produced by other modules.
- **PS-116-04.R02** The module produces no domain events leaving the device and emits only local UI notifications over the BroadcastChannel classrup-outbox (CTR-EVT-001 EVT-8).
- **PS-116-04.R03** Relay responses are interpreted only through CTR-ERR-001 fields so that new error codes need no code change here.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `platform.outbox.enqueue` | platform.outbox.enqueue | { destination, kind, payload, statementSchema?, idempotencyKey?, expectedRevision?, aggregateKey, needsPeerAck } — vault-local command | { entryId, seq, cid, expiresAt } | PLATFORM_OUTBOX_NOT_DELIVERABLE, PAYLOAD_TOO_LARGE, PLATFORM_OUTBOX_FULL, PLATFORM_OUTBOX_STORAGE_UNAVAILABLE, UNAUTHENTICATED, VALIDATION_FAILED |  | no |
| `platform.outbox.deliver` | platform.outbox.deliver | { entryId?, destination? } (omit to deliver everything eligible) — vault-local command that calls the relay or peer transport | { sent, transportAcknowledged, completed, pending, conflict, failed } | UNAUTHENTICATED, PLATFORM_OUTBOX_STORAGE_UNAVAILABLE, DEPENDENCY_UNAVAILABLE |  | yes (Idempotency-Key) |
| `platform.outbox.record_peer_ack` | platform.outbox.record_peer_ack | { entryId, ackCid } — vault-local command called by the statement ingest path after signature verification | { entryId, state: peer_accepted } | NOT_FOUND, CONFLICT_STATE, PLATFORM_OUTBOX_ACK_MISMATCH |  | yes (Idempotency-Key) |
| `platform.outbox.resolve` | platform.outbox.resolve | { entryId, resolution: rebase\|retry\|reroute, newDestination? } — vault-local command; rebase asks the owning module to sign a new statement | { entryId, state } | NOT_FOUND, CONFLICT_STATE, EXPIRED, PLATFORM_OUTBOX_STORAGE_UNAVAILABLE, VALIDATION_FAILED |  | yes (Idempotency-Key) |
| `platform.outbox.discard` | platform.outbox.discard | { entryId } — vault-local command | { entryId, state: discarded } | NOT_FOUND, CONFLICT_STATE, PLATFORM_OUTBOX_STORAGE_UNAVAILABLE |  | yes (Idempotency-Key) |
| `platform.storage.request_persistence` | platform.storage.request_persistence | {} — vault-local command calling navigator.storage.persist() after a user gesture | { persisted: boolean } | PLATFORM_OUTBOX_STORAGE_UNAVAILABLE |  | yes (Idempotency-Key) |
| `platform.storage.record_export` | platform.storage.record_export | { exportedAt, sha256 } — vault-local command called by F10.S01.M03 after a vault export completes | { lastExportAt } | VALIDATION_FAILED |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `platform.outbox.list` | platform.outbox.read | { destination?, state?: unsent\|conflict\|failed\|all, limit ≤ 200 } | { items: OutboxEntry[] } ordered by seq ascending | PLATFORM_OUTBOX_STORAGE_UNAVAILABLE |
| `platform.outbox.count_by_state` | platform.outbox.read | { aggregateKey? } | { prepared, transportAcknowledged, peerAccepted, conflict, failed, expiringWithin24h } | PLATFORM_OUTBOX_STORAGE_UNAVAILABLE |
| `platform.storage.get_status` | platform.storage.read_status | { } (no input) | { persisted, usageBytes, quotaBytes, usageRatio, lastExportAt?, exportAgeDays?, exportOverdue (age > 30), evictionRisk (not persisted or usageRatio > 0.8), markerOk } |  |

### Events produced

_None._

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| PLATFORM_OUTBOX_NOT_DELIVERABLE | 409 | no | entry is not a locally signed statement or a registered deliverable relay command |
| PLATFORM_OUTBOX_FULL | 409 | no | 200 entries or 5 MiB of queued payload reached for this principal |
| PLATFORM_OUTBOX_STORAGE_UNAVAILABLE | 503 | no | IndexedDB is blocked, full or unavailable on this device |
| PLATFORM_OUTBOX_ACK_MISMATCH | 422 | no | peer acknowledgement does not match the entry or the expected counterparty |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
// offline: user edits a listing and sends an offer; both commit locally first
platform.outbox.enqueue({ destination: "relay:r-7k3m", kind: "statement", statementSchema: "classrup.bazaar.offer_statement/v1", payload: { /* signed envelope */ }, aggregateKey: "listing:0192f3a4-5b6c-7d8e-9f01-23456789abcd", needsPeerAck: true })
-> { entryId: "0192f400-0000-7000-8000-000000000001", seq: 17, cid: "sha256-Xq1...", expiresAt: "2026-11-11T10:00:00.000Z" }
// online: relay mailbox returns a receipt  -> state transport_acknowledged ("Delivered to relay, peer has not confirmed")
// seller's vault returns a signed acknowledgement -> platform.outbox.record_peer_ack -> peer_accepted ("Confirmed by peer")
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-116-09.T08 | unit | PS-116-04.R01, PS-116-04.R02 | all commands and queries called | contract of input/output holds, no domain event is produced and no network call is made by local-only commands |
| TEST-PS-116-09.T09 | contract | PS-116-04.R03, PS-116-02.R02 | stub returns an unknown error code with status 409 retryable false | classified as failed without code changes and shown with messageKey |
| TEST-PS-116-09.T16 | integration | PS-116-04.R01, PS-116-07.R03, PS-116-03.R03 | two vaults send conflicting acceptances for one reservation; receiving module reports the fork | entry becomes conflict, affected coordination frozen, no winner chosen |

## Dependencies

Module depends on: F15.S02.M02, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-PRV-001, CTR-UX-001, CTR-OBS-001, CTR-CAP-001, CTR-FED-001, CTR-IOX-001, CTR-EVT-001. Predecessor: [domain_schema.md](domain_schema.md).
