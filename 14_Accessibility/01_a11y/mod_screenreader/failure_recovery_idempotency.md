# PS-110-06 — failure recovery idempotency

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-110-06. **Owner:** [14_Accessibility/01_a11y/mod_screenreader](SPEC.md). **Implementing module:** 14_Accessibility/01_a11y/mod_screenreader. **Consumers:** feature surfaces F01–F13 that resolve or announce catalog labels by `label_id`; shared cross-cutting contracts F07, F10, F15, F16 per [dependency matrix](../../../DEPENDENCY_MATRIX.md) and [registry](../../../planning/SPEC_REGISTRY.csv).

## Purpose and scope
Defines timeouts, retries, idempotency, concurrency control and partial-failure recovery for mod_screenreader. Commands are defined in [commands_queries_events.md](commands_queries_events.md); state effects in [workflow_state_machine.md](workflow_state_machine.md). Retry behavior applies only to requests that carry an idempotency key or are read-only.

## Requirements
- PS-110-06.R01: **Business outcome.** A failed catalog read never leaves an assistive-technology user without text: the client falls back to its last accepted release. A failed preference write never silently loses the participant's change. A failed publish never leaves a half-published release visible. **Exclusions:** recovery of other modules' data; cross-region failover policy (F15).
- PS-110-06.R02: **Cases.** Normal: request succeeds first attempt. Invalid: request fails validation; not retried. Expired: idempotency key past 24 hours; treated as new. Duplicate: same key replayed after a timeout; returns the original result. Concurrent: two editors on one draft; two publishers; preference edited on two devices. Offline: client has no connectivity during preference write or catalog refresh. Adversarial: replay of a captured publish request with a stale checksum; flood of resolve calls from one client.
- PS-110-06.R03: **Budgets.** Client-visible wait for any single call ≤ 5 s before fallback. Total retry window ≤ 15 s for reads. No retry storm: jittered backoff with a maximum of 3 attempts. Accessibility: retries and fallbacks never move focus or repeat an announcement more than once per 2 s.

## Timeouts and retries

| Operation | Timeout (client) | Timeout (server, per call) | Retry policy | Idempotent by design |
|---|---|---|---|---|
| `catalog.resolve` | 1.5 s, then cached text | 2 s | none on client; cache serves | yes (read) |
| `catalog.getRelease` | 5 s | 5 s | 2 retries, backoff 1 s, 2 s, with ±20 % jitter | yes (read, ETag) |
| `preference.get` | 5 s | 3 s | 2 retries as above | yes (read) |
| `preference.update` / `setSyncEnabled` | 5 s | 3 s | up to 3 attempts, same key, backoff 0.5 s, 1 s, 2 s | yes (key + revision) |
| `label.upsertDraft` / `discardDraft` | 10 s | 8 s | up to 2 attempts, same key | yes (key + revision) |
| `release.stage` / `abandon` / `rollback` | 15 s | 12 s | up to 2 attempts, same key | yes (key) |
| `release.publish` | 30 s | 30 s lock (A-screenreader-12) | no automatic retry; operator re-issues with same key | yes (key + checksum) |

Retry only on: network error, 408, 429 (respect `Retry-After`), 500, 502, 503, 504. Never retry 400, 403, 404, 409, 422 without changing the request.

## Idempotency
- Key: client-generated ULID in `Idempotency-Key`. Scope: (caller, command, key). Retention: 24 hours (A-screenreader-09).
- Replay with same body hash returns stored response with `Idempotent-Replayed: true`.
- Replay with different body hash: `SCREENREADER_IDEMPOTENCY_CONFLICT` (409). Nothing is written.
- Key is written in the same transaction as the state change, so a crash either stores both or neither.

## Concurrency control
- Optimistic: `expected_revision` on draft, preference and label updates. Mismatch returns `SCREENREADER_REVISION_CONFLICT` (409) with the current revision in the error detail.
- Pessimistic: publish takes a single lock on the release row; a second publish or stage while staging is held returns `SCREENREADER_RELEASE_IN_PROGRESS` (409). Lock expires after 30 s (A-screenreader-12).
- Preference conflict resolution (client): on 409, the client holds the local change in `conflict`, fetches the server revision, and either keeps server values or re-sends local values with the new revision. After 3 failed re-sends, the server values are kept and the user is told once, with a `polite` announcement.

## Partial failure and recovery

| Failure | Detection | Recovery | Client-visible result |
|---|---|---|---|
| Crash during publish after row updates | transaction not committed | database rolls back; release stays `staging`; operator re-issues publish with same key | labels still show prior release |
| Outbox event not delivered | outbox lag alarm | redelivered at-least-once; consumers dedupe on `event_id` | none |
| Catalog download corrupt | client checksum mismatch (VR-20) | discard download; keep last accepted release; retry at next start or after 15 min | prior text remains; no error announced |
| Server unreachable during preference write | network error | write queued locally, state `pending_sync`, replayed on reconnect | local preference applied immediately |
| Queue overflow (> 50 pending writes) | client counter | collapse pending writes per key to the latest value; never drop a key | latest values preserved |
| Replay of stale publish after rollback | checksum mismatch (VR-13) | rejected with `SCREENREADER_RELEASE_STATE_INVALID` | none |
| Feature requests label missing from active release | resolve returns not found | fallback chain (requested, language-only, en-US); if still missing, dropped and counted | no spoken text invented |
| Relay outage (all writes) | 503 on all write calls | read-only mode: resolve from cache; writes queue; no catalog publish | reads continue; writes marked pending |

## Offline and reconnect
- Pending preference queue: capacity 50 entries, collapsed per key (A-screenreader-11). The queue is stored locally and survives reload.
- On reconnect, the client replays queued writes in order with their original keys; each response updates local `revision`.
- Catalog refresh on reconnect uses `ETag`; a 304 response costs no download.
- Sign-out clears the pending queue for that account before any further replay.

## Open decisions
- **A-screenreader-11:** Offline preference queue capacity is 50 entries with per-key collapse. This is a default for D08 (PWA offline writes, OPEN); it may change when D08 is decided.
- **A-screenreader-12:** Publish lock timeout is 30 s. Chosen because a publish of 3 000 rows is budgeted at 10 s p95, leaving headroom for slow storage. Confirm with F15 operations.
- Whether a relay outage should block all catalog publishes is a default here (yes), not an approved decision.
