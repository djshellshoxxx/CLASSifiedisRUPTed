# PS-085-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/01_protocol/mod_signatures. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R01 default deny, R02 principal types, R03 verbs, R06–R08 privileged grants and audit, R10 field visibility), CTR-FED-001 (peer states), CTR-ERR-001 (R08 not-found equivalence).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-085-05.R01 | Default deny for every operation. No relation rule applies to keys. Only an explicit capability below allows an action. | MVP |
| PS-085-05.R02 | Private key material is not readable by any principal, including operators and F16 staff. It stays in the KMS. | MVP |
| PS-085-05.R03 | A peer (`fpr_`) can never register, rotate, revoke or mark its own keys. It can only send signed events within its capability scope. | MVP |
| PS-085-05.R04 | Revoke and compromise marking need two distinct `ope_` approvers (ASSUMPTION, pattern of CTR-CAP-001 R07). Self-approval returns `CAP.SELF_APPROVAL_FORBIDDEN`. | MVP |
| PS-085-05.R05 | Each revoke, compromise and privileged read writes an `aud_` record with key ID and decision ID, no content. | MVP |

## Data / schema
Capability rows are stored by F16 (`grt_`, `dec_`). This module names the actions below.

| Capability (CTR-CAP-001 action) | Verb | Resource | Principal |
|---|---|---|---|
| `federation_event.execute` | execute | outbound and inbound event | `sys_` federation service |
| `federation_key.read` | read | key projection (public fields) | `sys_`, `fpr_` (own node's keys only) |
| `federation_key.revoke` | revoke | node key | `ope_` (dual control) |
| `federation_key.administer` | administer | node key rotation and compromise marking | `ope_` (dual control) |

## Authorization matrix
| Actor | Action | Resource | Decision |
|---|---|---|---|
| `sys_` federation service | `federation_event.execute` | event in an export or import batch | allow (scope: sign and verify only) |
| `sys_` federation service | `federation_key.read` | projection row | allow |
| `ope_` operator, one of two | `federation_key.revoke` / `administer` | node key | allow only with second distinct `ope_` |
| `mod_` moderator | any | any key | deny |
| `acc_` user (any role) | any | any key | deny (keys are node-level only) |
| `fpr_` peer | `federation_key.read` | own node's public projection | allow, public fields only |
| `fpr_` peer | `federation_key.revoke` / `administer` | any | deny |

## Field visibility (CTR-CAP-001 R10)
| Field | Visibility |
|---|---|
| `key_id`, `origin_node`, `algorithm`, `public_key`, `valid_from`, `valid_until`, `revoked_at`, `compromised_at` | `public` |
| any private-key or seed field | `never` (no such field exists; PS-085-01 R04) |

## Validation & errors
Unauthorized callers receive `SYS.FORBIDDEN` or `SYS.NOT_FOUND` with no detail (CTR-ERR-001 R08). Denied capabilities never reveal whether a key exists.

## Failure, idempotency, concurrency, offline
Grant and decision records are written in the same transaction as the key transition (PS-085-03). Revocation of a grant takes effect at the next decision (CTR-CAP-001 R09).

## Privacy, retention, abuse
Audit records follow CTR-CAP-001 R08 and PS-085-07 retention.

## Observability & budgets
`fed_authz_denied_total{action}`. Alert on repeated denials by one `fpr_` (abuse signal).

## Tests
- TEST-PS-085-05-01 (unit): each matrix row returns the stated decision.
- TEST-PS-085-05-02 (integration): a peer calling `federation_key.revoke` is refused.
- TEST-PS-085-05-03 (integration): self-approved compromise marking returns `CAP.SELF_APPROVAL_FORBIDDEN`.
- TEST-PS-085-05-04 (negative): unauthorized and nonexistent keys return identical responses.

## Acceptance criteria
1. Matrix is complete for every principal type in CTR-CAP-001 R02 that can reach this module; TEST-PS-085-05-01 passes.
2. No principal can read private key material; covered by TEST-PS-085-09-06.
3. Dual control holds for revoke and compromise; TEST-PS-085-05-03 passes.

## Assumptions & open decisions
Decision register: [DECISIONS.md](../../../DECISIONS.md).
- ASSUMPTION: dual control for key revoke and compromise (F16 to confirm).
- PENDING F16: purpose registry values for any privileged read of key metadata.
- OPEN (CTR-CAP-001): policy language. Default: declarative table versioned with `policy_version`.
