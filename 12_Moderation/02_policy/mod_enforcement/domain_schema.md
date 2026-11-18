# PS-096-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/02_policy/mod_enforcement. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-CAP-001, CTR-PRV-001, CTR-SCH-001 (referenced, not redefined).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-096-01.R01 | An enforcement action `enf_` has one action type, one target, one case `cas_`, one reason code, and an effective window. | MVP |
| PS-096-01.R02 | Action types: `warn`, `hide`, `unpublish`, `remove_content`, `restrict_publish`, `suspend_account`. No other type exists in MVP. | MVP |
| PS-096-01.R03 | `expires_at` is required for `hide`, `restrict_publish` and `suspend_account`, and ≤ 90 days after `effective_at` (ASSUMPTION). | MVP |
| PS-096-01.R04 | Enforcement never changes commerce money state. It changes visibility or account permissions only. | MVP |
| PS-096-01.R05 | Each change is an append-only `enf_event` row with per-action `revision` starting at 1. | MVP |

## Data / schema
```sql
CREATE TABLE enf_action (
  enf_id         CHAR(30) PRIMARY KEY,           -- enf_ ULID; prefix PENDING CTR-ID-001 registry entry
  action_type    TEXT NOT NULL CHECK (action_type IN
                   ('warn','hide','unpublish','remove_content','restrict_publish','suspend_account')),
  target_type    TEXT NOT NULL CHECK (target_type IN ('acc','lst','srv','rnt','auc','msg','thr')),
  target_id      CHAR(30) NOT NULL,              -- ID prefix must match target_type
  case_id        CHAR(30) NOT NULL,              -- cas_
  reason_code    TEXT NOT NULL,                  -- registry, see PS-096-02
  state          TEXT NOT NULL,                  -- PS-096-03
  revision       INTEGER NOT NULL CHECK (revision >= 1),
  effective_at   TIMESTAMPTZ NULL,
  expires_at     TIMESTAMPTZ NULL,
  supersedes_id  CHAR(30) NULL REFERENCES enf_action(enf_id),
  actor_ref      CHAR(30) NOT NULL,              -- mod_ principal that applied
  approver_ref   CHAR(30) NULL,                  -- second mod_ for suspend_account
  effect_status  TEXT NOT NULL DEFAULT 'pending' -- pending | confirmed | failed
);
```
Field classes (CTR-PRV-001): `target_id`, `reason_code`, `state`, `action_type` = PSEUDONYMOUS; `actor_ref`, `approver_ref` = PSEUDONYMOUS (operator scope). No narrative field exists. Evidence stays in `mod_evidence`.

## Commands / queries / events
See [PS-096-04](commands_queries_events.md).

## States & transitions
See [PS-096-03](workflow_state_machine.md).

## Validation & errors
See [PS-096-02](validation_rules.md).

## Authorization
See [PS-096-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
See [PS-096-06](failure_recovery_idempotency.md).

## Privacy, retention, abuse
See [PS-096-07](privacy_retention_abuse.md).

## Observability & budgets
See [PS-096-08](observability_performance.md).

## Tests
- `TEST-PS-096-01-01` unit: `target_type` and `target_id` prefix mismatch rejected by constraint.
- `TEST-PS-096-01-02` unit: `hide` without `expires_at` rejected.
- `TEST-PS-096-01-03` contract: no free-text column exists (schema scan).

## Acceptance criteria
1. Each action row has exactly one case and one target.
2. No column can represent money, balances or payment identifiers.
3. Every action with an expiry has an expiry job test.

## Assumptions & open decisions
- ASSUMPTION: `enf_` is a new prefix to be registered with CTR-ID-001 (owner F12).
- ASSUMPTION: `supersedes_id` links a MODIFIED appeal outcome to its replacement action.
- D09 (rentals and deposits), PROVISIONAL default: no platform custody; enforcement cannot hold deposits (unapproved).
