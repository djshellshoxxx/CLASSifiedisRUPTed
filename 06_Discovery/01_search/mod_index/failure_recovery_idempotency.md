# PS-045-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/01_search/mod_index. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03, R09), CTR-FED-001 (R05, R06), CTR-PRV-001 (R06); PENDING CTR-DSC-001.

**Decision labels:** Rebuild strategy (shadow index plus alias swap) is PROVISIONAL (D01 and D07 defaults, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-045-06.R01 | Out-of-order revisions buffered per `lst_` for ≤ 15 min or ≤ 50 revisions; then dead-letter with `INDEX.REVISION_GAP`. | MVP |
| PS-045-06.R02 | Apply is idempotent on (`lst_`, `revision`): re-application produces identical doc bytes. | MVP |
| PS-045-06.R03 | Rebuild uses a shadow index; query traffic switches by alias swap only after 100% of in-scope events are applied and verified. | MVP |
| PS-045-06.R04 | Equivocation (same `lst_` and revision, different payload digest) → quarantine, `INDEX.EQUIVOCATION`, no write. | Future |
| PS-045-06.R05 | Index unavailability degrades to last-good snapshot; no query returns a record newer than the source log. | MVP |

## Data / schema
Buffer table `index_pending` (key `listing_id`, `revision`, `event_ref`, `received_at`, RET-EPH for buffer entries). Shadow index metadata: `rebuild_id`, `scope`, `started_at`, `completed_at`, `verified_count`.

## Commands / queries / events
Retry: `apply_event` backoff 1 s → 5 min, 12 attempts, DLQ `index.dlq` (30-day RET-OPS). Rebuild timeouts: enqueue 30 s; per-batch 5 s; total 24 h hard stop.

## States & transitions
Rebuild states: `queued → running → verifying → swapped | aborted`. Abort keeps the live alias unchanged (see PS-045-03 for doc states).

## Validation & errors
`INDEX.REVISION_GAP` retryable true; `INDEX.EQUIVOCATION` retryable false; `INDEX.REBUILD_IN_PROGRESS` retryable true.

## Authorization
Retries reuse original grant context; revoked grant aborts the retry (PS-045-05).

## Failure, idempotency, concurrency, offline
Concurrency: revision CAS per `lst_`. Partial failure: a batch is applied all-or-nothing per `lst_`. Offline: index is server-side; clients read last server result and never write index state.

## Privacy, retention, abuse
DLQ entries hold event IDs and digests only, not payloads, so DLQ inspection does not expose content. Purge on resolution.

## Observability & budgets
Metrics: `index_lag_seconds` p95 ≤ 60 s; `index_dlq_depth`; `index_rebuild_docs_per_s` ≥ 500 (ASSUMPTION). Alert when DLQ depth > 100.

## Tests
- TEST-PS-045-06-01 (unit): buffer releases in revision order after gap fill.
- TEST-PS-045-06-02 (integration): replay of the same event batch twice yields byte-identical docs.
- TEST-PS-045-06-03 (chaos): kill consumer mid-rebuild; alias unchanged; resume completes.

## Acceptance criteria
1. Gap of 50 revisions dead-letters with the specified code.
2. Rebuild of 100 000 fixture listings completes with verified count equal to source count.
3. Alias swap never happens with `verified_count` below source count.

## Assumptions & open decisions
- ASSUMPTION: 100 000-listing fixture size is the MVP scale target (F15 to validate).
- D08 PROVISIONAL is not applicable: no client-side index writes.
