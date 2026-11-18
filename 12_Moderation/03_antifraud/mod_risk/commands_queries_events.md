# PS-100-04 — commands queries events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_risk. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-100-04.R01 | `risk.assess` is internal (`sys_`), idempotent on (subject_ref, trigger correlation_id). | MVP |
| PS-100-04.R02 | Assess p95 ≤ 500 ms asynchronous; the triggering command never waits for the assessment. | MVP |
| PS-100-04.R03 | Reviewer and step-up commands require `Idempotency-Key` and `expected_revision`. | MVP |
| PS-100-04.R04 | Events are `risk.<past-tense verb>`; payloads contain IDs, state, tier-free category codes only. | MVP |

## Data / schema
| Command | Body | Event |
|---|---|---|
| `risk.assess` (sys_) | `subject_type`, `subject_ref`, `trigger`, `signal_refs[]`, `correlation_id` | `risk.assessed` (+ routing events) |
| `risk.clear` (reviewer) | `rsk_id`, `expected_revision`, `case_ref` | `risk.cleared` |
| `risk.escalate` (reviewer) | `rsk_id`, `expected_revision`, `case_ref` | `risk.escalated` |
| `risk.step_up_result` (F07 callback) | `rsk_id`, `expected_revision`, `verified: bool` | `risk.cleared` or `risk.expired` |

Queries: `risk.get_status` (subject: generic state only), `risk.list_queue` (reviewer, case scope, cursor ≤ 100).

## Commands / queries / events
Example:
```http
POST /internal/v1/risk/assess   (sys_ only)
{"subject_type": "lst", "subject_ref": "lst_01JA30...", "trigger": "publish", "signal_refs": ["sig_01JA31..."], "correlation_id": "cor_01JA32..."}

202 {"rsk_id": "rsk_01JA33...", "state": "assessed", "revision": 1}
```
Event payload: `rsk_id`, `subject_type`, `subject_ref`, `state`, `category_codes`, `model_version`. No tier in events sent to subject-facing consumers; tier is visible to case-scoped consumers only.

## States & transitions
Event per transition in [PS-100-03](workflow_state_machine.md).

## Validation & errors
Codes in [PS-100-02](validation_rules.md).

## Authorization
Capabilities in [PS-100-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Retry rules in [PS-100-06](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Events carry no feature values or signal values. `signal_refs` appear only in case-scoped events.

## Observability & budgets
Span `risk.<command>` with `request_id`, code, tier bucket (not subject ID).

## Tests
- `TEST-PS-100-04-01` contract: schemas validate; subject-facing events omit tier.
- `TEST-PS-100-04-02` integration: duplicate `risk.assess` for the same trigger → one assessment.
- `TEST-PS-100-04-03` integration: listing publish does not wait for assessment (latency test).
- `TEST-PS-100-04-04` negative: `acc_` credential calls `risk.assess` → denied.

## Acceptance criteria
1. Each command and event documented with schema, idempotency and error list.
2. Trigger commands never block on risk assessment (measured).
3. No subject-facing event reveals tier or signal references.

## Assumptions & open decisions
- ASSUMPTION: asynchronous assessment means a listing may be publicly visible briefly unless the hold is applied synchronously for `critical` prior results; F01 decides the publish-time policy (PENDING F01 confirmation).
- D07 (retention), PROVISIONAL default applies to assessments (unapproved).
