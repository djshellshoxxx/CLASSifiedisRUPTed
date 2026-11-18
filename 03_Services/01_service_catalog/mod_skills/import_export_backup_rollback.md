# PS-029-10 — import export backup rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/01_service_catalog/mod_skills. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001, CTR-FED-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-029-10.R01 | Export: owner may export own `listing_skill` rows as JSON (≤ 20 per listing) with class labels; `pending_review` labels excluded. | MVP |
| PS-029-10.R02 | Taxonomy import accepts only signed or operator-published `skill_taxonomy_entry` sets; unsigned import → `SKILLS.IMPORT_UNSIGNED`. | MVP |
| PS-029-10.R03 | Taxonomy import is all-or-nothing per `taxonomy_version`; partial failure rolls back and leaves the prior version active. | MVP |
| PS-029-10.R04 | Backups of taxonomy and listing_skill tables retained per CTR-PRV-001 R06 backup expiry; restore is a new version, never in-place overwrite. | MVP |
| PS-029-10.R05 | Rollback of a taxonomy version re-points `active` to the prior version; rows keep their recorded `taxonomy_version`. | MVP |
| PS-029-10.R06 | Federation of skill taxonomy is Future; MVP import is local operator action only (CTR-FED-001 R02). | Future |
| PS-029-10.R07 | Import and export emit one audit event each with row counts, no content. | MVP |

## Data / schema
Export file: `{ "format": "classrup.skills.v1", "exported_at": "…", "rows": [ … ] }`, schema per CTR-SCH-001. Taxonomy import manifest: `taxonomy_version`, `entries_count`, `sha256` of JCS body, operator signature (Ed25519, ASSUMPTION).

## Commands / queries / events
Operations: `skill.export` (owner), `skill_taxonomy.import` and `skill_taxonomy.rollback` (ope, purpose). Events: `skill_taxonomy.published`, `skill_taxonomy.rolled_back`.

## States & transitions
Taxonomy version states: `staged → published → superseded` and `published → rolled_back_to(prior)`. Listing rows do not change status during taxonomy transitions.

## Validation & errors
`SKILLS.IMPORT_UNSIGNED`, `SKILLS.IMPORT_DIGEST_MISMATCH`, `SKILLS.VERSION_EXISTS` (retryable false). Restore against a newer schema MAJOR is refused with `SCH.UNKNOWN_VERSION`.

## Authorization
Export: owner only. Import, publish and rollback: `ope` with purpose and dual approval recommended (ASSUMPTION, not a PRIVATE/FINANCIAL class). See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Import keyed by `(taxonomy_version, sha256)`; repeated import of identical bytes is a no-op. Rollback is idempotent per target version. Backup restore uses point-in-time snapshot; no offline path.

## Privacy, retention, abuse
Exports contain PSEUDONYMOUS owner data only to the owner. Backups follow CTR-PRV-001 R06. Imported taxonomy entries are scanned for label text fields carrying personal data; rejection on match.

## Observability & budgets
Import of 2,000 entries completes ≤ 60 s (ASSUMPTION). Export of 20 rows ≤ 1 s.

## Tests
- TEST-PS-029-10-01 integration: import with bad digest leaves prior version active.
- TEST-PS-029-10-02 integration: rollback restores prior version; rows keep recorded version.
- TEST-PS-029-10-03 contract: export round-trip preserves all fields except excluded pending labels.

## Acceptance criteria
1. Failed import leaves zero partial rows and an unchanged active version.
2. Rollback changes no row `status`.
3. Export never includes pending labels or other accounts' data.

## Assumptions & open decisions
- ASSUMPTION: operator signing key managed under D10 (user-controlled keys apply to accounts, not operator taxonomy keys; PROVISIONAL).
- D07 retention PROVISIONAL for backups.
- No payment or receipt checklist applies.
