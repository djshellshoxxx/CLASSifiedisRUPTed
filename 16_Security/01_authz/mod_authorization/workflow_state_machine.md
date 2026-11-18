# PS-126-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [mod_authorization](SPEC.md) (Security Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (grant status), CTR-EVT-001, CTR-FED-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-126-03.R01 | A privileged grant is created only after all approvals are recorded; no grant exists in an approval-pending state. | MVP |
| PS-126-03.R02 | `revoked` and `expired` are terminal for grants. | MVP |
| PS-126-03.R03 | A published policy version is immutable; a rollback publishes a new version. | MVP |
| PS-126-03.R04 | Revocation is visible to the next decision and to all decisions after commit (CTR-CAP-001 R09). | MVP |
| PS-126-03.R05 | A grant with `max_uses` reaching zero moves to `expired` atomically with the final use. | MVP |

## Data / schema
Status and revision columns on grant and policy rows; transition log is the CTR-EVT-001 stream.

## Commands / queries / events
Transitions are triggered by `grant.create`, `grant.approve`, `grant.revoke`, `policy.publish` and time-based expiry sweeps.

## States & transitions
Grant:
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | grant.create | validation passed; all approvals recorded | active | Emit `grant.granted`. |
| active | grant.revoke | grant is active | revoked | Emit `grant.revoked`; purge cache entries for grant. |
| active | expiry sweep | `expires_at` passed | expired | Emit `grant.expired`. |
| active | use consumed | `max_uses` reached | expired | Emit `grant.expired`. |

Policy:
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | policy.draft | rules validate | draft | None. |
| draft | policy.publish | two ope approvals; not self | published | Emit `policy.published`; new cache namespace. |
| published | policy.publish (newer) | version greater | superseded (old) | Emit `policy.superseded`. |

## Validation & errors
`CAP.GRANT_NOT_ACTIVE` on revoke or approve of non-active grant; `AUTHZ.POLICY_IMMUTABLE` on edit of published version (conflict / 409).

## Authorization
Transitions require the actions in [PS-126-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Revoke is idempotent by `grant_id`; a second revoke returns `CAP.GRANT_NOT_ACTIVE`. Concurrent revoke and decide: the revision check decides; a decision reading a revision after revoke commit returns DENY.

## Privacy, retention, abuse
Transition events carry grant ID, subject ref, capability, scope and reason, never object content.

## Observability & budgets
`authz_grant_transitions_total{to}`. Revocation lag p95 ≤ 60 s (see [PS-126-08](observability_performance.md)).

## Tests
- TEST-PS-126-03-01 (unit): transition table exhaustive; invalid transitions rejected.
- TEST-PS-126-03-02 (concurrency): revoke racing a decision never returns ALLOW after commit.
- TEST-PS-126-03-03 (integration): `max_uses` = 1 expires on first use under parallel requests.

## Acceptance criteria
1. No grant row exists with status other than `active`, `revoked`, `expired`.
2. Published policy rows are byte-identical after publication of later versions.
3. Post-commit revocation denies within one decision.

## Assumptions & open decisions
- ASSUMPTION: policy publication needs two distinct ope approvals.
- PROVISIONAL (D10 default, unapproved): key compromise triggers grant revocation via reason `key_compromised`.
