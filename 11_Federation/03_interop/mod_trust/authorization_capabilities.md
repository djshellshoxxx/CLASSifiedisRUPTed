# PS-091-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/03_interop/mod_trust. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (grant model, decision records), CTR-FED-001 (peer scopes).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-091-05.R01 | Capabilities used: `fpr.read`, `fpr.update`, `fpr.administer`, `fpr.moderate`. No other verbs are declared by this module. | MVP |
| PS-091-05.R02 | Default deny (CTR-CAP-001 R01). Automated actors cannot admit, restore or revoke. | MVP |
| PS-091-05.R03 | `admit`, `restore` and `revoke` require two distinct `ope_` approvers; self-approval returns `CAP.SELF_APPROVAL_FORBIDDEN`. | MVP |
| PS-091-05.R04 | Every decision emits an `aud_` record with decision ID and reason code, no content (CTR-CAP-001 R08). | MVP |
| PS-091-05.R05 | Peers may read only their own `trust_state`. | MVP |

## Data / schema
Action matrix (normative for this module):

| Actor | Action | Resource / scope | Outcome |
|---|---|---|---|
| `ope_` (approver 1 and 2) | `fpr.administer` (admit, restore, revoke) | `fpr_` global | ALLOW only with second distinct `ope_` approval |
| `ope_` | `fpr.administer` (restrict, quarantine) | `fpr_` global | ALLOW single operator |
| `sys_` threshold engine | `fpr.update` (restrict only) | `fpr_` global | ALLOW; other transitions DENY `FED.PEER_NOT_TRUSTED` |
| `mod_` with grant | `fpr.moderate` (quarantine) | `case:cas_` | ALLOW only with matching `case_id`; restore DENY |
| `fpr_` (the peer) | `fpr.read` | self | ALLOW own `trust_state` and `revision` |
| any `acc_` | any | `fpr_` | DENY `SYS.NOT_FOUND` (CTR-ERR-001 R08) |
| any actor | any | `trs_` content | DENY except `ope_` with case scope and dual control |

Grants for `mod_` or `sys_` carry `constraints.purpose` and `expires_at` ≤ 72 h after `not_before` (CTR-CAP-001 R06).

## Commands / queries / events
Authorization check runs before validation of the body (CTR-ERR-001 R08 for unreadable resources).

## States & transitions
Authorization does not change state. A denied command writes a `dec_` record only.

## Validation & errors
Denials: `CAP.SELF_APPROVAL_FORBIDDEN` (forbidden), `CAP.GRANT_NOT_ACTIVE`, `FED.PEER_NOT_TRUSTED` for peer-to-peer checks.

## Failure, idempotency, concurrency, offline
Revocation of a grant takes effect at the next decision. Writes have zero decision-cache TTL (CTR-CAP-001 R09).

## Privacy, retention, abuse
`trs_` reads by `ope_` are privileged reads with `aud_` records; `reason_code` visible to case scope only.

## Observability & budgets
Metric `trust_authz_denied_total{capability,actor_kind}`; alert on any `sys_` denial spike.

## Tests
- `TEST-PS-091-05-01` unit: every matrix row yields its stated outcome.
- `TEST-PS-091-05-02` negative: `sys_` attempts quarantine → denied and `dec_` written.
- `TEST-PS-091-05-03` negative: same `ope_` approves own admission → `CAP.SELF_APPROVAL_FORBIDDEN`.
- `TEST-PS-091-05-04` negative: `acc_` reads a peer → `SYS.NOT_FOUND`.

## Acceptance criteria
1. Every command in PS-091-04 maps to exactly one capability row.
2. No automated actor can change any state other than `trusted` → `restricted`.
3. Dual control is enforced in code and in tests.

## Assumptions & open decisions
- ASSUMPTION: "admin" in PS-091-03 means `ope_` operator principal (F16 owns `ope_`).
- ASSUMPTION: `fpr.moderate` is a new capability ID requiring F16 vocabulary approval (CTR-CAP-001 versioning: MINOR).
- D10 (auth and portability), PROVISIONAL default: user-controlled keys; operator recovery never bypasses proof (unapproved).
