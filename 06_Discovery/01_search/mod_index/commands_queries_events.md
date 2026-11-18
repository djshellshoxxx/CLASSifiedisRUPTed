# PS-045-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/01_search/mod_index. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-ID-001, CTR-SCH-001, CTR-FED-001 (federated input); PENDING CTR-DSC-001.

**Decision labels:** Consumer model (pull from event log vs push) is PROVISIONAL (D01 default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-045-04.R01 | Every command carries `idempotency_key`; same key + same digest returns original result (CTR-EVT-001 R03). | MVP |
| PS-045-04.R02 | Index consumes events in per-aggregate revision order; gaps are buffered (PS-045-06). | MVP |
| PS-045-04.R03 | Query side is read-only; queries never write index docs. | MVP |
| PS-045-04.R04 | `index.doc.changed` payload ≤ 4 KiB and max_data_class = LOCATION_COARSE. | MVP |
| PS-045-04.R05 | Rebuild is an operator command with dual control for `scope: all`. | MVP |

## Data / schema
Command envelope fields: `idempotency_key` (string, 1–64 chars), `actor_ref` (`sys_` for consumers, `ope_` or `mod_` for manual), `correlation_id` (`cor_`), `schema_version`.

| Name | Kind | Signature | Idempotency | Version | Errors |
|---|---|---|---|---|---|
| `index.apply_event` | command | `(event)` | `event_id` | 1.0.0 | INDEX.REVISION_GAP (retryable true), INDEX.INVALID_* |
| `index.suppress` | command | `(listing_id, reason_code, case_ref?)` | tuple | 1.0.0 | SYS.NOT_FOUND, INDEX.INVALID_REASON |
| `index.lift_suppression` | command | `(listing_id, case_ref)` | tuple | 1.0.0 | INDEX.CASE_NOT_CLOSED |
| `index.rebuild` | command | `(scope)` | `rebuild_request_id` | 1.0.0 | INDEX.REBUILD_IN_PROGRESS (retryable true) |
| `index.query` | query (served by mod_query) | consumes read model only | n/a | 1.0.0 | SYS.RATE_LIMITED |
| `index.doc.changed` | event | index doc subset | n/a | 1.0.0 | n/a |

## States & transitions
Command effects are defined in PS-045-03. Commands do not change state directly outside those transitions.

## Validation & errors
Input validation per PS-045-02. All errors use CTR-ERR-001 envelope.

## Authorization
Authorization per PS-045-05. Commands check capability before validation.

## Failure, idempotency, concurrency, offline
Retry policy for `apply_event` consumers: exponential backoff 1 s to 5 min, max 12 attempts, then dead-letter queue `index.dlq` with 30-day RET-OPS retention (ASSUMPTION). Timeouts: 2 s for apply, 30 s for rebuild enqueue.

## Privacy, retention, abuse
Command payloads store no free text beyond `reason_code`; `case_ref` is an ID only. Command logs keep IDs and codes (CTR-ERR-001 R10).

## Observability & budgets
Trace every command with `correlation_id`. Budget: apply p95 ≤ 200 ms server-side (ASSUMPTION).

## Tests
- TEST-PS-045-04-01 (contract): each command's JSON schema matches registry entry in CTR-SCH-001.
- TEST-PS-045-04-02 (integration): duplicate `apply_event` with same key returns original result.
- TEST-PS-045-04-03 (contract): `index.doc.changed` payload contains no field above LOCATION_COARSE.

## Acceptance criteria
1. Each command has a version, idempotency rule and error list in the registry.
2. Duplicate deliveries produce zero extra `index.doc.changed` events.
3. Contract tests pass for all six names above.

## Assumptions & open decisions
- ASSUMPTION: event names `listing.*` owned by F01 (PENDING confirmation via CTR-EVT-001 registry).
- D01 PROVISIONAL (versioned signed envelopes apply to federated input).
