# PS-055-01 — domain schema
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/02_profiles/mod_portable. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-SCH-001, CTR-PRV-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-055-01.R01 | Entities: `bnd_` portability bundle (signed export artifact) and `imj_` import job (one per bundle applied to one target node). | MVP |
| PS-055-01.R02 | Bundle manifest carries `bundle_digest` (SHA-256 of JCS of the body) and an Ed25519 signature by the exporting node key. | MVP |
| PS-055-01.R03 | Bundle subject is a per-bundle random `subject_token` (opaque, 128-bit). No `acc_` ID appears in the bundle body. | MVP |
| PS-055-01.R04 | Reputation tiers, moderation flags and evidence references are excluded from bundles (non-transferable derived data). | MVP |
| PS-055-01.R05 | Bundle `max_data_class` = PRIVATE_PERSONAL (owner's own data). LOCATION_PRECISE excluded unless explicit owner request (CTR-PRV-001 R11). | MVP |
| PS-055-01.R06 | Prefixes `bnd` and `imj` are PENDING CTR-ID-001 registry entries. | MVP |

## Data / schema
```json
bundle_manifest {
  "bundle_id": "bnd_<26 ulid>", "schema_version": "1.0.0", "subject_token": "base64url22",
  "created_at": "RFC3339 ms UTC", "expires_at": "created_at + 7 d", "max_data_class": "PRIVATE_PERSONAL",
  "record_counts": {"profile": "int", "region_cells": "int", "languages": "int", "avatar_refs": "int"},
  "bundle_digest": "hex64", "signature": {"alg": "Ed25519", "key_id": "key_<26>", "value": "base64url86"}
}
import_job { "id": "imj_<26>", "bundle_digest": "hex64", "target_node": "nod_<26>", "state": "staged | applied | rejected", "created_at": "RFC3339", "applied_profile_id": "prf_<26> | null" }
```
Signing domain tag: `CLASSRUPT-BND-SIG-v1\n` followed by JCS of the body (ASSUMPTION; distinct from the event tag in CTR-EVT-001 R05).

## Commands / queries / events
See [commands_queries_events](commands_queries_events.md).

## States & transitions
See [workflow_state_machine](workflow_state_machine.md).

## Validation & errors
See [validation_rules](validation_rules.md).

## Authorization
Owner only. Field visibility: `signature.value` and `subject_token` visible to owner; no field is visible to counterparties.

## Failure, idempotency, concurrency, offline
Schema versions follow CTR-SCH-001; migrations in [import_export_backup_rollback](import_export_backup_rollback.md).

## Privacy, retention, abuse
Bundle file: RET-EPH (deleted on download or at expiry). `bnd_` metadata: RET-AUD 12 months (no content).

## Observability & budgets
Counts by record type only.

## Tests
TEST-PS-055-01 (manifest schema), TEST-PS-055-02 (no `acc_` in body).

## Acceptance criteria
1. Manifest validates against CTR-SCH-001 fixture.
2. Body scan finds no `acc_`, reputation or moderation field.

## Assumptions & open decisions
- ASSUMPTION: 7-day bundle expiry; signature domain tag.
- Canonical owner note: this module owns portable profile bundle records (F07.S02.M01). Slug is shared with `11_Federation/01_protocol/mod_portable`, which owns federation transport and consumes `bnd_` by full ID under CTR-FED-001.
- PROVISIONAL (D10 default, unapproved): user-controlled keys and bundle signing.
