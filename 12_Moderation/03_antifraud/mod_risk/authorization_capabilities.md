# PS-100-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_risk. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R02–R04, R06–R10), CTR-PRV-001 (R01, R03).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-100-05.R01 | Capabilities used: `rsk.read`, `rsk.create` (assess, sys_ only), `rsk.moderate` (clear, escalate), `rsk.update` (step-up result, sys_ callback). | MVP |
| PS-100-05.R02 | Reviewers need a `mod_` grant with `case:<cas_>` scope and purpose `risk_review`. | MVP |
| PS-100-05.R03 | Escalation requires a second `mod_` reviewer distinct from the first. | MVP |
| PS-100-05.R04 | No `ope_` may read tiers or reasons without case scope and dual control. | MVP |
| PS-100-05.R05 | Subjects read only their generic state (`under_review`, `verification_needed`, `resolved`). | MVP |

## Data / schema
| Actor | Action | Resource / scope | Outcome |
|---|---|---|---|
| `sys_` (assessor) | `rsk.create` | any subject | ALLOW |
| `sys_` (F07 callback) | `rsk.update` | `rsk_` in `step_up_pending` | ALLOW only for that transition |
| `mod_` (grant) | `rsk.read`, `rsk.moderate` (clear) | `case:cas_` | ALLOW if the reviewer is not the assessor-linked reviewer for the same case |
| `mod_` (first reviewer) | `rsk.moderate` (escalate) | `case:cas_` | ALLOW; the escalated case needs a different `mod_` |
| `mod_` (second reviewer) | `rsk.moderate` (clear escalated) | `case:cas_` | ALLOW if distinct from first |
| `ope_` | `rsk.read` | any | DENY; ALLOW with dual control in case scope |
| `acc_` (subject) | `rsk.read` | own subject | ALLOW: generic state only |
| `acc_` (other) | any | any | DENY `SYS.NOT_FOUND` |

Field visibility (CTR-CAP-001 R10): `tier`, `reason_codes`, `signal_refs`, `model_version` = `case`; `state` = `participant` (generic mapping for subject); `feature_hash` = `never`.

## Commands / queries / events
Reviewer grants carry `constraints.purpose` = `risk_review`, `case_id`, `expires_at` ≤ 72 h.

## States & transitions
Authorization does not change state.

## Validation & errors
`SYS.NOT_FOUND` for unreadable assessments; `SYS.FORBIDDEN` for `sys_` attempts to clear.

## Failure, idempotency, concurrency, offline
Zero-TTL decision cache for writes.

## Privacy, retention, abuse
Each reviewer read of tier or signal references writes an `aud_` record.

## Observability & budgets
`risk_authz_denied_total{capability,actor_kind}`; alert on repeated denials for one reviewer.

## Tests
- `TEST-PS-100-05-01` unit: matrix rows return outcomes.
- `TEST-PS-100-05-02` negative: `sys_` clears an assessment → `SYS.FORBIDDEN`.
- `TEST-PS-100-05-03` negative: same reviewer escalates and clears → `CAP.SELF_APPROVAL_FORBIDDEN` or equivalent.
- `TEST-PS-100-05-04` negative: subject reads tier → field absent.

## Acceptance criteria
1. No automated actor clears or escalates.
2. Subjects never see tiers or reasons.
3. Every reviewer read writes an `aud_` record.

## Assumptions & open decisions
- ASSUMPTION: the escalation path requires two distinct reviewers; a single reviewer cannot clear their own escalation.
- D10 (auth and portability), PROVISIONAL default: step-up uses F07 recovery rules, never bypassing proof (unapproved).
