# PS-085-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/01_protocol/mod_signatures. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R05 signing input), CTR-FED-001 (verification order steps 1–13, R10, R13 error table), CTR-ERR-001, CTR-SCH-001 (R06 unknown MAJOR).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-085-02.R01 | Cheap checks run first: batch size and rate, peer state, event size and depth, schema, then `key_id` lookup. Ed25519 verification (step 8) runs only after steps 1–7 pass. Test asserts zero verify calls for batches failing steps 1–7. | MVP |
| PS-085-02.R02 | Signing input = UTF-8 bytes of `CLASSRUPT-EVT-SIG-v1\n` followed by RFC 8785 (JCS) of the envelope with `signature` removed. The envelope includes `audience` and `expires_at` (CTR-FED-001 R04). Unknown prefix version → `FED.VERSION_UNSUPPORTED`. | MVP |
| PS-085-02.R03 | Event is valid iff Ed25519 verification passes **and** the key is in force at `occurred_at` (`valid_from ≤ occurred_at`, and `valid_until` absent or `> occurred_at`). | MVP |
| PS-085-02.R04 | Key revoked (`revoked_at ≤ occurred_at`) or compromised (`compromised_at ≤ occurred_at`) → `FED.KEY_REVOKED`. `key_id` unknown → `FED.KEY_UNKNOWN` (deferred up to 24 h). Key not yet valid at `occurred_at` → `FED.SIGNATURE_INVALID` (ASSUMPTION). | MVP |
| PS-085-02.R05 | Strict verification: `value` must decode to exactly 64 bytes with canonical base64url (no padding, no whitespace). Non-canonical `S` scalar and small-order public keys are refused (ASSUMPTION; F16 confirms). Any violation → `FED.ENVELOPE_MALFORMED`. | MVP |
| PS-085-02.R06 | Event with `occurred_at < compromised_at` is accepted as historical with marker `signer_key_later_compromised = true` (CTR-FED-001 R09). Accepted events carry the marker in the batch result, not in the signed bytes. | MVP |

## Data / schema
Validation applies to the fields in PS-085-01. Enum and pattern failures use the same codes as PS-085-01 R01–R02.

## Validation & errors
| Code | Retryable | Category / HTTP | When |
|---|---|---|---|
| FED.ENVELOPE_MALFORMED | false | validation / 400 | Missing `signature`, bad base64url, bad length, non-canonical scalar |
| FED.VERSION_UNSUPPORTED | false | validation / 400 | Unknown signing-input prefix version |
| FED.KEY_UNKNOWN | true | precondition_failed / 412 | `key_id` not in projection; deferred up to 24 h |
| FED.KEY_REVOKED | false | unprocessable_state / 422 | Revoked or compromised at or before `occurred_at` |
| FED.SIGNATURE_INVALID | false | unprocessable_state / 422 | Verification fails, or key not in force at `occurred_at` |

Errors name field path and code only. Signature bytes and public keys are not echoed (CTR-ERR-001 R07).

## Authorization
Validation runs for every inbound event regardless of sender trust, after the peer-state check (CTR-FED-001 step 2).

## Failure, idempotency, concurrency, offline
Validation is pure and idempotent. Repeat validation of the same bytes gives the same result. See PS-085-06.

## Privacy, retention, abuse
Diagnostics carry code and `event_id` only (PS-085-07). Repeated failures feed the abuse threshold in PS-085-07 R04.

## Observability & budgets
`fed_signature_verify_total{result}` with `result` in {valid, invalid, key_unknown, key_revoked, malformed}. Budgets in PS-085-08.

## Tests
- TEST-PS-085-02-01 (unit): one fixture per code in the table; each returns exactly that code.
- TEST-PS-085-02-02 (unit): padded, whitespace-containing and length-65 base64url values are refused as `FED.ENVELOPE_MALFORMED`.
- TEST-PS-085-02-03 (integration): batch failing step 2 performs zero Ed25519 operations.
- TEST-PS-085-02-04 (unit): event at `compromised_at − 1 ms` accepted with marker; at `compromised_at` refused with `FED.KEY_REVOKED`.
- TEST-PS-085-02-05 (negative): malleated signature (scalar ≥ group order) refused under strict verification.

## Acceptance criteria
1. Each of the five codes is reachable by fixtures; TEST-PS-085-02-01 passes.
2. No Ed25519 work before step 7; TEST-PS-085-02-03 passes.
3. Compromise boundary exact to 1 ms; TEST-PS-085-02-04 passes.

## Assumptions & open decisions
Decision register: [DECISIONS.md](../../../DECISIONS.md). Labels below are PROVISIONAL (default, unapproved) where marked.
- ASSUMPTION: strict Ed25519 verification (canonical S, reject small-order keys); F16 to confirm.
- ASSUMPTION: "not yet valid" maps to `FED.SIGNATURE_INVALID`; F11 to confirm.
- PROVISIONAL (D01 default, unapproved): inbound events validated against signature and schema before import.
