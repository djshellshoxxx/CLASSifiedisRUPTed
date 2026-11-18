# PS-127-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/01_authz/mod_secrets (F16.S01.M02). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-127-04.R01 | `secret.create` returns metadata and version, never the value after creation (CTR-PRV-001 R08). | MVP |
| PS-127-04.R02 | `lease.issue` returns a short-lived lease token (<= 15 min, ASSUMPTION) bound to requester module and secret name; the token resolves to a value only inside the requester's runtime. | MVP |
| PS-127-04.R03 | Commands are internal (`sys` and `ope`); no client endpoint. | MVP |
| PS-127-04.R04 | Every command and lease emits an `aud_` record with secret name, requester and lease ID; no value (CTR-CAP-001 R08). | MVP |

## Data / schema
| Command | Signature | Idempotency scope | Emits | Errors |
|---|---|---|---|---|
| `secret.create` | (name, owner_module, storage kind, value once) | (name, key) | `secret.created` | SECRETS.DEFINITION_INVALID, SYS.CONFLICT |
| `secret.rotate` | (name, value once, expected_revision) | (name, key) | `secret.rotated` | SECRETS.ROTATION_IN_PROGRESS |
| `secret.revoke` | (name, reason_code, approvals) | (name) | `secret.revoked` | CAP.DUAL_APPROVAL_REQUIRED |
| `secret.destroy` | (name, version) | (name, version) | `secret.destroyed` | SYS.CONFLICT |
| `lease.issue` | (name, requester_module, ttl <= 900 s) | none (new lease each call) | none (aud only) | SECRETS.REVOKED, SECRETS.KMS_UNAVAILABLE |

Query: `secret.get_metadata` (no value), `secret.list` (metadata, page <= 100).

## States & transitions
Effects per PS-127-03.

## Validation & errors
Per PS-127-02.

## Authorization
Per PS-127-05.

## Failure, idempotency, concurrency, offline
Lease issuance is not idempotent by design; each lease has its own ID and expiry.

## Privacy, retention, abuse
Request bodies containing values are not logged; the logger redacts the `value` field by schema.

## Observability & budgets
`lease.issue` p95 <= 50 ms (ASSUMPTION).

## Tests
- TEST-PS-127-04-01 (contract): command table matches implementation.
- TEST-PS-127-04-02 (negative): `secret.get_metadata` response contains no value field.
- TEST-PS-127-04-03 (negative): lease presented by another module refused.
- TEST-PS-127-04-04 (log scan): create and rotate request bodies produce no log lines containing the value.

## Acceptance criteria
1. No command returns a value after creation (TEST-02).
2. TEST-PS-127-04-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: 15-minute lease maximum.
