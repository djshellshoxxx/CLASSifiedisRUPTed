# PS-130-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/02_cryptography/mod_signatures. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-SCH-001, CTR-FED-001, CTR-PRV-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-130-01.R01 | One `signature_record` per signed subject (event, statement or bundle). Records are immutable. | MVP |
| PS-130-01.R02 | `algorithm` is a closed enum; MVP value `ed25519` only (ASSUMPTION, CTR-EVT-001 R05). | MVP |
| PS-130-01.R03 | `signature` is exactly 64 bytes for `ed25519`, base64url without padding (68 characters). | MVP |
| PS-130-01.R04 | `subject_digest` is SHA-256 (64 lowercase hex) of the signing input, recomputed on every verify. | MVP |
| PS-130-01.R05 | `domain_tag` is fixed per `subject_type`; mismatch is rejected. | MVP |
| PS-130-01.R06 | Record stores no private key material, no subject payload bytes, and no names or contact data. | MVP |

## Data / schema
```json
{
  "sig_id": "sig_<26 Crockford base32> (PENDING CTR-ID-001 prefix, proposed sig, class opaque)",
  "subject_type": "event | statement | bundle",
  "subject_ref": "evt_... | stt_... | bnd_... (stt_ and bnd_ PENDING registration)",
  "subject_digest": "sha256 hex, 64 chars",
  "domain_tag": "CLASSRUPT-EVT-SIG-v1 | CLASSRUPT-STMT-SIG-v1 | CLASSRUPT-BNDL-SIG-v1",
  "algorithm": "ed25519",
  "key_id": "key_...",
  "signer_ref": "sys_... | ope_... | fpr_... | acc_...",
  "signed_at": "RFC 3339 UTC",
  "signature": "base64url, 86 chars (64 bytes)",
  "verification": {"result": "valid | invalid | key_unknown | key_expired | key_revoked", "checked_at": "RFC 3339 UTC", "reason_code": "closed enum"}
}
```
- Classes: `subject_digest`, `key_id`, `algorithm`, `signature` = PUBLIC. `signer_ref` = PSEUDONYMOUS. `verification` = PUBLIC.
- Owner of signature-record class: `16_Security/02_cryptography/mod_signatures` (F16.S02.M03). Consumers reference by full ID only (B-06). `11_Federation/01_protocol/mod_signatures` consumes verification and does not own records.
- Signing input = UTF-8 of domain tag + `\n` + RFC 8785 JCS of the subject with `signature` removed (CTR-EVT-001 R05).

## Commands / queries / events
See [commands_queries_events.md](commands_queries_events.md).

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md).

## Authorization
See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Ed25519 signing is deterministic, so a repeated sign of the same (`subject_digest`, `key_id`, `domain_tag`) yields the same bytes.

## Privacy, retention, abuse
Records persist with their subject. After subject deletion, record is reduced to digest, key_id, timestamps (CTR-PRV-001 R12).

## Observability & budgets
Counter `sig_verification_total{result}`.

## Tests
- TEST-PS-130-01-01: unit, length and base64url canonical form.
- TEST-PS-130-01-02: unit, digest recomputation detects one-byte change.

## Acceptance criteria
1. Schema rejects 64-byte violations and padded base64url in 100% of fixtures.
2. No record field stores private key bytes.

## Assumptions & open decisions
- ASSUMPTION: Ed25519 via a widely reviewed library; no custom primitives.
- PENDING CTR-ID-001: prefixes `sig`, `stt`, `bnd`.
- D01 (signed envelopes): PROVISIONAL (D01 default, unapproved). D06 (signed statements only): PROVISIONAL (D06 default, unapproved).
