# PS-098-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_limits. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R02, R03, R06, R07, R08), CTR-PRV-001 (R04, R07).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-098-05.R01 | Capabilities used: `lim.read`, `lim.create` (draft), `lim.administer` (activate, advance, retire). | MVP |
| PS-098-05.R02 | `lim.administer` requires `ope_` dual control (two distinct approvers, CTR-CAP-001 R07). | MVP |
| PS-098-05.R03 | `limits.check` requires a `sys_` principal with `lim.read` for the calling module only. | MVP |
| PS-098-05.R04 | No `acc_` may read another account's quota decisions. An account may read its own active limit values for its quota keys. | MVP |
| PS-098-05.R05 | Automated actors cannot draft, activate or advance policies. | MVP |

## Data / schema
| Actor | Action | Resource / scope | Outcome |
|---|---|---|---|
| `sys_` (owning module) | `lim.read` (check) | `lim_` active policy | ALLOW for registered calling module |
| `sys_` (other) | any | any | DENY |
| `mod_` (grant, purpose `policy_draft`) | `lim.create` | global | ALLOW draft |
| `ope_` (first approver) | `lim.administer` | `lim_` | ALLOW with second distinct `ope_` |
| `ope_` single | `lim.administer` | `lim_` | DENY (dual control) |
| `acc_` | `lim.read` | own quota key values only | ALLOW: `limit_value`, `quota_key`; no decisions |
| `acc_` | `lim.read` | another account's decisions | DENY `SYS.NOT_FOUND` |

Field visibility (CTR-CAP-001 R10): `created_by`, `approved_by` = `case`; `rationale_code` = `case`; `limit_value` = `public`.

## Commands / queries / events
Grants for `mod_` drafting carry `constraints.purpose` = `policy_draft` and `expires_at` ≤ 72 h.

## States & transitions
Authorization does not change state.

## Validation & errors
`LIMITS.APPROVER_CONFLICT` for self-approval; `CAP.SELF_APPROVAL_FORBIDDEN` from the capability layer.

## Failure, idempotency, concurrency, offline
Zero TTL for `lim.administer` decisions; policy read cache for `lim.read` ≤ 60 s (CTR-CAP-001 R09 for non-sensitive reads).

## Privacy, retention, abuse
Every decision read by an operator writes `aud_` with decision ID and purpose.

## Observability & budgets
Metric `limits_authz_denied_total{capability,actor_kind}`.

## Tests
- `TEST-PS-098-05-01` unit: each matrix row yields its outcome.
- `TEST-PS-098-05-02` negative: `sys_` of an unregistered module calls check → denied.
- `TEST-PS-098-05-03` negative: single `ope_` activates → denied.
- `TEST-PS-098-05-04` negative: `acc_` reads another account's decisions → `SYS.NOT_FOUND`.

## Acceptance criteria
1. Dual control enforced for activation and rollout advancement.
2. No account can read another account's quota state.
3. Registered-caller list is tested and reviewed.

## Assumptions & open decisions
- ASSUMPTION: calling-module registry is maintained by F16 (`sys_` principal assignments).
- D10 (auth and portability), PROVISIONAL default: no recovery path bypasses policy approval (unapproved).
