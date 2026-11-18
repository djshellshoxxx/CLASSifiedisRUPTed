# PS-120-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/03_operations/mod_backups (F15.S03.M02). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-120-06.R01 | Data is written in 64 MiB chunks, each with SHA-256 recorded in the manifest; a chunk failure retries that chunk only. | MVP |
| PS-120-06.R02 | Per-chunk timeout 60 s; job timeout 6 h; retry up to 5 times with full-jitter backoff (base 1 s, cap 5 min, ASSUMPTION). | MVP |
| PS-120-06.R03 | A job resumes from the last verified chunk after restart; it never restarts a completed chunk. | MVP |
| PS-120-06.R04 | Missed schedules run once when the scheduler returns; no catch-up burst (maximum one missed run queued per scope). | MVP |
| PS-120-06.R05 | Store unavailability returns `BACKUP.STORE_UNAVAILABLE` (retryable) and keeps the job in `running`. | MVP |
| PS-120-06.R06 | A partial set is never marked complete; restore of partial data is impossible by state (PS-120-03 R01). | MVP |

## Data / schema
Chunk record: `{chunk_index, byte_offset, byte_length, sha256}` in the manifest, sorted by `chunk_index`.

## Commands / queries / events
`backup.run` is idempotent on `bkp_id`; repeats return current status.

## States & transitions
`running` → `failed` on unrecoverable error; retries stay in `running`.

## Validation & errors
| Code | Retryable | Category / HTTP | When |
|---|---|---|---|
| BACKUP.STORE_UNAVAILABLE | true | unavailable / 503 | Destination down; retried. |
| BACKUP.KEY_UNAVAILABLE | true | unavailable / 503 | KMS unreachable; job waits. |
| BACKUP.CHUNK_CORRUPT | false | internal / 500 | Chunk hash mismatch after retry budget. |

## Authorization
Retries reuse the `sys` principal; no user action required.

## Failure, idempotency, concurrency, offline
Concurrency: at most one running job per (scope, kind). Backups are server-side; no offline client path. Power loss at any point is recovered by R03.

## Privacy, retention, abuse
Partial objects are encrypted like complete ones; cleanup per PS-120-03 R05.

## Observability & budgets
Metrics: `backup_chunk_retries_total`, `backup_job_duration_seconds`. Alert when job duration exceeds 3 h (ASSUMPTION).

## Tests
- TEST-PS-120-06-01 (fault injection): store fails on chunk 17 of 40; job resumes from 17 without re-writing 1–16.
- TEST-PS-120-06-02 (kill): process killed at 50% of run; restart resumes; final manifest hash equals uninterrupted run.
- TEST-PS-120-06-03 (concurrency): two schedulers, one job created.
- TEST-PS-120-06-04 (unit): KMS outage keeps job `running`, then succeeds after recovery.

## Acceptance criteria
1. Resume from last verified chunk demonstrated (TEST-01, TEST-02).
2. TEST-PS-120-06-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: 64 MiB chunks; 60 s chunk timeout; 6 h job timeout.
- PROVISIONAL (D07 default).
