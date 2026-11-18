# PS-045-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/01_search/mod_index. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R06, R11), CTR-SCH-001 (R07, R08), CTR-FED-001 (R08); PENDING CTR-DSC-001.

**Decision labels:** Index is excluded from user export and backups is PROVISIONAL (D07 default, unapproved). Shadow-index rollback is ASSUMPTION.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-045-10.R01 | Index docs are never included in user data export (derived data; source listings are exported instead). | MVP |
| PS-045-10.R02 | Index is excluded from backups; restore triggers a full rebuild from the event log. | MVP |
| PS-045-10.R03 | Schema change to index doc requires shadow rebuild and alias swap; rollback = swap back to previous alias while previous index is retained 7 days (ASSUMPTION). | MVP |
| PS-045-10.R04 | Restore replays deletions and withdrawals before query exposure (CTR-PRV-001 R06). | MVP |
| PS-045-10.R05 | No federation export of index docs; federated export uses source events only (CTR-FED-001 R08). | Future |

## Data / schema
Migration hooks for index docs are pure, deterministic and idempotent (CTR-SCH-001 R07). Stored docs are rebuilt, not rewritten in place. Previous alias metadata: `alias_prev`, `alias_current`, `retained_until`.

## Commands / queries / events
`index.rebuild` (PS-045-04) is the only import path. Export path: none for index.

## States & transitions
Rebuild states from PS-045-06 apply; `swapped` → `rolled_back` on operator command with dual control.

## Validation & errors
Rollback when previous alias is past `retained_until` → `INDEX.ROLLBACK_UNAVAILABLE` (retryable false).

## Authorization
Rollback requires `index.rebuild` capability with dual control (PS-045-05).

## Failure, idempotency, concurrency, offline
Rollback is idempotent per `rebuild_request_id`. Backup restore is blocked from exposing index until verification passes.

## Privacy, retention, abuse
Retained previous index honors the same purge deadlines (24 h for removed docs) so rollback cannot resurrect deleted listings: rollback replays the deletion log before alias swap.

## Observability & budgets
Metric `index_alias_swaps_total` and `index_rollbacks_total`; alert on any rollback (page ope_ on-call).

## Tests
- TEST-PS-045-10-01 (integration): exported user data contains no index doc.
- TEST-PS-045-10-02 (integration): restore from backup without index yields rebuilt index equal to source counts.
- TEST-PS-045-10-03 (integration): rollback after schema change resurrects no deleted listing.

## Acceptance criteria
1. Export fixtures contain zero index-doc keys.
2. Rebuild verification count equals source count before every swap.
3. Rollback test proves deletions honored.

## Assumptions & open decisions
- ASSUMPTION: 7-day retention of previous index for rollback (F15 to validate).
- D07 PROVISIONAL.
