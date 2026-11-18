# PS-058-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/03_trust/mod_reputation. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03), CTR-ERR-001, CTR-COM-001 (finality may change after first report), CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-058-06.R01 | Each input is applied at most once per `(prf_id, event_id)`; enforced by unique index. | MVP |
| PS-058-06.R02 | Recompute is a pure function of inputs and rules version; re-running yields identical counters. | MVP |
| PS-058-06.R03 | Input arriving after finality change (`reported` → `final` or `final` → `reversed`) updates counters by delta, not by double count. | MVP |
| PS-058-06.R04 | Input source outage: queue inputs upstream; reputation lag alert at 15 min. | MVP |
| PS-058-06.R05 | Nightly full recompute compares against incremental state; any drift > 0 is logged and corrected from inputs. | MVP |
| PS-058-06.R06 | Concurrent inputs for the same `prf_` serialize on the profile row (compare-and-set on revision). | MVP |

## Data / schema
Applied-input table: `prf_id`, `event_id`, `applied_at`, `rule_version`. Retention 400 days to match PS-058-02 horizon, then pruned.

## Commands / queries / events
Retry rules apply to `ReputationInput` commands (PS-058-04).

## States & transitions
Recompute states: `queued` → `applying` → `applied` or `failed` (retry, max 10 attempts, then alert).

## Validation & errors
`REPUTE.INPUT_DUPLICATE` is a success-equivalent for idempotent retries (returns no change).

## Authorization
Source `sys_` re-authorized per attempt.

## Failure, idempotency, concurrency, offline
- Finality reversal: `exchange_outcome` with `finality = reversed` removes the earlier counted input by delta.
- Partial failure between input write and counter update: transaction covers both.
- Recompute failure does not block evidence or exchange commits (independent queues).

## Privacy, retention, abuse
Applied-input table holds event IDs only, no counterparty identity beyond the diversity window (PS-058-07).

## Observability & budgets
`repute_recompute_lag_seconds` p95 ≤ 60 s; `repute_drift_total`; alert at drift > 0 on nightly check.

## Tests
- TEST-PS-058-06-01 (integration): crash mid-update; counters match after retry.
- TEST-PS-058-06-02 (property): recompute from inputs equals incremental state for random sequences.
- TEST-PS-058-06-03 (integration): finality reversal removes exactly one count.
- TEST-PS-058-06-04 (concurrency): 100 parallel inputs for one `prf_` yield exact sum.

## Acceptance criteria
1. Counters reconcile with inputs under property tests.
2. No double count under replay or reversal.
3. Lag within bound or alert fires.
4. Nightly drift check implemented.

## Assumptions & open decisions
- ASSUMPTION: applied-input retention 400 days.
- PROVISIONAL (D04 default, unapproved): per-party attestation and compensating recovery for partial exchanges.
