# PS-057-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/03_trust/mod_evidence. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001 (codes), CTR-EVT-001 (signature fields in envelope when needed), CTR-SCH-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-057-02.R01 | `kind` must be in the closed enum; `self_attested` requires `issuer_ref` = subject `prf_` or owning `acc_`. | MVP |
| PS-057-02.R02 | `counterparty_signed` requires an issuer that shares a relation with the subject (participant scope, PS-057-05) and a valid signature over the canonical body. | MVP |
| PS-057-02.R03 | `verifier_result` requires `issuer_ref` in the verifier registry (owned by F16, ASSUMPTION) and `content_digest` present. | MVP |
| PS-057-02.R04 | `content_digest` recomputed server-side from the canonical body (JCS, RFC 8785 style); mismatch rejected. | MVP |
| PS-057-02.R05 | Signature verified against the issuer key in the key registry at `issued_at`; revoked keys reject new signatures but keep old ones verifiable. | MVP |
| PS-057-02.R06 | `content` free text ≤ 500 code points, NFC, no contact-pattern match (as PS-056-02 R02). | MVP |
| PS-057-02.R07 | `supersedes` must reference a record with the same subject and kind, not withdrawn. | MVP |

## Data / schema
Maps to fields in [domain_schema.md](domain_schema.md).

## Commands / queries / events
Applies to `RecordEvidence`, `SupersedeEvidence`, `WithdrawEvidence` ([commands_queries_events.md](commands_queries_events.md)).

## States & transitions
Validation precedes state change; rejected writes leave state unchanged.

## Validation & errors
| Code | `retryable` | `message_key` | `details[].rule` |
|---|---|---|---|
| `EVIDENCE.KIND_NOT_ALLOWED` | false | `err.evidence.kind_not_allowed` | `enum` |
| `EVIDENCE.ISSUER_NOT_ALLOWED` | false | `err.evidence.issuer_not_allowed` | `relation` |
| `EVIDENCE.DIGEST_MISMATCH` | false | `err.evidence.digest_mismatch` | `digest` |
| `EVIDENCE.SIGNATURE_INVALID` | false | `err.evidence.signature_invalid` | `signature` |
| `EVIDENCE.KEY_UNKNOWN` | true (key sync pending) | `err.evidence.key_unknown` | `key_ref` |
| `EVIDENCE.SUPERSEDE_TARGET_INVALID` | false | `err.evidence.supersede_invalid` | `supersedes` |

## Authorization
Validation does not grant rights; PS-057-05 runs first.

## Failure, idempotency, concurrency, offline
Deterministic for same body and registry version. `KEY_UNKNOWN` is retryable after key registry sync.

## Privacy, retention, abuse
Error bodies never echo digests, signatures or content. Logs record code only.

## Observability & budgets
`evidence_validation_fail_total{code}`; signature verification p95 ≤ 5 ms (ASSUMPTION for Ed25519).

## Tests
- TEST-PS-057-02-01 (unit): one case per code.
- TEST-PS-057-02-02 (property): digest recomputation stable under key reordering.
- TEST-PS-057-02-03 (negative): tampered body yields `DIGEST_MISMATCH`; tampered signature yields `SIGNATURE_INVALID`.
- TEST-PS-057-02-04 (negative): revoked key rejects new signature, verifies old one.

## Acceptance criteria
1. Every rule has a code and a test.
2. No echo of input in errors.
3. Canonical digest rules match CTR-EVT-001 digests.
4. Signature verification uses an audited library (research record pending).

## Assumptions & open decisions
- ASSUMPTION: verifier registry owned by F16.
- PROVISIONAL (D06 default, unapproved): signed statements only; external verification is a separate record class.
