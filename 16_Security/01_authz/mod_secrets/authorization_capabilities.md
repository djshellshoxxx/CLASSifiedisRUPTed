# PS-127-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/01_authz/mod_secrets (F16.S01.M02). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-PRV-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-127-05.R01 | Default deny. No `acc_`, `mod_` or `fpr_` principal can read, lease or rotate any platform secret. | MVP |
| PS-127-05.R02 | A `sys` principal may lease a secret only if the secret's `owner_module` or an explicit consumer list names the requester module. | MVP |
| PS-127-05.R03 | Create and rotate need `secret.administer` for `ope` with F16 role; revoke needs two distinct approvers unless emergency. | MVP |
| PS-127-05.R04 | Emergency revoke by `sys` on-call is allowed and triggers a post-hoc review record within 24 h. | MVP |
| PS-127-05.R05 | Nobody can read a value after creation, including F16 administrators (CTR-PRV-001 R08). | MVP |

## Data / schema
| Capability | Actor | Resource | Verb |
|---|---|---|---|
| `secret.administer` | ope (F16 role) | secret, scope global | administer |
| `secret.read` | ope (metadata) | secret, scope global | read |
| `lease.issue` | sys (named consumer) | secret, scope global | execute |

## Commands / queries / events
Each command checks capability first. Decisions recorded per CTR-CAP-001 R08.

## States & transitions
Not applicable.

## Validation & errors
`SYS.FORBIDDEN`; `CAP.SELF_APPROVAL_FORBIDDEN` when an approver created the rotation.

## Authorization
No grant for value read exists, by design.

## Failure, idempotency, concurrency, offline
Decision cache zero for lease issuance.

## Privacy, retention, abuse
Lease-rate anomaly per requester alerts (for example, > 10x baseline in 1 h, ASSUMPTION).

## Observability & budgets
Metric: `secrets_authz_denied_total{capability}`.

## Tests
- TEST-PS-127-05-01 (matrix): each principal kind per capability.
- TEST-PS-127-05-02 (negative): unnamed sys principal lease refused.
- TEST-PS-127-05-03 (privileged): self-approved revoke refused.
- TEST-PS-127-05-04 (negative): no API path returns a value after creation (static route scan).

## Acceptance criteria
1. No value-read capability exists (TEST-04).
2. TEST-PS-127-05-01 through -04 pass.

## Assumptions & open decisions
- OPEN (F16): consumer list format and review cadence (BT-06 ASSUMPTION 90 days).
