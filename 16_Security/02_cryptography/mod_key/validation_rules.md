# PS-128-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/02_cryptography/mod_key (F16.S02.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-ERR-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-128-02.R01 | Public key must decode to exactly 32 bytes and be a valid point or key encoding for the algorithm; otherwise refused. | MVP |
| PS-128-02.R02 | Any request containing a field named `private_key`, `secret_key`, `seed`, `mnemonic` or a base64 value that decodes to 64 bytes is refused and not logged. | MVP |
| PS-128-02.R03 | `owner_ref` must be `acc_`, `sys_` or `nod_` ID per CTR-ID-001 and must exist. | MVP |
| PS-128-02.R04 | `valid_until` must be after `valid_from` and within 730 days. | MVP |
| PS-128-02.R05 | `purpose` and `algorithm` must be compatible (`envelope_signing` and `device_auth` with `Ed25519`; `message_encryption` with `X25519`). | MVP |
| PS-128-02.R06 | Registration with a key whose fingerprint is revoked for the same owner is refused. | MVP |

## Data / schema
Rules apply to `key.register` input.

## Commands / queries / events
Applied in `key.register` (PS-128-04).

## States & transitions
Validation failure creates no record.

## Validation & errors
| Code | Retryable | Category / HTTP | When |
|---|---|---|---|
| KEY.PUBLIC_KEY_INVALID | false | validation / 400 | R01 |
| KEY.PRIVATE_MATERIAL_REJECTED | false | validation / 400 | R02 (not logged; security event) |
| KEY.ALGORITHM_UNSUPPORTED | false | validation / 400 | R05 |
| KEY.FINGERPRINT_DUPLICATE | false | conflict / 409 | duplicate per (owner, purpose) |
| KEY.LIMIT_REACHED | false | unprocessable_state / 422 | R05 of PS-128-01 |
| KEY.REVOKED_FINGERPRINT | false | gone / 410 | R06 |

## Authorization
Validation runs for authenticated owners only (PS-128-05).

## Failure, idempotency, concurrency, offline
Deterministic. Offline clients generate key pairs locally and register when online (PS-116 queue).

## Privacy, retention, abuse
R02 refusals are logged as security events with no content, count and source pseudonym only.

## Observability & budgets
Metric: `key_validation_rejections_total{code}`; alert on any `KEY.PRIVATE_MATERIAL_REJECTED` burst (> 5 in 10 min, ASSUMPTION).

## Tests
- TEST-PS-128-02-01 (unit): each rule pass and fail.
- TEST-PS-128-02-02 (negative): request with `private_key` field refused; log scan finds no key bytes.
- TEST-PS-128-02-03 (vector): Ed25519 and X25519 test vectors accepted/rejected correctly.
- TEST-PS-128-02-04 (negative): registration reusing a revoked fingerprint refused.

## Acceptance criteria
1. No private material accepted anywhere (TEST-02).
2. TEST-PS-128-02-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: library validation (vetted library, version pinned in ADR; not implemented here).
