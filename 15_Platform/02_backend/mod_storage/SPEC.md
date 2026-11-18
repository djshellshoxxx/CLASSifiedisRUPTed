# F15.S02.M03 — storage

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Platform Lead (F15). **Parent:** [F15.S02 backend](../SPEC.md).

## Purpose and business behavior
storage holds the bytes behind listing photos, attachments and evidence PDFs. It validates and strips uploads, quarantines unscanned or disallowed content, serves bytes only after the referencing owner authorizes the read, and deletes or quarantines blobs on owner or moderator instruction. It does not decide who may see a blob, what a blob proves, or whether an exchange completed.

## User stories
- As a seller, my listing photos are stored without the GPS coordinates my phone embedded.
- As a participant in a dispute, I can attach a PDF to my case and only the case parties can open it.
- As a user who deleted a listing, its photos disappear from storage and the CDN within 24 hours.

## Scope
Process specifications PS-119-01 to PS-119-10. Covers blob storage, upload validation, scanning hooks, serving, deletion, export and restore of blobs. Excludes attachment records (F08 `att_`), evidence records (F09 `evd_`) and listing records (F01 `lst_`).

## Public interfaces
- `POST /v1/blobs`, `GET /v1/blobs/{blob_id}`, `DELETE /v1/blobs/{blob_id}`.
- Events `blob.quarantined`, `blob.deleted`.
- Error codes STO.* (PS-119-02, PS-119-06).

## Relationships, dependencies and integration
Upstream: mod_api (routing, auth), F07 identity, F16 authorization. Referencing owners: F01 listing (`lst_`), F08 attachment (`att_`), F09 evidence (`evd_`). Downstream: CDN, scanner service. Canonical attachment record owner is F08; this module never duplicates attachment records. PENDING CTR-ID-001 registration of `blb_`.

## Data ownership
Owns `stored_blob` and object bytes. Does not own attachment, listing or evidence records; those reference `blob_id`.

## Risk considerations
Specific to storage: EXIF/GPS leakage from photos; active content (SVG, HTML, polyglot files) served to browsers; decompression bombs; guessed blob IDs; orphaned objects holding deleted personal media; stale CDN copies after deletion; evidence files that could be mistaken for verified proof (they are self-attested artifacts only). No platform custody of money. Pseudonymous owner references do not hide what a photo shows.

## Completion criteria
All ten PS-119 files approved by Platform Lead and Security Lead; Privacy Lead (F10) class mapping signed; scanner integration tested; PENDING ID registration resolved.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-119-01 (SPEC-DRAFT-COMPLETE)
- [x] [validation_rules.md](validation_rules.md) — PS-119-02 (SPEC-DRAFT-COMPLETE)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-119-03 (SPEC-DRAFT-COMPLETE)
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-119-04 (SPEC-DRAFT-COMPLETE)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-119-05 (SPEC-DRAFT-COMPLETE)
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-119-06 (SPEC-DRAFT-COMPLETE)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-119-07 (SPEC-DRAFT-COMPLETE)
- [x] [observability_performance.md](observability_performance.md) — PS-119-08 (SPEC-DRAFT-COMPLETE)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-119-09 (SPEC-DRAFT-COMPLETE)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-119-10 (SPEC-DRAFT-COMPLETE)

## Assumptions and open decisions
- D05 PROVISIONAL (default: user-initiated precision disclosure; unapproved): location stripped by default.
- D07 PROVISIONAL (default: minimal per-category retention with legal-hold exceptions; unapproved).
- D09 PROVISIONAL (default: no platform custody; unapproved): evidence files are self-attested artifacts only.
- PENDING CTR-ID-001 prefix `blb_`.
