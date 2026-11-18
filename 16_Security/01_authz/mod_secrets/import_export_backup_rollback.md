# PS-127-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/01_authz/mod_secrets (F16.S01.M02). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-SCH-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-127-10.R01 | No export of secret values or wrapped keys to any party. Metadata export (names, owners, versions, statuses) is allowed for audit. | MVP |
| PS-127-10.R02 | Import of secrets is refused; new secrets are created through `secret.create` so values are entered once. | MVP |
| PS-127-10.R03 | Backups include wrapped handles and verifiers only (PS-120 R03). | MVP |
| PS-127-10.R04 | Rollback of a rotation is performed by re-activating the prior version only while it is not `destroyed`. | MVP |
| PS-127-10.R05 | Restore of secrets requires KMS key access under PS-120 unwrap rules and is logged. | MVP |

## Data / schema
Metadata export record: name, owner module, version, status, timestamps.

## Commands / queries / events
Rollback uses `secret.rotate` to a re-activated prior version (a new version number is not created; status change is recorded).

## States & transitions
Rollback from `rotating` → `active` (PS-127-03 R04).

## Validation & errors
`SECRETS.DEFINITION_INVALID` for import attempts.

## Authorization
Metadata export requires `secret.read` for `ope`.

## Failure, idempotency, concurrency, offline
Export idempotent per request digest.

## Privacy, retention, abuse
Metadata exports contain no values.

## Observability & budgets
Export logged as audit event.

## Tests
- TEST-PS-127-10-01 (negative): value export attempt refused.
- TEST-PS-127-10-02 (rollback): prior version re-activates after failed rotation.
- TEST-PS-127-10-03 (restore): backup restore keeps revoked versions revoked.
- TEST-PS-127-10-04 (audit): metadata export emits `aud_` record.

## Acceptance criteria
1. No value export path (TEST-01).
2. TEST-PS-127-10-01 through -04 pass.

## Assumptions & open decisions
- PROVISIONAL (D10 default).
