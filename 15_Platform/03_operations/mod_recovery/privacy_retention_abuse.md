# PS-122-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/03_operations/mod_recovery (F15.S03.M03). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-122-07.R01 | Deletions and legal holds are replayed before any restored read path opens (CTR-PRV-001 R06, R07). | MVP |
| PS-122-07.R02 | Isolated restore targets have no access to production secrets, third-party processors or push services. | MVP |
| PS-122-07.R03 | Isolated data is destroyed 72 h after run end unless a legal hold names the run (PS-122-03 R03). | MVP |
| PS-122-07.R04 | Restoring LOCATION_PRECISE data requires dual control and is limited to the holder's case (CTR-PRV-001 R03, R07). | MVP |
| PS-122-07.R05 | Drill data uses synthetic datasets only; production restore data is never used for drills. | MVP |
| PS-122-07.R06 | Restore does not re-send notifications or emails to users. | MVP |

## Data / schema
Retention of run records RET-AUD (12 months); restored content RET-LEGAL or destroyed per R03.

## Commands / queries / events
Destruction of isolated data is a sys job that emits `restore.purged` with counts.

## States & transitions
See PS-122-03 `aborted`, `failed`, `promoted`.

## Validation & errors
`PRV.HOLD_SCOPE_INVALID` for holds without scope.

## Authorization
See PS-122-05.

## Failure, idempotency, concurrency, offline
Destruction is idempotent on run ID.

## Privacy, retention, abuse
Abuse: a restore used to read data without approval. Mitigated by dual control, isolation and audit. Insider misuse detection: alert on restore run without linked change (PS-122-05).

## Observability & budgets
Metric: `restore_isolated_bytes_outstanding`; alert when > 0 after 72 h.

## Tests
- TEST-PS-122-07-01 (integration): isolated target cannot reach push or processor endpoints.
- TEST-PS-122-07-02 (integration): notifications suppressed during restore.
- TEST-PS-122-07-03 (lifecycle): isolated data destroyed at 72 h.
- TEST-PS-122-07-04 (privacy): restored LOCATION_PRECISE blocked without dual control.

## Acceptance criteria
1. No outbound path from isolated target to user-facing services (TEST-01).
2. TEST-PS-122-07-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: 72 h destruction window.
- OPEN (F10): legal hold interaction with drill records.
