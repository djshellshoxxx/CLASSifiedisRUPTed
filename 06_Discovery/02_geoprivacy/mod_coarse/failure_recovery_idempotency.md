# PS-047-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/02_geoprivacy/mod_coarse. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R04), CTR-EVT-001 (R02, R03); PENDING CTR-DSC-001.

**Decision labels:** Fail-closed publication PROVISIONAL (D05 default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-047-06.R01 | If recompute fails, previous publication flags stay in force for up to 60 min; after 60 min all cells not confirmed are treated as `suppressed` (fail closed). | MVP |
| PS-047-06.R02 | Recompute is idempotent per `window_id`; a rerun yields identical flags. | MVP |
| PS-047-06.R03 | Registry version change is atomic: readers see one whole version. | MVP |
| PS-047-06.R04 | Count source unavailable → no cell changes to `publishable`. | MVP |

## Data / schema
`recompute_window` record: `window_id`, `started_at`, `completed_at`, `status`, `registry_version`. Retention RET-OPS.

## Commands / queries / events
`publication.recompute` retries: 3 attempts, backoff 30 s, 2 min, 8 min.

## States & transitions
Recompute: `queued → running → completed | failed`. `failed` keeps prior flags within 60 min budget (R01).

## Validation & errors
`COARSE.RECOMPUTE_FAILED` retryable true.

## Authorization
Retries reuse sys principal; revoked sys grant halts recompute (fail closed).

## Failure, idempotency, concurrency, offline
Concurrency: one recompute per registry version (lock). Timeout per window 10 min.

## Privacy, retention, abuse
Failure logs carry window_id and counts of failure type only.

## Observability & budgets
Alert when last successful recompute older than 15 min.

## Tests
- TEST-PS-047-06-01 (chaos): kill recompute mid-run; flags unchanged; rerun completes.
- TEST-PS-047-06-02 (unit): fail-closed after 60 min.
- TEST-PS-047-06-03 (integration): atomic registry version switch under concurrent reads.

## Acceptance criteria
1. Fail-closed verified at 60 min.
2. Rerun equality verified.
3. No reader sees mixed registry versions.

## Assumptions & open decisions
- ASSUMPTION: 60 min stale tolerance.
