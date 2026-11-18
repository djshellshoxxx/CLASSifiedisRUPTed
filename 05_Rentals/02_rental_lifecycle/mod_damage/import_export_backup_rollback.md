# PS-041-10 — import export backup rollback

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-041-10. **Owner:** [05_Rentals/02_rental_lifecycle/mod_damage](SPEC.md). **Implementing module:** 05_Rentals/02_rental_lifecycle/mod_damage. **Consumers:** declared via [dependency matrix](../../../DEPENDENCY_MATRIX.md); named in the Dependencies section of this file.

## Purpose and scope
Defines the portability export for a participant's own damage data, the absence of a claim import path, backup and restore boundaries, and rollback boundaries for schema and feature changes. The rule: committed events are never rewritten, and rollback never deletes history.

Exclusions: federation (CTR-FED-001), payment records (F09), and moderation case records (F12).

## Requirements
- **PS-041-10.R01** Export scope. A participant can export every claim where they are the lender or renter, its evidence metadata, their own responses and attestations, and the claim timeline. Other participants' private text is excluded.
- **PS-041-10.R02** Case coverage. Export handles: no claims (empty bundle), claims with purged text (tombstones shown), claims in progress, oversized histories (paging), and requests during a hold (allowed, marked).
- **PS-041-10.R03** Budgets. Export generation is asynchronous. Bundle is ready within 10 minutes for up to 1000 claims. The download link is valid for 24 hours.

## Export format
**Assumption A-damage-22:** The export is a ZIP archive named `damage-export-<claim-scope>-<yyyymmdd>.zip` with:
- `manifest.json`: format identifier `damage-export/1.0`, generation time (UTC), requester role, counts per file, and SHA-256 of each file.
- `claims.ndjson`: one damage_claim per line, with fields from domain_schema.md. Free text is included only for the requester's own text fields.
- `responses.ndjson`, `attestations.ndjson`, `evidence_metadata.ndjson`, `events.ndjson`: one record per line, sorted by claim_id then sequence.
- Media bytes are excluded by default. A separate media bundle may be requested later; it is delivered as files plus a digest manifest and is not part of v1.

Encoding: UTF-8, NFC, LF line endings, no byte order mark. Dates in RFC 3339 UTC with `Z`. Amounts as integers in minor units with `currency_code`.

Export excludes: `hold_remaining_ms`, moderation case references, moderator notes, other participants' free text, and any internal `actor_ref` hashes.

## Import
- There is no import path for damage claims in v1. Claims are created only through commands (PS-041-04).
- Restoring a deployment from backup is an operator action, not a user import (see Backup and restore).
- Importing an export into another system is out of scope and is not a supported path in v1.

## Backup and restore
**Assumption A-damage-23:** Recovery point objective 24 hours and recovery time objective 4 hours for this module's tables and evidence metadata. These inherit F15 values until F15 publishes its own.

- Backup scope: damage_claim, damage_response, damage_attestation, damage_evidence, damage_event, and outbox rows not yet published.
- Evidence media is backed up by the shared evidence store, under its own spec. This module requires that the store's backup is at least as recent as the metadata backup at restore time.
- Restore procedure:
  1. Restore metadata to a consistent snapshot.
  2. Verify that for every claim, event sequence is gap-free and the projection equals the replayed event log.
  3. Verify that every evidence row with a `media_ref` resolves in the evidence store; unresolved references are marked, not deleted.
  4. Re-emit outbox events after the snapshot point. Consumers deduplicate by `event_id`.
  5. Re-run timers. Expiry is idempotent (PS-041-06).
- Events emitted after the snapshot and before the restore are not recreated. The restore report lists the window so that consumers can reconcile.

## Rollback boundaries
- **Schema.** Migrations are additive only: new nullable columns, new tables, new indexes. No column is dropped or renamed in a release that is live. Destructive changes need a separate spec and a new schema_version.
- **Feature flag.** Turning `damage_claims_enabled` off stops new commands (DAMAGE_FEATURE_DISABLED). Reads, exports and timers keep running so that open claims are not stranded. Turning it back on resumes normal operation.
- **Code rollback.** Reverting code to a previous build is allowed if the schema is unchanged or additively extended. Events written by a newer build remain readable: unknown optional fields are ignored by older readers.
- **Data rollback.** No command deletes or edits committed events. A bad transition is corrected by a new moderation outcome or by the external process in PS-041-03.
- **Purge boundary.** Deletion under retention (PS-041-07) is a separate, logged operation. It is not a rollback mechanism.

## Open decisions
- **Assumption A-damage-22:** Export format `damage-export/1.0` and media exclusion.
- **Assumption A-damage-23:** RPO 24 hours and RTO 4 hours until F15 publishes values.
- D07 (retention) is OPEN; export and purge boundaries follow A-damage-19.
- D10 (auth and portability) is OPEN; key rotation may affect who can request an export.
