# PS-120-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/03_operations/mod_backups (F15.S03.M02). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-SCH-001, CTR-ID-001 (PENDING registration of prefix `bkp`), CTR-EVT-001. **Canonical owner of record class "backup set":** F15.S03.M02.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-120-01.R01 | Each backup set has exactly one manifest, schema `backup.manifest` registered under CTR-SCH-001 with owner F15. | MVP |
| PS-120-01.R02 | `scope` is a closed set: `events`, `aggregates`, `registry`, `grants_decisions`, `attachment_objects`. Idempotency records and RET-EPH/RET-OPS data are out of scope. | MVP |
| PS-120-01.R03 | SECRET-class fields are excluded; only salted hashes or KMS-wrapped values may appear (CTR-PRV-001 disclosure matrix). | MVP |
| PS-120-01.R04 | `max_data_class` of a set is the highest class it contains; sets containing LOCATION_PRECISE are flagged for analytics exclusion. | MVP |
| PS-120-01.R05 | Set ID format per CTR-ID-001 once prefix `bkp` is registered (class `ulid`). Until then no set is created in production (PENDING). | MVP |
| PS-120-01.R06 | Incremental sets reference their parent by `parent_set_id`; a chain has at most one full set per 35-day window. | MVP |

## Data / schema
```json
{
  "bkp_id": "bkp_ + 26 chars (PENDING registration)",
  "scope": "events | aggregates | registry | grants_decisions | attachment_objects",
  "kind": "full | incremental",
  "parent_set_id": "bkp_ or null",
  "window_start": "RFC 3339 UTC ms", "window_end": "RFC 3339 UTC ms",
  "manifest_sha256": "64 hex",
  "object_count": "integer >= 0", "byte_size": "integer >= 0",
  "max_data_class": "CTR-PRV-001 enum",
  "encryption": {"alg": "AES-256-GCM", "kms_key_ref": "opaque handle", "dek_wrapped": "base64url"},
  "status": "scheduled | running | verifying | complete | failed | expired | purged",
  "verified_at": "RFC 3339 UTC ms or null",
  "expires_at": "RFC 3339 UTC ms",
  "legal_hold_ref": "cas_ ID or matter reference, or null"
}
```
Constraints: `window_end > window_start`; `status=complete` requires `verified_at`; `kind=incremental` requires `parent_set_id`.

## Commands / queries / events
See PS-120-04.

## States & transitions
See PS-120-03.

## Validation & errors
See PS-120-02.

## Authorization
See PS-120-05.

## Failure, idempotency, concurrency, offline
A set is identified by (scope, kind, window_start, window_end); a repeat create returns the existing set (PS-120-06).

## Privacy, retention, abuse
Field classes follow CTR-PRV-001. `legal_hold_ref` scopes holds to one set (CTR-PRV-001 R07).

## Observability & budgets
Set metadata only is logged: `bkp_id`, scope, counts, status.

## Tests
- TEST-PS-120-01-01 (schema): manifest validates; SECRET field fixture rejected.
- TEST-PS-120-01-02 (unit): `window_end <= window_start` rejected.
- TEST-PS-120-01-03 (lint): `bkp` prefix present in registry before any production write.
- TEST-PS-120-01-04 (unit): LOCATION_PRECISE presence sets analytics-exclusion flag.

## Acceptance criteria
1. Manifest schema registered with owner F15 and digest (CTR-SCH-001 R02).
2. TEST-PS-120-01-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: 35-day retention window for full sets (see PS-120-07).
- PENDING: CTR-ID-001 MINOR change to register `bkp` (F15 review).
- PROVISIONAL (D07 default, unapproved): minimal retention with legal-hold exceptions.
- OPEN (D10): recovery path for KMS-wrapped data keys.
