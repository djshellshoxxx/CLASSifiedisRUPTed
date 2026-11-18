# PS-055-04 — commands, queries and events
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/02_profiles/mod_portable. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-SCH-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-055-04.R01 | All state-changing commands require `Idempotency-Key` and, where a `bnd_`/`imj_` exists, `expected_revision`. | MVP |
| PS-055-04.R02 | Export and import are online-only; excluded from D08 offline queue. | MVP |
| PS-055-04.R03 | Event payloads: IDs, counts, codes. No profile values, no digest content beyond 8-hex prefix. | MVP |

## Data / schema
Import upload is a multipart body with the bundle as `application/vnd.classrupt.bundle+json`, ≤ 25 MiB.

## Commands / queries / events
| Command | Route | Result | Errors |
|---|---|---|---|
| portable.export.generate | POST /v1/profile/exports | 202 {bundle_id} | STEP_UP_REQUIRED, SYS.RATE_LIMITED |
| portable.export.download | GET /v1/profile/exports/{bnd_id}/file?token= | 200 bytes | SYS.GONE |
| portable.import.stage | POST /v1/profile/imports | 201 {imj_id, preview} | BUNDLE_TOO_LARGE, SCHEMA_INVALID, SIGNATURE_INVALID, BUNDLE_EXPIRED |
| portable.import.apply | POST /v1/profile/imports/{imj_id}/apply | 200 {prf_id} | ALREADY_APPLIED, SYS.CONFLICT |
| portable.import.cancel | DELETE /v1/profile/imports/{imj_id} | 204 | SYS.CONFLICT |

Events (`aggregate_type` `portable_bundle` / `portable_import`): `portable_bundle.generated`, `.downloaded`, `.expired`; `portable_import.staged`, `.applied`, `.rejected`. `max_data_class` = PSEUDONYMOUS.

## States & transitions
See [workflow_state_machine](workflow_state_machine.md).

## Validation & errors
See [validation_rules](validation_rules.md).

## Authorization
See [authorization_capabilities](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Export generate idempotent per (owner, day, key). Import apply idempotent by `bundle_digest`.

## Privacy, retention, abuse
Preview returned on stage shows counts only, not values.

## Observability & budgets
`portable_commands_total{command,code}`; import apply p95 ≤ 2 s for 25 MiB.

## Tests
TEST-PS-055-07 (route contracts), TEST-PS-055-08 (idempotent export and apply).

## Acceptance criteria
1. Route fixtures validate against schemas.
2. Replayed apply returns the original `prf_` and creates no second profile.

## Assumptions & open decisions
- ASSUMPTION: export limit 3 per 24 h.
