# PS-089-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/03_interop/mod_blocklists. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (R07 tombstones, R08 export re-keying, R10 limits, R13 results), CTR-EVT-001 (R05 signing), CTR-PRV-001 (BT-04 restore replay, R07 holds), CTR-CAP-001 (R06 privileged grants).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-089-10.R01 | Import: a peer batch of ≤ 100 events (CTR-FED-001 R10) yields per-event `proposed`, `rejected` or `duplicate`. Nothing auto-activates. Batch recorded under its `dlv_` ID. | MVP |
| PS-089-10.R02 | Export: only active `federate` entries to `trusted` peers, as signed events. Export cursor is the aggregate `revision`. Full resync to a returning peer completes within 24 h (ASSUMPTION). | MVP |
| PS-089-10.R03 | `rollback_batch(dlv_)`: all `proposed` and `active` entries from that batch become `withdrawn` (cause `batch_rollback`) within 60 s. Requires dual control. Repeat call returns the same result without new events. | MVP |
| PS-089-10.R04 | Restore from backup replays later withdrawals and expiries before serving checks. Restore never reactivates a `withdrawn` or `expired` entry. | MVP |
| PS-089-10.R05 | Disabling enforcement via feature flag (`15_Platform/04_configuration/mod_flags`) stops enforcement within 60 s, keeps entries, and emits an audit record. Re-enable requires `ope_` approval. | MVP |

## Data / schema
Import batch record: `dlv_id`, `origin_peer` (`fpr_`), `received_at`, `event_count`, counts of `proposed`, `rejected` and `duplicate`, `batch_digest` (SHA-256). Retention RET-FED (PS-089-07). Raw non-equivocation payloads are discarded after processing; only envelope digests remain (ASSUMPTION). Equivocation evidence is retained per CTR-FED-001 R06.

## Commands / queries / events
`blocklist.import_batch`, `blocklist.rollback_batch`, export job, and `blocklist.withdrawn` (cause `batch_rollback`), defined in PS-089-04.

## States & transitions
Rollback applies the withdrawal transition in PS-089-03. Export jobs: `pending`, `sent`, `retrying`, as in PS-089-06.

## Validation & errors
Batch limits: `FED.SIZE_EXCEEDED`. Signature: `FED.SIGNATURE_INVALID`. Unknown key: `FED.KEY_UNKNOWN`. Restore integrity failure: `SYS.INTERNAL`, non-retryable, blocks serving.

## Authorization
Rollback: `blk.rollback` with dual control (PS-089-05). Restore: `ope_` with purpose `backup_restore` (CTR-CAP-001 R06).

## Failure, idempotency, concurrency, offline
- Import is idempotent per `(origin_node, event_id)`.
- Rollback is resumable by `dlv_` ID; a crash mid-rollback resumes from the last committed entry.
- Restore is run before the node accepts checks; checks fail closed until replay completes (PS-089-06).
- Offline: no import or rollback offline.

## Privacy, retention, abuse
Backups contain entries under the same classes as live data. Restored copies follow PS-089-07 retention. Peer batch contents are not exported back to peers beyond signed events.

## Observability & budgets
`blocklist_rollback_duration_seconds` (target ≤ 60 s), `blocklist_restore_replay_count`. Alert if replay is incomplete after 10 min (ASSUMPTION).

## Tests
- TEST-PS-089-10-01 (integration): 101-event batch → `FED.SIZE_EXCEEDED`.
- TEST-PS-089-10-02 (integration): import then rollback → all entries withdrawn; second rollback is a no-op.
- TEST-PS-089-10-03 (integration): restore from snapshot older than a withdrawal → entry not active.
- TEST-PS-089-10-04 (integration): expired entry not reactivated on restore.
- TEST-PS-089-10-05 (integration): export excludes `local` entries and restricted peers.
- TEST-PS-089-10-06 (integration): enforcement flag off → no checks applied; entries retained; audit record present.
- TEST-PS-089-10-07 (fault): crash mid-rollback resumes and completes once.

## Acceptance criteria
1. Rollback leaves zero active entries from the batch within 60 s; TEST-PS-089-10-02 and -07 pass.
2. Restore never serves a stale active entry; TEST-PS-089-10-03 and -04 pass.
3. Export contains only federate active entries to trusted peers; TEST-PS-089-10-05 passes.

## Assumptions & open decisions
Decision register: [DECISIONS.md](../../../DECISIONS.md). Labels below are PROVISIONAL (default, unapproved) where marked.
- ASSUMPTION: 60 s rollback target; 24 h resync; 10 min replay alert.
- PROVISIONAL (D07 default, unapproved): batch and retention rules.
- PROVISIONAL (D01 default, unapproved): signed batch events.
