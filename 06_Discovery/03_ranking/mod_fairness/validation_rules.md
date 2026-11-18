# PS-046-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/03_ranking/mod_fairness. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-PRV-001, CTR-SCH-001.

**Decision labels:** All cap values ASSUMPTION (OPEN, F06).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-046-02.R01 | Policy caps within ranges in PS-046-01 R02–R03; outside → `FAIRNESS.CONFIG_INVALID` (422). | MVP |
| PS-046-02.R02 | Promoted slots cannot be disabled in a way that hides labels: a policy with `promoted_label` ≠ `Promoted` → `FAIRNESS.CONFIG_INVALID`. | MVP |
| PS-046-02.R03 | One ACTIVE policy per scope; second activation → `FAIRNESS.POLICY_CONFLICT` (409). | MVP |
| PS-046-02.R04 | Policy changes that loosen a cap require dual approval (CTR-CAP-001 R07 rule applied by analogy, ASSUMPTION) → else `CAP.SELF_APPROVAL_FORBIDDEN` or `FAIRNESS.APPROVAL_MISSING` (422). | MVP |
| PS-046-02.R05 | Audit record shape checked before write; invalid audit → `FAIRNESS.AUDIT_INVALID` (internal, non-retryable, logged without values). | MVP |
| PS-046-02.R06 | Ranking input features must pass the forbidden-feature check in PS-046-05 (`FAIRNESS.FEATURE_FORBIDDEN`, 422). | MVP |

## Data / schema
Checks: schema → ranges (R01) → label (R02) → uniqueness (R03) → approval (R04) → feature list (R06).

## Commands / queries / events
Applies to `rank_policy.draft`, `rank_policy.activate`, `rank_policy.retire`.

## States & transitions
Gates only; PS-046-03 holds transitions.

## Validation & errors
All `FAIRNESS.*` non-retryable.

## Authorization
Activation requires two approvers (dual control, ASSUMPTION).

## Failure, idempotency, concurrency, offline
Activation idempotent per policy ID and version.

## Privacy, retention, abuse
Policy diffs contain no listing or seller IDs.

## Observability & budgets
`fairness_validation_reject_total{code}`.

## Tests
- TEST-PS-046-02-01 (unit): one case per R01–R06 code.
- TEST-PS-046-02-02 (boundary): cap 0.20 passes; 0.21 fails.
- TEST-PS-046-02-03 (security): single approver cannot activate loosened caps.
- TEST-PS-046-02-04 (negative): label other than `Promoted` rejected.

## Acceptance criteria
1. Every rule maps to a test and a code.
2. No policy activation without required approvals.
3. Label rule enforced.

## Assumptions & open decisions
- ASSUMPTION: approval rules and ranges.
