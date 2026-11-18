# PS-098-04 — commands queries events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_limits. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-098-04.R01 | `limits.check` is internal (`sys_` callers from owning modules), synchronous, p95 ≤ 50 ms, timeout 200 ms. | MVP |
| PS-098-04.R02 | Policy commands require `Idempotency-Key` and `expected_revision`. | MVP |
| PS-098-04.R03 | Events are `limits.<past-tense verb>`; policy events only. Quota decisions are not events (they go to `dec_` records). | MVP |
| PS-098-04.R04 | No event contains account identifiers for quota decisions. | MVP |

## Data / schema
| Command | Body | Event |
|---|---|---|
| `limits.policy_draft` | `quota_key`, `scope_type`, `scope_value`, `jurisdiction`, `limit_value`, `rationale_code` | `limits.policy_drafted` |
| `limits.policy_activate` | `lim_id`, `expected_revision`, `approved_by` | `limits.policy_activated` |
| `limits.rollout_advance` | `lim_id`, `expected_revision`, `to_percent` | `limits.rollout_advanced` |
| `limits.policy_retire` | `lim_id`, `expected_revision`, `reason_code` | `limits.policy_retired` |
| `limits.check` (sys_) | `quota_key`, `scope_ref`, `jurisdiction`, `requested_delta` | none (returns decision; writes `dec_`) |

Query: `limits.get_active` (returns `lim_id`, `version`, `limit_value`, `rollout_percent`), operator scope for drafts.

## Commands / queries / events
Example check:
```http
POST /internal/v1/limits/check   (sys_ only)
{"quota_key": "active_listings", "scope_ref": "acc_01JA20...", "jurisdiction": "DE-NW", "requested_delta": 1}

200 {"decision": "allow", "policy_version": 3, "lim_id": "lim_01JA21...", "dec_id": "dec_01JA22..."}
```
Denied response: `422 LIMITS.QUOTA_EXCEEDED` with `quota_key` and `policy_version` only.

## States & transitions
Event per row in [PS-098-03](workflow_state_machine.md).

## Validation & errors
Codes in [PS-098-02](validation_rules.md).

## Authorization
Capabilities in [PS-098-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Retries in [PS-098-06](failure_recovery_idempotency.md).

## Privacy, retention, abuse
`limits.check` never returns usage counts. `jurisdiction` is a code, not a location.

## Observability & budgets
Span `limits.check` with `quota_key` and `decision` only.

## Tests
- `TEST-PS-098-04-01` contract: schemas validate; `QUOTA_EXCEEDED` body has no count.
- `TEST-PS-098-04-02` integration: check returns `policy_version` used.
- `TEST-PS-098-04-03` negative: `acc_` credential calls `limits.check` → denied.
- `TEST-PS-098-04-04` latency: check p95 ≤ 50 ms at 500 checks/s.

## Acceptance criteria
1. All commands and events documented with schema and idempotency.
2. Every allow or deny writes exactly one `dec_` record.
3. No event carries account identifiers for quota decisions.

## Assumptions & open decisions
- ASSUMPTION: `dec_` records are written asynchronously for allow decisions to keep p95 within budget (ASSUMPTION; decision audit still complete within 60 s).
- D07 (retention), PROVISIONAL default applies to decision records (unapproved).
