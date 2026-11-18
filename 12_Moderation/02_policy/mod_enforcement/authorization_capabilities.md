# PS-096-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/02_policy/mod_enforcement. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R04 scopes, R06 privileged grants, R07 dual control, R08 audit), CTR-FED-001 (R07).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-096-05.R01 | Capabilities used: `enf.create`, `enf.accept`, `enf.revoke`, `enf.read`. | MVP |
| PS-096-05.R02 | Applying any action requires a `mod_` grant with `case:<cas_>` scope and `constraints.purpose` = `enforcement`. | MVP |
| PS-096-05.R03 | `suspend_account` approval (`enf.accept`) requires a `mod_` distinct from the applier and holding a case grant. | MVP |
| PS-096-05.R04 | No automated actor (`sys_`) may apply, approve, reverse or supersede any action. | MVP |
| PS-096-05.R05 | Reversal (`enf.revoke`) is allowed to the applier's case lead or an `ope_` with dual control; the original applier may not reverse their own action alone. | MVP |

## Data / schema
| Actor | Action | Resource / scope | Outcome |
|---|---|---|---|
| `mod_` (grant, case) | `enf.create` | `case:cas_` | ALLOW for warn, hide, unpublish, remove_content, restrict_publish |
| `mod_` (grant, case) | `enf.create` (suspend_account) | `case:cas_` | ALLOW, enters `pending_approval` |
| `mod_` distinct from applier | `enf.accept` | `case:cas_` | ALLOW for pending suspend; self → `CAP.SELF_APPROVAL_FORBIDDEN` |
| `mod_` applier | `enf.revoke` | own action | DENY alone; ALLOW with second `mod_` or `ope_` approval |
| `ope_` dual control | `enf.revoke`, `enf.read` | `case:cas_` | ALLOW |
| `acc_` (target owner) | `enf.read` | own target | ALLOW: type, dates, reason category; no `applier` or `approver` IDs |
| `acc_` (other) | any | any | DENY `SYS.NOT_FOUND` |
| `sys_` | any | any | DENY |

Field visibility (CTR-CAP-001 R10): `approver_ref`, `actor_ref` = `case`; `reason_code`, `action_type`, `expires_at` = `participant` (target owner); `case_id` = `case`.

## Commands / queries / events
Grants: `expires_at` ≤ 72 h after `not_before`; `case_id` required. Grant revocation takes effect immediately for writes.

## States & transitions
Authorization does not change state.

## Validation & errors
Denials: `ENFORCE.CASE_REQUIRED` (missing grant or case), `CAP.SELF_APPROVAL_FORBIDDEN`, `SYS.FORBIDDEN` for applier-only reversal.

## Failure, idempotency, concurrency, offline
Zero decision-cache TTL for all writes (CTR-CAP-001 R09).

## Privacy, retention, abuse
Every case-scoped read writes an `aud_` record with `enf_id`, purpose and decision ID (CTR-CAP-001 R08).

## Observability & budgets
Metric `enforce_authz_denied_total{capability,reason}`; alert when one `mod_` applies more than 20 actions per hour (ASSUMPTION; anomaly signal).

## Tests
- `TEST-PS-096-05-01` unit: each matrix row returns its outcome.
- `TEST-PS-096-05-02` negative: `sys_` applies hide → denied.
- `TEST-PS-096-05-03` negative: applier approves own suspension → `CAP.SELF_APPROVAL_FORBIDDEN`.
- `TEST-PS-096-05-04` negative: target owner reads `approver_ref` → field absent.

## Acceptance criteria
1. No automated actor can change any action.
2. Dual control enforced on suspension and reversal.
3. Each case-scoped read produces an `aud_` record.

## Assumptions & open decisions
- ASSUMPTION: 20 actions per hour anomaly threshold is a starting point for F16 review.
- D10 (auth and portability), PROVISIONAL default: operator recovery never bypasses proof requirements (unapproved).
