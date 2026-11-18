# PS-085-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/01_protocol/mod_signatures. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (`signature`, R05), CTR-FED-001 (key fields, R09), CTR-ID-001 (`key_`, `nod_`), CTR-SCH-001 (PENDING `fed.signature`, `fed.signing_key`), CTR-PRV-001 (classes).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-085-01.R01 | A `signature` object is required on every event with `provenance.source_kind = federated_import` and on every event exported to a peer. Absent on receipt → `FED.ENVELOPE_MALFORMED`. | MVP |
| PS-085-01.R02 | `signature.alg` is a closed enum `{ed25519}` (ASSUMPTION). `signature.key_id` is a `key_` ID whose key belongs to `provenance.origin_node`. `signature.value` is unpadded base64url of exactly 64 bytes (86 characters). | MVP |
| PS-085-01.R03 | Stored events keep `signature` byte-identical to the signed form (CTR-SCH-001 R08). No re-serialization after verification. | MVP |
| PS-085-01.R04 | Key projection row holds public metadata only: no field for private key material exists in schema or storage. | MVP |
| PS-085-01.R05 | Key projection is unique on `key_id`. `origin_node` is immutable after creation. | MVP |
| PS-085-01.R06 | The library that parses signatures and public keys must be an audited, widely used implementation. No project-specific cryptographic primitive is written in this module (ASSUMPTION; F16 confirms). | MVP |

## Data / schema
| Field | Type and constraint | Class |
|---|---|---|
| `signature.alg` | closed enum `ed25519` | PUBLIC |
| `signature.key_id` | `key_` + 26 Crockford base32 (CTR-ID-001) | PUBLIC |
| `signature.value` | base64url, no padding, 86 chars, 64 bytes | PUBLIC |
| `key.key_id` | `key_` ID; unique | PUBLIC |
| `key.origin_node` | `nod_` ID; immutable | PUBLIC |
| `key.algorithm` | closed enum `ed25519` | PUBLIC |
| `key.public_key` | base64url, no padding, 43 chars, 32 bytes | PUBLIC |
| `key.valid_from` | RFC 3339 UTC ms; required | PUBLIC |
| `key.valid_until`, `key.revoked_at`, `key.compromised_at` | RFC 3339 UTC ms; nullable | PUBLIC |

Example signature object (shape only; values are not real):
`{"alg":"ed25519","key_id":"key_<26 chars>","value":"<86 chars>"}`

## Commands / queries / events
Defined in PS-085-04. This file defines the record shape only.

## States & transitions
Defined in PS-085-03 (key lifecycle projection).

## Validation & errors
Rules and codes in PS-085-02.

## Authorization
Field visibility in PS-085-05: key metadata is readable by federated peers; no field is readable as secret.

## Failure, idempotency, concurrency, offline
Projection writes follow PS-085-06.

## Privacy, retention, abuse
No personal data in any field. Retention per PS-085-07.

## Observability & budgets
Gauge `fed_key_projection_active` by `origin_node`. Budgets in PS-085-08.

## Tests
- TEST-PS-085-01-01 (unit): valid object accepted; `alg` outside enum, value length ≠ 86, and `key_id` prefix ≠ `key_` each refused.
- TEST-PS-085-01-02 (unit): schema lint finds no field named for private, secret or seed material.
- TEST-PS-085-01-03 (integration): node A's key cannot verify an event whose `origin_node` is node B.
- TEST-PS-085-01-04 (property): random base64url strings of length ≠ 86 never validate.

## Acceptance criteria
1. Every field in the table is enforced at the write path; TEST-PS-085-01-01 passes.
2. No private-key field exists; TEST-PS-085-01-02 passes.
3. Origin binding holds; TEST-PS-085-01-03 passes.

## Assumptions & open decisions
Decision register: [DECISIONS.md](../../../DECISIONS.md). Labels below are PROVISIONAL (default, unapproved) where marked.
- ASSUMPTION: Ed25519 (RFC 8032); 32-byte public keys; 64-byte signatures.
- PROVISIONAL (D01 default, unapproved): signed envelopes with explicit opt-in.
- PENDING CTR-SCH-001: `fed.signature` 1.0.0 and `fed.signing_key` 1.0.0.
- OPEN (F16): ownership of `key_` records (see module SPEC).
