# PS-128-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/02_cryptography/mod_key (F16.S02.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-128-05.R01 | Default deny. A key owner (`acc_`, `nod_`, `sys_`) may register, prove, rotate and revoke its own keys. | MVP |
| PS-128-05.R02 | Public key read is allowed to any authenticated principal and to federation peers for public keys of their own relations. | MVP |
| PS-128-05.R03 | Revocation on compromise by an admin requires `ope` F16 role and a second approver (CTR-CAP-001 R07). | MVP |
| PS-128-05.R04 | No principal, including administrators, can read or export a private key; the platform never holds user private keys (PS-128-07). | MVP |
| PS-128-05.R05 | Key administration is audited (`aud_`) per CTR-CAP-001 R08. | MVP |

## Data / schema
| Capability | Actor | Resource | Verb |
|---|---|---|---|
| `key.create` | acc, nod, sys (owner) | key, scope self | create |
| `key.update` | owner | key, scope self | update |
| `key.withdraw` | owner | key, scope self | withdraw |
| `key.read` | any authenticated; peers for relations | key, scope public | read |
| `key.administer` | ope (F16 role, dual control on compromise revoke) | key, scope global | administer |

## Commands / queries / events
Each command in PS-128-04 maps to one row above.

## States & transitions
Not applicable.

## Validation & errors
`SYS.FORBIDDEN` for visible key of another owner; `SYS.NOT_FOUND` otherwise.

## Authorization
Owner identity comes from the authenticated principal, not the request body (CTR-CAP-001 R11).

## Failure, idempotency, concurrency, offline
Decision cache zero for revoke and administer.

## Privacy, retention, abuse
Admin reads of key metadata are case-scoped only.

## Observability & budgets
Metric: `key_authz_denied_total{capability}`.

## Tests
- TEST-PS-128-05-01 (matrix): each row.
- TEST-PS-128-05-02 (negative): another owner's revoke refused.
- TEST-PS-128-05-03 (privileged): single-approver compromise revoke refused.
- TEST-PS-128-05-04 (negative): no endpoint returns private key material (static route scan).

## Acceptance criteria
1. No private key read path exists (TEST-04).
2. TEST-PS-128-05-01 through -04 pass.

## Assumptions & open decisions
- PROVISIONAL (D10 default).
