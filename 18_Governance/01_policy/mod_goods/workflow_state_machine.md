# PS-144-03 — workflow state machine

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-144-03. **Owner:** [18_Governance/01_policy/mod_goods](SPEC.md). **Implementing module:** 18_Governance/01_policy/mod_goods. **Consumers:** F01 listings (publication waits on decision), F12 moderation (referral and appeal), F13 notifications (status messages). **Upstream:** F07 identity, F16 security. See [dependency matrix](../../../DEPENDENCY_MATRIX.md).

## Purpose and scope
**Business outcome.** Policy rules and review cases move through explicit, auditable states. A listing is never published on an implied decision: publication waits for a recorded `ALLOW` or `ALLOW_WITH_CONDITIONS`.

**Exclusions.** Listing states (draft, live, sold, expired) belong to F01. Payment and delivery states belong to F09 and F04 and are not modeled here.

## Rule lifecycle (`goods_policy_rule.lifecycle_state`)
| State | Entry event | Allowed transitions | Guard | Terminal |
|---|---|---|---|---|
| `EDITING` | `DraftGoodsPolicyRule` accepted | → `SCHEDULED` via Activate with `effective_from` > now; → `ACTIVE` via Activate with `effective_from` ≤ now + 5 s; → `RETIRED` via Discard | Content editable only here; drafter or OPS may edit | no |
| `SCHEDULED` | Activate with future `effective_from` | → `ACTIVE` via system tick at `effective_from`; → `EDITING` via Cancel before `effective_from` | Activator ≠ drafter; I1 no overlap; content immutable (I3) | no |
| `ACTIVE` | System tick or immediate activation | → `RETIRED` via Retire, or system at `effective_until` | Retire requires `retirement_reason_code` | no |
| `RETIRED` | Retire, Discard, or `effective_until` reached | none | — | **yes** |

A Discard from `EDITING` sets `retirement_reason_code = DISCARDED_BEFORE_ACTIVE`. Cancel is refused once `effective_from` has passed, returning GOODS_RULE_STATE_INVALID.

## Review case lifecycle (`goods_review_case.state`)
| State | Entry event | Allowed transitions | Guard | Terminal |
|---|---|---|---|---|
| `OPEN` | `EvaluateGoods` returns `HOLD_FOR_REVIEW`; case created with `sla_due_at` = opened_at + 72 h | → `IN_REVIEW` via Claim; → `ESCALATED` via system at `sla_due_at`; → `WITHDRAWN` via owner withdraw | Claimant ≠ subject owner (rule 28) | no |
| `ESCALATED` | System at `sla_due_at` | → `IN_REVIEW` via Claim by a senior PRV; → `WITHDRAWN` via owner withdraw | Escalation raises notice to AUD and PRV lead | no |
| `IN_REVIEW` | Claim accepted; `lease_expires_at` = now + 24 h | → `OPEN` via Release or lease expiry; → `APPROVED` via Decide(ALLOW or ALLOW_WITH_CONDITIONS); → `REJECTED` via Decide(REJECT); → `REFERRED` via Decide(REFER); → `WITHDRAWN` via owner withdraw | Decide requires a reason code valid for the outcome (rule 27); caller holds the lease | no |
| `APPROVED` | Decide with allow outcome | none | — | **yes** |
| `REJECTED` | Decide with reject outcome | none; appeal is handled in F12 | — | **yes** |
| `REFERRED` | Decide with refer outcome | none; referral state is tracked in outbox (see failure_recovery_idempotency.md) | — | **yes** |
| `WITHDRAWN` | Owner withdraws the listing | none | — | **yes** |

Each Decide writes a new `goods_decision` row (`origin = REVIEW`) in the same transaction as the state change. The original `HOLD_FOR_REVIEW` row is never changed.

## Timers
- **Review SLA: 72 h** from opened_at to `ESCALATED` (A-goods-08).
- **Review lease: 24 h** from Claim. On expiry the case returns to `OPEN` with `assigned_reviewer_ref` cleared.
- **Scheduled activation sweep:** every 30 s, rules in `SCHEDULED` with `effective_from` ≤ now become `ACTIVE`. Missed ticks are caught by the next sweep.
- **Effective-until sweep:** every 30 s, `ACTIVE` rules with `effective_until` ≤ now become `RETIRED` with `retirement_reason_code = POLICY_WITHDRAWN`.

## Preconditions and postconditions
- Activate: rule is `EDITING`, passes validation, passes I1 and I4, and has `activated_by_ref` ≠ `drafted_by_ref`. Postcondition: `lifecycle_state` is `SCHEDULED` or `ACTIVE`, `version` +1, event `goods.rule.activated.v1` in outbox.
- Decide: case is `IN_REVIEW`, lease held by caller, `expected_version` matches. Postcondition: terminal state, decision row appended, event `goods.review.decided.v1`, and for REFER also `goods.referral.requested.v1`.
- Evaluate: category `ACTIVE`, subject unique per call (idempotency). Postcondition: decision row appended; if outcome is `HOLD_FOR_REVIEW`, case created in `OPEN`.

## Consent and revocation
Owner withdrawal of a listing moves its open case to `WITHDRAWN`. Revocation of a reviewer capability releases active leases within 60 s (A-goods-14). Revocation never alters terminal decisions.

## Compensation
- No compensating writes are needed for rule lifecycle; invalid states are refused before write.
- If a referral cannot be delivered, the case stays `REFERRED` with referral status `PENDING`; delivery is retried (failure_recovery_idempotency.md). The case is not reopened.

## Concurrency and recovery
- Two activations racing for overlapping ranges: one commits, the other receives GOODS_RULE_OVERLAP.
- Two reviewers claiming one case: one succeeds, the other receives GOODS_REVIEW_LEASE_HELD.
- Decide after lease expiry: refused with GOODS_REVIEW_LEASE_HELD or GOODS_REVIEW_STATE_INVALID; the reviewer must re-claim.

## Assumptions
- **A-goods-08.** Review SLA is 72 h and lease is 24 h. Values are concrete defaults pending operational review; changes are configuration, not schema changes.

## Open decisions
- **OD-GOODS-02.** Automatic F12 appeal on `REJECTED` (see domain_schema.md).
- Related: [DECISIONS.md](../../../DECISIONS.md) D08 (offline pending queue) applies to reviewer clients; this module accepts only server-acknowledged writes.
