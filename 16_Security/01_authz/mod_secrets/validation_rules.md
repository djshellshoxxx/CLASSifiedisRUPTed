# PS-127-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/01_authz/mod_secrets (F16.S01.M02). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-ERR-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-127-02.R01 | Input containing a plaintext value field on any read, list or event path is refused at schema level. Write path accepts value only in the create or rotate request body over TLS 1.3. | MVP |
| PS-127-02.R02 | Secret name and owner module must match the owner registry; unknown owner refused. | MVP |
| PS-127-02.R03 | Rotation requires `rotate_by` at most 365 days in future (ASSUMPTION). | MVP |
| PS-127-02.R04 | Verifier-type secrets must declare the verifying module; the verifier key ID must be KMS-held. | MVP |
| PS-127-02.R05 | Secret-scanning hook refuses any commit or artifact containing a value that matches a registered secret verifier (CI). | MVP |

## Data / schema
Rules apply to requests in PS-127-04 and to CI scanning.

## Commands / queries / events
Applied in `secret.create`, `secret.rotate`, `lease.issue`.

## States & transitions
Validation failure creates no version.

## Validation & errors
| Code | Retryable | Category / HTTP | When |
|---|---|---|---|
| SECRETS.DEFINITION_INVALID | false | validation / 400 | R01, R02, R03, R04 |
| SECRETS.VALUE_IN_LOG_PATH | false | forbidden / 403 | R01 read path |
| SECRETS.SCAN_HIT | false | unprocessable_state / 422 | R05 (CI) |

## Authorization
Validation precedes capability check for create; denial still audited.

## Failure, idempotency, concurrency, offline
Validation is deterministic. CI scan is not retried automatically.

## Privacy, retention, abuse
Errors never echo the value, only the field path (CTR-ERR-001 R06).

## Observability & budgets
Metric: `secrets_validation_rejections_total{code}`.

## Tests
- TEST-PS-127-02-01 (unit): each rule pass and fail.
- TEST-PS-127-02-02 (negative): create with unknown owner refused.
- TEST-PS-127-02-03 (CI): planted test secret in a commit blocks merge.
- TEST-PS-127-02-04 (negative): error body does not contain the submitted value.

## Acceptance criteria
1. Plaintext never appears in any non-create response (TEST-01).
2. TEST-PS-127-02-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: 365-day maximum rotation horizon.
- OPEN (F16): secret-scanning tool choice (MCP `run_secret_scanning` is one option).
