# PS-121-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/03_operations/mod_observability (F15.S03.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-121-04.R01 | Ingest is batch-based: up to 500 records or 256 KiB per call. | MVP |
| PS-121-04.R02 | Ingest is idempotent on batch digest; a repeat batch returns `duplicate` counts. | MVP |
| PS-121-04.R03 | Alert state commands require `expected_revision` (CTR-EVT-001 R02). | MVP |
| PS-121-04.R04 | Queries return aggregates by default; record-level queries require case scope (PS-121-05). | MVP |

## Data / schema
| Command | Signature | Idempotency scope | Emits | Errors |
|---|---|---|---|---|
| `telemetry.ingest` | (source_module, records[]) | batch digest | none | OBSERV.REDACTION_FAILED, OBSERV.CARDINALITY_EXCEEDED, SYS.PAYLOAD_TOO_LARGE |
| `alert.acknowledge` | (alert_id, expected_revision) | (actor, key) | `alert.acknowledged` | SYS.CONFLICT, SYS.FORBIDDEN |
| `alert.silence` | (rule_id, until, reason_code) | (actor, key) | none (local state) | OBSERV.SILENCE_TOO_LONG |
| `alert_rule.create` | (rule body) | (actor, key) | `alert_rule.created` | OBSERV.METRIC_UNKNOWN |
| `alert_rule.retire` | (rule_id) | (rule_id) | `alert_rule.retired` | SYS.GONE |

Query: `telemetry.aggregate` (metric, window, group by allow-listed labels).

## States & transitions
See PS-121-03.

## Validation & errors
Per PS-121-02. `OBSERV.SILENCE_TOO_LONG` is validation (400, not retryable).

## Authorization
See PS-121-05.

## Failure, idempotency, concurrency, offline
Ingest is at-least-once from emitters; the batch digest makes it effectively once. Emitters retry with backoff.

## Privacy, retention, abuse
Events carry rule IDs and codes only.

## Observability & budgets
Ingest p95 <= 100 ms per batch (ASSUMPTION).

## Tests
- TEST-PS-121-04-01 (contract): each command matches the table.
- TEST-PS-121-04-02 (idempotency): same batch twice stores records once.
- TEST-PS-121-04-03 (concurrency): two acknowledgements on one alert, one succeeds with `SYS.CONFLICT` for the other.
- TEST-PS-121-04-04 (negative): record-level query without case scope refused.

## Acceptance criteria
1. Command table matches the implemented internal API.
2. TEST-PS-121-04-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: 500-record batch limit.
