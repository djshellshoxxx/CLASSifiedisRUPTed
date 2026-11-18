# PS-053-05 — authorization and capabilities
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/01_accounts/mod_recovery. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-053-05.R01 | Default deny (CTR-CAP-001 R01). Capabilities used: `recovery_request.create`, `recovery_request.attest`, `recovery_request.withdraw`, `recovery_request.execute`, `recovery_method.create`, `recovery_method.delete`, `recovery_method.read`. | MVP |
| PS-053-05.R02 | Proof-bound token scoped to one `rec_` and one method; expires with `expires_at`. Not usable for any other resource. | MVP |
| PS-053-05.R03 | Support operators (`ope_`) hold no recovery capability on credentials. They may read case metadata only (CTR-CAP-001 R12). | MVP |
| PS-053-05.R04 | Enrolment and revocation of methods require step-up session (≤ 5 min). | MVP |
| PS-053-05.R05 | Moderator read of `rec_` requires `case:<cas_>` grant, purpose, expiry ≤ 72 h. | MVP |

## Data / schema
Relation rules: `self` for owner (derived from `acc_` at decision time, CTR-CAP-001 R05). No stored grant for owner access.

## Commands / queries / events
Capability per command: start → `recovery_request.create` (anonymous, rate-limited, generic result); submit_proof → `recovery_request.attest` (proof token); complete → `recovery_request.execute` (owner session); cancel → `recovery_request.withdraw` (owner session or proof); enroll → `recovery_method.create`; revoke → `recovery_method.delete`.

## States & transitions
Not applicable beyond the transitions in [workflow_state_machine](workflow_state_machine.md).

## Validation & errors
Denied actions return `SYS.NOT_FOUND` when the requester cannot see the resource, `SYS.FORBIDDEN` otherwise (CTR-CAP-001 action matrix).

## Authorization matrix
| Actor | Action | Resource | Outcome |
|---|---|---|---|
| anonymous | recovery_request.create | account hint | ALLOW, generic response |
| requester with proof | recovery_request.attest | own rec_ | ALLOW if state = requested |
| owner session | recovery_request.withdraw | own rec_ | ALLOW |
| owner, step-up | recovery_method.create / delete | own rmt_ | ALLOW |
| ope_ (support) | any credential action | any | DENY (R03) |
| mod_ with case grant | recovery_request.read | rec_ in cas_ | ALLOW, metadata only, audited |
| sys_ scheduler | recovery_request.execute (expiry only) | rec_ | ALLOW |

## Failure, idempotency, concurrency, offline
Authorization decisions are not cached for writes (CTR-CAP-001 R09).

## Privacy, retention, abuse
Every privileged read emits an `aud_` record without content (CTR-CAP-001 R08).

## Observability & budgets
`recovery_denied_total{reason}`; alert on any `ope_` attempt to read `otp_hmac` or `secret_hash`.

## Tests
TEST-PS-053-09 (matrix rows as parameterized tests), TEST-PS-053-10 (proof token reused on another `rec_` is denied).

## Acceptance criteria
1. Every matrix row has a passing test.
2. No support principal can obtain credential material in any test.

## Assumptions & open decisions
- ASSUMPTION: 72 h maximum grant expiry (CTR-CAP-001 R06).
- PROVISIONAL (D10 default, unapproved).
