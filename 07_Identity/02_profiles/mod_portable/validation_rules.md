# PS-055-02 — validation rules
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/02_profiles/mod_portable. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-055-02.R01 | Bundle ≤ 25 MiB and depth ≤ 8 (ASSUMPTION), checked before parsing or signature work. | MVP |
| PS-055-02.R02 | Import verifies in this order: size, JSON schema, `schema_version` support, `bundle_digest`, signature, expiry. First failure stops. | MVP |
| PS-055-02.R03 | Unknown record types rejected; unknown fields inside known types preserved for signature but ignored for apply. | MVP |
| PS-055-02.R04 | Profile fields in bundle obey the same rules as live profiles (PS-056-02). | MVP |
| PS-055-02.R05 | Bundle filename, if provided, is discarded. | MVP |

## Data / schema
Schema IDs `portable.bundle@1.0.0` and `portable.import@1.0.0` (CTR-SCH-001 registry).

## Commands / queries / events
Codes below apply to all commands in [commands_queries_events](commands_queries_events.md).

## States & transitions
Validation gates for `staged → applied` in [workflow_state_machine](workflow_state_machine.md).

## Validation & errors
| Code | Retryable | Category / HTTP | When |
|---|---|---|---|
| MOD_PORTABLE.BUNDLE_TOO_LARGE | false | payload_too_large / 413 | R01. |
| MOD_PORTABLE.SCHEMA_INVALID | false | validation / 400 | R02 step 2. |
| SCH.UNKNOWN_VERSION | false | validation / 400 | Unknown MAJOR (CTR-SCH-001 R06). |
| MOD_PORTABLE.DIGEST_MISMATCH | false | validation / 422 | R02 step 4. |
| MOD_PORTABLE.SIGNATURE_INVALID | false | validation / 422 | Signature fails or key not trusted for export. |
| MOD_PORTABLE.BUNDLE_EXPIRED | false | gone / 410 | `now > expires_at`. |
| MOD_PORTABLE.ALREADY_APPLIED | false | conflict / 409 | Same `bundle_digest` already applied on this node; returns original `prf_`. |

User message keys: `portable.import.invalid.body`, `portable.import.expired.body`. Diagnostics: code, digest prefix (8 hex), step; never record content.

## Authorization
Validation of a bundle runs before any owner match check; a bundle for another subject is treated as `SIGNATURE_INVALID` only when the signing key is not the owner's (no subject leak).

## Failure, idempotency, concurrency, offline
Validation is pure and retry-safe.

## Privacy, retention, abuse
Rejected bundle bytes are deleted immediately; only metadata kept for 30 days (RET-OPS).

## Observability & budgets
`portable_validation_rejections_total{step,code}`. Validation p95 ≤ 500 ms for a 25 MiB bundle.

## Tests
TEST-PS-055-03 (one failing fixture per step), TEST-PS-055-04 (25 MiB + 1 byte rejected before parse).

## Acceptance criteria
1. Each step has at least one failing fixture; each code produced once.
2. Size check precedes JSON parse (measured by instrumentation).

## Assumptions & open decisions
- ASSUMPTION: 25 MiB and depth 8 limits.
