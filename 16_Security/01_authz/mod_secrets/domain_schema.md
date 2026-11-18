# PS-127-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/01_authz/mod_secrets (F16.S01.M02). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001, CTR-ID-001 (PENDING registration of prefix `sec`), CTR-SCH-001. **Canonical owner of record class "platform secret":** F16.S01.M02. User key material is owned by F16.S02.M01 (mod_key), not this module.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-127-01.R01 | Each platform secret has one owner module (full module ID) and one name (`^[a-z][a-z0-9_.]{2,63}$`, unique). | MVP |
| PS-127-01.R02 | Secret value is stored only as a KMS-wrapped ciphertext handle or as a salted HMAC-SHA-256 verifier. Plaintext is never persisted. | MVP |
| PS-127-01.R03 | Versions are monotonic integers; at most two versions are `active` at any time (overlap window). | MVP |
| PS-127-01.R04 | Status is one of `active`, `rotating`, `revoked`, `destroyed`. | MVP |
| PS-127-01.R05 | Every secret carries `data_class = SECRET` (CTR-PRV-001); SECRET never appears in events (CTR-EVT-001 R11). | MVP |

## Data / schema
```json
{
  "secret_name": "dot.separated name, unique",
  "owner_module": "F-code module ID",
  "version": "integer >= 1",
  "status": "active | rotating | revoked | destroyed",
  "storage": {"kind": "kms_wrapped | hmac_verifier", "kms_key_ref": "opaque handle or null", "ciphertext_ref": "opaque handle or null", "verifier": "base64url HMAC or null"},
  "created_at": "RFC 3339 UTC ms",
  "rotate_by": "RFC 3339 UTC ms",
  "revoked_at": "RFC 3339 UTC ms or null",
  "destroy_after": "RFC 3339 UTC ms or null",
  "data_class": "SECRET"
}
```
Constraints: `storage.kind = hmac_verifier` forbids `ciphertext_ref`; `revoked_at` required when `status = revoked`.

## Commands / queries / events
See PS-127-04.

## States & transitions
See PS-127-03.

## Validation & errors
See PS-127-02.

## Authorization
See PS-127-05.

## Failure, idempotency, concurrency, offline
Version creation is idempotent on (`secret_name`, `version`, digest of wrapped handle).

## Privacy, retention, abuse
SECRET class; retention RET-SEC (PS-127-07).

## Observability & budgets
Metadata only; see PS-127-08.

## Tests
- TEST-PS-127-01-01 (schema): storage kind constraints enforced.
- TEST-PS-127-01-02 (lint): no plaintext field name or value pattern in any table export.
- TEST-PS-127-01-03 (unit): three simultaneously active versions refused.
- TEST-PS-127-01-04 (lint): `data_class` SECRET absent from event schemas.

## Acceptance criteria
1. Schema validates fixtures; plaintext fixture fails lint.
2. TEST-PS-127-01-01 through -04 pass.

## Assumptions & open decisions
- PENDING: CTR-ID-001 MINOR change for `sec` prefix (F15 review, F16 owner).
- ASSUMPTION: KMS is a managed service under F16 review; choice OPEN.
- PROVISIONAL (D10 default): platform secrets are not user keys.
