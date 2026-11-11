# PS-119-03 — Workflow state machine: Storage

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S02.M03 Storage](SPEC.md) · **Scope:** MVP · **Code:** `packages/kernel/src/storage` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-119-03.R01** Outbox delivery per consumer follows the InboxEntry machine; a failure schedules a retry after random(0, min(30 s, 500 ms × 2^(attempt-1))) and the eighth failure moves the event to dead_letter.
- **PS-119-03.R02** A dead letter requeued by the replay primitive goes from dead to retry with inbox attempts reset and its dead_letter row kept with replay_count + 1 and last_replayed_at = now, is delivered like any retry (its dead_letter row deleted in the transaction that marks it done), and returns to dead with replay_count and last_replayed_at kept after 8 more failures, when its consumer module is disabled (FEATURE_DISABLED) or 7 days after last_replayed_at without delivery (EXPIRED).
- **PS-119-03.R03** Leases follow acquire by compare-and-set, renew by the holder, release by the holder and automatic expiry at expiresAt, with a fencing counter that increases on every new acquisition (IDM-3, IDM-8).

## Specification

### InboxEntry lifecycle

Initial **pending**; terminal **done**, **purged**.

| Transition | Trigger | Guard / effect |
|---|---|---|
| pending -> done | consumer handler returned ok | inbox row written in the handler transaction |
| pending -> retry | handler failed and attempts < 8 | nextAttemptAt = now + full-jitter backoff; later events of the aggregate wait |
| pending -> dead | handler failed and attempts reached maxAttempts | event copied to dead_letter with its error code, replay_count 0 |
| retry -> done | redelivery succeeded | inbox row marked done; a requeued event's dead_letter row is deleted in the same transaction |
| retry -> retry | handler failed again and attempts < 8 | backoff ceiling doubles up to 30 s |
| retry -> dead | eighth failed attempt | event copied to dead_letter with its error code; a requeued event updates its existing row (attempts, error_code, dead_at) and keeps replay_count and last_replayed_at |
| dead -> retry | dead letter requeued by the replay primitive | inbox attempts reset to 0, due immediately; dead_letter row kept with replay_count + 1 and last_replayed_at = now |
| retry -> dead | requeued event whose consumer module is disabled (FLG-3) | dead_letter error_code FEATURE_DISABLED and dead_at = now; replay_count and last_replayed_at kept |
| retry -> dead | requeued event not delivered within 7 days of last_replayed_at | dead_letter error_code EXPIRED and dead_at = now; replay_count and last_replayed_at kept |
| dead -> purged | purge primitive called by F15.S03.M03 for dead_at older than 30 days | dead_letter and inbox rows deleted in one transaction |

```mermaid
stateDiagram-v2
  [*] --> pending
  pending --> done: consumer handler returned ok
  pending --> retry: handler failed and attempts < 8
  pending --> dead: handler failed and attempts reached maxAttempts
  retry --> done: redelivery succeeded
  retry --> retry: handler failed again and attempts < 8
  retry --> dead: eighth failed attempt
  dead --> retry: dead letter requeued by the replay primitive
  retry --> dead: requeued event whose consumer module is disabled (FLG-3)
  retry --> dead: requeued event not delivered within 7 days of last_replayed_at
  dead --> purged: purge primitive called by F15.S03.M03 for dead_at older than 30 days
  done --> [*]
  purged --> [*]
```

### MediaBlob lifecycle

Initial **stored**; terminal **deleted**.

| Transition | Trigger | Guard / effect |
|---|---|---|
| stored -> referenced | first holder attached by a repository put or attach | holder row written |
| referenced -> referenced | another holder attached or a non-last holder detached | holder rows updated |
| referenced -> deleted | last holder detached by record update or removal | blob row deleted in the same transaction; shred reported when encrypted |
| stored -> deleted | orphan sweep for blobs never referenced | blob row deleted |

```mermaid
stateDiagram-v2
  [*] --> stored
  stored --> referenced: first holder attached by a repository put or attach
  referenced --> referenced: another holder attached or a non-last holder detached
  referenced --> deleted: last holder detached by record update or removal
  stored --> deleted: orphan sweep for blobs never referenced
  deleted --> [*]
```

### Timeouts and scheduled transitions

- Inbox retry: nextAttemptAt = now + random(0, min(30 s, 500 ms × 2^(attempt-1))); dead letter after 8 attempts.
- Disabled consumer modules (FLG-3) are paused 60 s at a time without consuming attempts and their events stay in the outbox; a requeued dead letter of a disabled consumer returns to dead with FEATURE_DISABLED instead.
- Requeued dead letters return to dead with EXPIRED 604800000 ms (7 days) after last_replayed_at without delivery; dead letters are purged 2592000000 ms (30 days) after dead_at by the purge primitive that F15.S03.M03 schedules.
- Leases expire at expiresAt (default TTL 15 min, maximum 24 h); expired leases are free without cleanup.
- Orphan blob sweep deletes blobs without holders older than the cutoff chosen by the caller (default one day after upload).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-119-09.T03 | contract | PS-119-02.R03, PS-119-03.R03, PS-119-05.R03 | acquire, competing acquire, non-holder release, renew, expiry, late renew, re-acquire | PRECONDITION_FAILED, EXPIRED, fence 1 then 2 then 3 |
| TEST-PS-119-09.T04 | integration | PS-119-01.R02, PS-119-03.R01, PS-119-04.R03, PS-119-06.R03, PS-119-09.R02 | two aggregates with a failing first delivery, duplicate delivery, eight failures, requeue; pending query semantics per adapter | per-aggregate order kept; duplicate skipped; dead letter at attempt 8; requeued events delivered |
| TEST-PS-119-09.T05 | contract | PS-119-01.R05, PS-119-03.R02, PS-119-04.R06, PS-119-07.R02 | dead-letter an event, requeue it, fail 8 more times, requeue again, requeue twice in a row, disable the consumer of a third requeued event, leave a fourth undelivered 7 days, deliver a fifth, purge at dead_at + 30 days | replay_count 1 then 2 with last_replayed_at kept on re-dead-lettering; second requeue CONFLICT_STATE; FEATURE_DISABLED and EXPIRED returns keep replay_count; delivered row deleted; purge removes only dead rows older than 30 days |
| TEST-PS-119-09.T16 | unit | PS-119-03.R01, PS-119-03.R02 | compare inboxMachine and blobMachine with this file's InboxEntry and MediaBlob machines | identical initial, terminal and transition rows; no sync machine exported |

## Dependencies

Module depends on: F15.S03.M01, CTR-ID-001, CTR-SCH-001, CTR-IDM-001, CTR-EVT-001, CTR-ERR-001, CTR-PRV-001, CTR-IOX-001, CTR-FLG-001, CTR-OBS-001, CTR-TST-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
