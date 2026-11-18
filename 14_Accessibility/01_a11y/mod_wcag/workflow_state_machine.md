# PS-111-03 — workflow state machine

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-111-03. **Owner:** [14_Accessibility/01_a11y/mod_wcag](SPEC.md). **Implementing module:** 14_Accessibility/01_a11y/mod_wcag. **Consumers:** F07, F10, F15, F16 shared contracts per [dependency matrix](../../../DEPENDENCY_MATRIX.md); release gate, notifications, evidence per [01_a11y SPEC](../SPEC.md).

## Purpose and scope
**Business outcome:** each check run, waiver and profile moves through explicit, auditable states. Terminal states are never silently reopened. Every transition has an entry event and an actor.

**Exclusions:** the state of the external scanner tool (this module only sees what the tool reports); user-facing UI states (owned by the surface feature); federation state.

## Requirements
- PS-111-03.R01 — Outcome, actors and exclusions as stated above.
- PS-111-03.R02 — Edge cases covered: run started twice, run completed twice, waiver revoked after expiry, profile changed mid-run, tool silence (no heartbeat), results after cancel, duplicate event delivery.
- PS-111-03.R03 — Budget: a single transition commits in under 100 ms p95, excluding network to the client.
- PS-111-03.R04 — Check run state table.
- PS-111-03.R05 — Waiver state table.
- PS-111-03.R06 — Profile state table.
- PS-111-03.R07 — Timeouts, sweeper and retry-bounded recovery.
- PS-111-03.R08 — Compensation is by new rows or new states only. No row is deleted.

## Check run states
| State | Entry event | Allowed transitions | Guard | Terminal |
|---|---|---|---|---|
| QUEUED | `wcag.check_run.started.v1` (attempt n) | RUNNING, CANCELLED | No other QUEUED or RUNNING run for same surface and release_ref | no |
| RUNNING | `wcag.check_run.running.v1` (first finding batch or start ack from tool) | COMPLETED, FAILED, CANCELLED | Actor is `release_bot` or `a11y_reviewer` holding the run | no |
| COMPLETED | `wcag.check_run.completed.v1` | none | Exactly `criteria_total` finding rows exist for the run, one per required criterion, and the four counts sum to `criteria_total` | yes |
| FAILED | `wcag.check_run.failed.v1` (reason `tool_error`, `timeout` or `storage_error`) | QUEUED (new attempt), CANCELLED | attempt < 3 for retry; else WCAG_CHECK_RUN_ATTEMPTS_EXCEEDED | no |
| CANCELLED | `wcag.check_run.cancelled.v1` | none | Requested by `release_manager` or `operator`, or by sweeper after 2 failed attempts | yes |

Notes:
- A retry keeps the same `check_run_id` and increments `attempt`. Rows are upserted by (`check_run_id`, `sc_id`): a retry that reports a criterion overwrites that row and increments its `revision`. No row is deleted.
- Rows written by a FAILED attempt that the retry does not overwrite remain in place. They are valid only once the run reaches COMPLETED, which requires exact coverage of `criteria_total`. The gate reads COMPLETED runs only.

## Waiver states
| State | Entry event | Allowed transitions | Guard | Terminal |
|---|---|---|---|---|
| ACTIVE | `wcag.waiver.granted.v1` | EXPIRED, REVOKED | Approver differs from requester; approver holds approve capability; limit of 20 ACTIVE per surface not exceeded | no |
| EXPIRED | `wcag.waiver.expired.v1` (sweeper, when `expires_at` passes) | none | Only sweeper writes this state | yes |
| REVOKED | `wcag.waiver.revoked.v1` | none | Requested by `release_manager` or `operator`; `revoked_at` set | yes |

A waiver never returns to ACTIVE. A new waiver is granted instead.

## Profile states
| State | Entry event | Allowed transitions | Guard | Terminal |
|---|---|---|---|---|
| ACTIVE | `wcag.profile.changed.v1` (create or enable) | DISABLED, RETIRED, ACTIVE (new version, target change) | Caller holds profile write capability; `expected_version` matches | no |
| DISABLED | `wcag.profile.changed.v1` | ACTIVE, RETIRED | Same as above | no |
| RETIRED | `wcag.profile.changed.v1` | none | `scope_key` may be reused by a new profile row | yes |

Changing `target_level` produces a new version of the same row. It never changes existing findings. It changes the gate derived after the change.

## Timeouts and sweeper
- A run in RUNNING with no finding batch or heartbeat for 30 minutes moves to FAILED with reason `timeout`.
- The sweeper runs every 60 seconds. It is idempotent: it selects rows with a state filter and applies compare-and-set (see [failure_recovery_idempotency.md](failure_recovery_idempotency.md)).
- A waiver whose `expires_at` has passed moves to EXPIRED within 5 minutes.
- A QUEUED run not started within 15 minutes moves to CANCELLED with reason `not_started`.

## Compensation
- A run that was started by mistake is CANCELLED. Its findings are kept for audit.
- An incorrect automated outcome is corrected by a manual `CONFIRMED` or `OVERRIDDEN` review on the same finding row, which increments `revision`. The original outcome stays in the event log.
- A waiver granted in error is REVOKED. The derived gate changes immediately.

## Open decisions
- A-wcag-07 depends on the idempotency retention documented in [failure_recovery_idempotency.md](failure_recovery_idempotency.md).
- A-wcag-09: gate changes are internal release signals only.

## Testing expectations
- Transition tests `TEST-PS-111-03-T01` to `TEST-PS-111-03-T08` cover every row in the three tables and the sweeper timeouts.

## Acceptance criteria
- Every state in the three tables has an entry event and a terminal flag.
- No transition is possible from a terminal state (verified by tests).
- Sweeper run twice on the same data produces the same final state.
