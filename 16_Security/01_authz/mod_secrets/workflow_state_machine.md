# PS-127-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/01_authz/mod_secrets (F16.S01.M02). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-127-03.R01 | Rotation keeps the previous version `active` until the new version is verified by its owner module, then marks it `revoked` after the overlap window (24 h, ASSUMPTION). | MVP |
| PS-127-03.R02 | Revocation is immediate for new leases; existing leases end within 60 s (CTR-CAP-001 R09 analog). | MVP |
| PS-127-03.R03 | `destroyed` is terminal and occurs 30 days after revocation (RET-SEC). | MVP |
| PS-127-03.R04 | A failed rotation leaves the prior version `active`. | MVP |

## Data / schema
`status` field of PS-127-01. Events: `secret.created`, `secret.rotated`, `secret.revoked`, `secret.destroyed` (CTR-EVT-001, aggregate `secret`, no values).

## Commands / queries / events
`secret.create`, `secret.rotate`, `secret.revoke`, `secret.destroy`, `lease.issue` (PS-127-04).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | create | PS-127-02 passes | active (v1) | emit `secret.created` |
| active | rotate_start | no other rotation in progress | rotating (new v+1 active, old v rotating) | emit `secret.rotated` |
| rotating | owner_verified | owner module confirms new version | active (old v → revoked after 24 h) | none |
| rotating | verify_failed | owner rejects | active (old v) ; new v revoked | emit `secret.revoked` for new v |
| active or rotating | revoke | ope approval or sys emergency with review | revoked | invalidate leases; emit `secret.revoked` |
| revoked | destroy_due | 30 days elapsed; no legal hold | destroyed | crypto-shred KMS handle; emit `secret.destroyed` |

## Validation & errors
Illegal transition: `SYS.CONFLICT`. Lease for revoked secret: `SECRETS.REVOKED` (gone, 410).

## Authorization
Revoke requires two `ope` approvers unless emergency (PS-127-05).

## Failure, idempotency, concurrency, offline
One rotation per secret at a time (`SECRETS.ROTATION_IN_PROGRESS`, 409, retryable). Transitions idempotent on (name, version, to).

## Privacy, retention, abuse
Destruction removes ciphertext handle; verifier hashes purged with it.

## Observability & budgets
Metric: `secret_state_transitions_total{from,to}`; alert on rotation stuck > 24 h.

## Tests
- TEST-PS-127-03-01 (unit): transition table.
- TEST-PS-127-03-02 (integration): failed rotation keeps old version active; service keeps working.
- TEST-PS-127-03-03 (integration): revoke blocks new leases and ends existing within 60 s.
- TEST-PS-127-03-04 (lifecycle): destroy after 30 days; crypto-shred verified.

## Acceptance criteria
1. Rotation never leaves zero active versions (TEST-02).
2. TEST-PS-127-03-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: 24 h overlap; 30-day destruction.
