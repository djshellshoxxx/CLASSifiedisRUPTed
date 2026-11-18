# PS-091-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/03_interop/mod_trust. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-ERR-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-091-02.R01 | `peer_id` must match `^fpr_[0-9A-HJKMNP-TV-Z]{26}$` after lowercase-prefix/uppercase-body normalization. Other lengths return `ID.MALFORMED`. | MVP |
| PS-091-02.R02 | `reason_code` must be in the registry: `EQUIVOCATION`, `SIG_FAILURES`, `KEY_COMPROMISED`, `MODERATION_CASE`, `FINGERPRINT_CONFIRMED`, `ADMIN_REVIEW`, `RECOVERY_REVIEWED`. Unknown → `TRUST.REASON_UNKNOWN`. | MVP |
| PS-091-02.R03 | `evidence_ref` is required for `EQUIVOCATION`, `KEY_COMPROMISED` and `MODERATION_CASE`. Missing → `TRUST.EVIDENCE_REQUIRED`. | MVP |
| PS-091-02.R04 | `fingerprint_confirmation` (SHA-256 of the peer's Ed25519 public key, ASSUMPTION) must equal the current key fingerprint for `peer.admit`. Mismatch → `TRUST.FINGERPRINT_MISMATCH`. | MVP |
| PS-091-02.R05 | `expected_revision` is required on every command. Mismatch → `EVT.REVISION_CONFLICT`. | MVP |
| PS-091-02.R06 | No free-text reason field exists. Input values are never echoed in errors (CTR-ERR-001 R07). | MVP |

## Data / schema
Error registry for this module (envelope per CTR-ERR-001). Module prefix is `TRUST` (≤ 8 characters).

| Code | Category | HTTP | Retryable | `message_key` | `details.rule` |
|---|---|---|---|---|---|
| `TRUST.PEER_NOT_FOUND` | not_found | 404 | false | `err.trust.peer_not_found` | — |
| `TRUST.TRANSITION_NOT_ALLOWED` | unprocessable_state | 422 | false | `err.trust.transition_not_allowed` | `from_state` |
| `TRUST.FINGERPRINT_MISMATCH` | unprocessable_state | 422 | false | `err.trust.fingerprint_mismatch` | `fingerprint_confirmation` |
| `TRUST.EVIDENCE_REQUIRED` | validation | 400 | false | `err.trust.evidence_required` | `evidence_ref` |
| `TRUST.REASON_UNKNOWN` | validation | 400 | false | `err.trust.reason_unknown` | `reason_code` |
| `EVT.REVISION_CONFLICT` | conflict | 409 | false | `err.evt.revision_conflict` | `expected_revision` |

`retryable: false` for `EVT.REVISION_CONFLICT`: the same unchanged request with the same `expected_revision` fails again. The client must re-read `trust_state` and resend with the new revision.

## Commands / queries / events
Validation runs before the state table (PS-091-03). Order: format, enum, required fields, fingerprint, revision, transition guard.

## States & transitions
Guards referenced from PS-091-03; validation failures never write `trs_`.

## Validation & errors
Diagnostics are privacy-safe: no peer hostname, key bytes or evidence content in any response or log (CTR-ERR-001 R06).

## Authorization
Validation is independent of actor. Authorization is evaluated first for existence (`TRUST.PEER_NOT_FOUND` is returned for peers the actor cannot read, CTR-ERR-001 R08).

## Failure, idempotency, concurrency, offline
Validation errors are not stored in the idempotency table (only successful results are, CTR-EVT-001 R03).

## Privacy, retention, abuse
Rejected requests are logged by code and `request_id` only.

## Observability & budgets
Counter `trust_validation_error_total{code}`; no peer label.

## Tests
- `TEST-PS-091-02-01` unit: each registry code triggers on its exact condition and no other.
- `TEST-PS-091-02-02` negative: fingerprint off by one character returns `TRUST.FINGERPRINT_MISMATCH` and writes no row.
- `TEST-PS-091-02-03` contract: error bodies validate against CTR-ERR-001 and contain no input echo.

## Acceptance criteria
1. Every command rejects invalid input before any write.
2. Registry codes match CTR-ERR-001 format; `message_key` derived mechanically from `code`.
3. Zero input values appear in error responses in the test corpus.

## Assumptions & open decisions
- ASSUMPTION: fingerprint is SHA-256 over the Ed25519 public key bytes; F16 must confirm the algorithm.
- D01 (federated protocol), PROVISIONAL default: signed envelopes, explicit opt-in (unapproved).
