# PS-128-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/02_cryptography/mod_key (F16.S02.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ID-001 (prefix `key`, class ulid, owner F16), CTR-SCH-001, CTR-CAP-001, CTR-EVT-001. **Canonical owner of record class "key record (public metadata)":** F16.S02.M01.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-128-01.R01 | A key record stores public key material and metadata only. No private key field exists in any schema of this module. | MVP |
| PS-128-01.R02 | `fingerprint` = SHA-256 of the raw public key bytes, 64 hex, unique per (`owner_ref`, `purpose`). | MVP |
| PS-128-01.R03 | `purpose` is a closed enum: `envelope_signing`, `device_auth`, `message_encryption`, `node_identity`. | MVP |
| PS-128-01.R04 | `algorithm` is a closed enum: `Ed25519` (signing, PROVISIONAL per CTR-EVT-001 R05), `X25519` (encryption, ASSUMPTION). | MVP |
| PS-128-01.R05 | Each `owner_ref` may hold at most 10 keys in `active` or `rotating` status (ASSUMPTION). | MVP |

## Data / schema
```json
{
  "key_id": "key_ + 26 chars (CTR-ID-001)",
  "owner_ref": "acc_ | sys_ | nod_ (CTR-CAP-001 principal types; nod_ per CTR-FED-001)",
  "purpose": "envelope_signing | device_auth | message_encryption | node_identity",
  "algorithm": "Ed25519 | X25519",
  "public_key": "base64url, 32 bytes",
  "fingerprint": "64 hex SHA-256",
  "status": "pending | active | rotating | revoked | expired",
  "valid_from": "RFC 3339 UTC ms",
  "valid_until": "RFC 3339 UTC ms, <= valid_from + 730 days",
  "revoked_at": "RFC 3339 UTC ms or null",
  "revocation_reason": "compromise | user_request | superseded | recovery | policy",
  "schema_version": "1.0.0"
}
```
Constraints: `revoked_at` required when `status = revoked`; `public_key` length 32 bytes after decoding.

## Commands / queries / events
See PS-128-04.

## States & transitions
See PS-128-03.

## Validation & errors
See PS-128-02.

## Authorization
See PS-128-05.

## Failure, idempotency, concurrency, offline
Registration is idempotent on (`owner_ref`, `fingerprint`, `purpose`).

## Privacy, retention, abuse
Public key material is linkable across contexts. Pseudonymous `owner_ref` only; never a legal name (CTR-PRV-001 PSEUDONYMOUS). Retention per PS-128-07.

## Observability & budgets
Key counts per purpose and status; no key material in telemetry.

## Tests
- TEST-PS-128-01-01 (schema): record with extra field `private_key` rejected.
- TEST-PS-128-01-02 (unit): fingerprint recomputed from `public_key` matches.
- TEST-PS-128-01-03 (unit): 11th key for one owner refused.
- TEST-PS-128-01-04 (property): duplicate fingerprint per (owner, purpose) refused across 100,000 random keys.

## Acceptance criteria
1. Schema validates fixtures; private-key fixtures refused.
2. TEST-PS-128-01-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: 730-day maximum key validity.
- PROVISIONAL (D01 default, unapproved): signed envelopes with explicit key IDs.
- OPEN (D10): user-controlled key recovery; see PS-128-07.
