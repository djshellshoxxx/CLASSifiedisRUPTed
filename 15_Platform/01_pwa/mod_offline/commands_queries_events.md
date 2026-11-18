# PS-116-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/01_pwa/mod_offline (F15.S01.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-116-04.R01 | Every command below is local-only except `offline.replay`, which submits the stored command through its owner module's public command. | MVP |
| PS-116-04.R02 | Each queued command reuses the owner module's command signature; `offline.replay` adds header `X-Offline-Replay: true` and `source_kind = client_offline_replay`. | MVP |
| PS-116-04.R03 | Commands are idempotent on `(account_ref, idempotency_key)`; a repeated call returns the existing entry. | MVP |
| PS-116-04.R04 | Queries are local and read-only. Queries never trigger network calls. | MVP |
| PS-116-04.R05 | Local events are published to the UI store only; they are not CTR-EVT-001 events. | MVP |
| PS-116-04.R06 | Server-side ack handling is idempotent: a second ack for the same entry is a no-op. | MVP |

## Data / schema
| Name | Signature | Idempotency key | Version | Errors |
|---|---|---|---|---|
| `offline.enqueue` | (command_type, aggregate_id?, expected_revision?, payload, idempotency_key) → entry | (account_ref, idempotency_key) | 1.0.0 | OFFLINE.ENTRY_INVALID, OFFLINE.QUEUE_FULL, OFFLINE.COMMAND_NOT_OFFLINE_CAPABLE, SYS.PAYLOAD_TOO_LARGE |
| `offline.replay` | (entry_id) → applied or error | idempotency_key of entry | 1.0.0 | any owner-module code |
| `offline.user_discard` | (entry_id) → discarded | entry_id | 1.0.0 | OFFLINE.ENTRY_NOT_FOUND |
| `offline.user_retry` | (entry_id) → new entry | new key | 1.0.0 | OFFLINE.ENTRY_NOT_RETRYABLE |
| `offline.list` | (account_ref, state?, page) → entries without payload | none | 1.0.0 | none |

Local event names (UI only): `offline.queued`, `offline.applied`, `offline.not_applied`, `offline.upgrade_required`, `offline.discarded`.

## States & transitions
Command effects follow PS-116-03.

## Validation & errors
Enqueue validates per PS-116-02. Replay returns the owner module's code unchanged. `OFFLINE.ENTRY_NOT_FOUND` is returned for unknown or other-account entries (no existence leak).

## Authorization
Local commands require the active session for `account_ref`. Server authorization is owned by the target command (PS-116-05).

## Failure, idempotency, concurrency, offline
Replay sends only when online. Server rejects replays older than the server idempotency window (7 days, CTR-EVT-001 R03); the entry then moves to `not_applied` with `EVT.IDEMPOTENCY_KEY_REUSED` only if the digest differs, otherwise the original result is returned.

## Privacy, retention, abuse
Query results omit payload ciphertext. Commands carry no device identifiers.

## Observability & budgets
Metrics: `offline_enqueue_total{command_type}`, `offline_replay_latency_ms` p95 <= 3000 after reconnect (ASSUMPTION).

## Tests
- TEST-PS-116-04-01 (contract): replay sends the same body and key as the original submission.
- TEST-PS-116-04-02 (unit): enqueue twice with same key returns one entry.
- TEST-PS-116-04-03 (integration): duplicate ack processed once.
- TEST-PS-116-04-04 (negative): discard of another account's entry returns `OFFLINE.ENTRY_NOT_FOUND`.

## Acceptance criteria
1. Each command has a signature, idempotency scope and error list above.
2. Owner-module contract test passes for each offline-capable command.
3. TEST-PS-116-04-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: `X-Offline-Replay` header is informational; server enforces `source_kind` from the envelope, not from the header.
- PROVISIONAL (D08 default).
