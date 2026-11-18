# PS-092-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/01_reporting/mod_appeals. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R04 scopes, R06 privileged grants, R07 dual control, R10 field visibility).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-092-05.R01 | Capabilities used: `apl.create`, `apl.read`, `apl.withdraw`, `apl.update`, `apl.decide`, `apl.export`. | MVP |
| PS-092-05.R02 | Reviewers act only through an active `mod_` grant with `case:<cas_>` scope (CTR-CAP-001 R06). | MVP |
| PS-092-05.R03 | Reviewer must not be the original decider or a reporter on the case (PS-092-02 R06). | MVP |
| PS-092-05.R04 | Reporter identity is never returned to the appellant or to the reviewer. | MVP |
| PS-092-05.R05 | Operator reads of appeal bodies require dual control (CTR-CAP-001 R07) because body is PRIVATE_PERSONAL. | MVP |

## Data / schema
| Actor | Action | Resource / scope | Outcome |
|---|---|---|---|
| `acc_` (affected subject) | `apl.create` | own `enf_`, `spm_` or `rpt_` | ALLOW within window |
| `acc_` (appellant) | `apl.read` | own `apl_` | ALLOW: state, decision code, reason category |
| `acc_` (appellant) | `apl.withdraw` | own `apl_` in `received`, `accepted`, `in_review` | ALLOW |
| `mod_` with grant | `apl.read`, `apl.update` (assign) | `case:cas_` | ALLOW if not conflicted |
| `mod_` assigned reviewer | `apl.decide` | `case:cas_`, `apl_` assigned to self | ALLOW |
| `mod_` original decider or reporter | `apl.decide` | same case | DENY `APPEALS.REVIEWER_CONFLICT` |
| `ope_` | `apl.read` | any `apl_` | DENY (single approval); ALLOW with dual control and `aud_` |
| `ope_` | `apl.export` | case scope | ALLOW with dual control; bodies excluded |
| `sys_` | any | any | DENY except enforcement acknowledgment writes |

Field visibility (CTR-CAP-001 R10): `body` = `participant` (appellant, assigned reviewer); `reviewer_ref` = `case`; `decision_code` and `state` = `participant`; `reason_code` = `case`.

## Commands / queries / events
Grants carry `constraints.purpose` = `appeal_review` and `case_id` (CTR-CAP-001 R06). `expires_at` ≤ 72 h.

## States & transitions
Authorization does not change state. Denied calls write a `dec_` record only.

## Validation & errors
Denied calls to other people's appeals return `SYS.NOT_FOUND` (CTR-ERR-001 R08).

## Failure, idempotency, concurrency, offline
Grant revocation takes effect at the next decision; decision cache is zero for `apl.read` on bodies (CTR-CAP-001 R09).

## Privacy, retention, abuse
Each reviewer read of `body` writes an `aud_` record with `apl_id`, purpose and decision ID, no content.

## Observability & budgets
Metric `appeals_authz_denied_total{action,reason}`; alert on repeated `REVIEWER_CONFLICT` by one reviewer.

## Tests
- `TEST-PS-092-05-01` unit: each matrix row returns its outcome.
- `TEST-PS-092-05-02` negative: reporter of the case attempts `apl.decide` → `APPEALS.REVIEWER_CONFLICT`.
- `TEST-PS-092-05-03` negative: `ope_` single approval reads body → denied.
- `TEST-PS-092-05-04` negative: appellant reads reporter identity field → field absent (not null).

## Acceptance criteria
1. Dual control enforced for operator body access.
2. Reviewer conflict check cannot be bypassed by request body fields (CTR-CAP-001 R11).
3. Every body read by a reviewer or operator produces an `aud_` record.

## Assumptions & open decisions
- ASSUMPTION: reviewer selection is manual in MVP; automatic assignment is future scope.
- D10 (auth and portability), PROVISIONAL default: appellant identity uses the pseudonym rules of F07 (unapproved).
