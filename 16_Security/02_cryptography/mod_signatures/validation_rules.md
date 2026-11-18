# PS-130-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/02_cryptography/mod_signatures. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-FED-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-130-02.R01 | Reject `algorithm` values outside the closed enum. | MVP |
| PS-130-02.R02 | Reject signing input larger than 64 KiB (CTR-EVT-001 R12) before canonicalization. | MVP |
| PS-130-02.R03 | Reject nesting depth above 8 and any non-integer number in money or quantity fields. | MVP |
| PS-130-02.R04 | Reject base64url with padding, whitespace or non-URL characters. | MVP |
| PS-130-02.R05 | Reject a `domain_tag` that does not match `subject_type`. | MVP |
| PS-130-02.R06 | Reject any signature whose `key_id` is not valid at `occurred_at` (valid_from ≤ occurred_at, not compromised before). | MVP |

## Data / schema
Rules applied to [domain_schema.md](domain_schema.md) and to subject payloads before signing.

## Commands / queries / events
Applied to `signature.sign` and `signature.verify` ([commands_queries_events.md](commands_queries_events.md)).

## States & transitions
Validation failure creates no record and emits no signature.

## Validation & errors
| Code | Category | Retryable | message_key | Rule |
|---|---|---|---|---|
| SIG.ALGORITHM_NOT_ALLOWED | unprocessable_state (422) | false | err.sig.algorithm_not_allowed | R01 |
| SIG.PAYLOAD_TOO_LARGE | payload_too_large (413) | false | err.sig.payload_too_large | R02 |
| SIG.CANONICAL_INVALID | validation (400) | false | err.sig.canonical_invalid | R03, R04 |
| SIG.DOMAIN_MISMATCH | validation (400) | false | err.sig.domain_mismatch | R05 |
| SIG.KEY_NOT_VALID_AT_TIME | unprocessable_state (422) | false | err.sig.key_not_valid_at_time | R06 |

Verification of a bad signature is a result (`invalid`), not an error response.

## Authorization
Validation runs after authorization (CTR-CAP-001 R11).

## Failure, idempotency, concurrency, offline
Validation is pure and deterministic. Same bytes produce the same outcome on every node.

## Privacy, retention, abuse
Errors never echo payload bytes or digests of unvalidated input beyond the request ID.

## Observability & budgets
Counter `sig_validation_fail_total{code}`. Validation p95 ≤ 2 ms excluding canonicalization (ASSUMPTION).

## Tests
- TEST-PS-130-02-01: unit, one fixture per rule R01–R06.
- TEST-PS-130-02-02: property, JCS canonical output is stable across key order permutations.

## Acceptance criteria
1. Each rule has a failing fixture returning the listed code.
2. Canonicalization matches RFC 8785 vectors.

## Assumptions & open decisions
- ASSUMPTION: 64 KiB and depth 8 limits from CTR-EVT-001.
- D01 (envelope rules): PROVISIONAL (D01 default, unapproved).
