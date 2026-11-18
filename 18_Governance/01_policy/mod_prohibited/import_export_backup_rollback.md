# PS-146-10 — import export backup rollback

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-146-10. **Owner:** [18_Governance/01_policy/mod_prohibited](SPEC.md). **Implementing module:** 18_Governance/01_policy/mod_prohibited. **Consumers:** publish, offer, proposal and cycle-inclusion owners in [01_LocalBazaar](../../../01_LocalBazaar), [02_LocalMutiny](../../../02_LocalMutiny), [03_Services](../../../03_Services), [04_Auctions](../../../04_Auctions) and [05_Rentals](../../../05_Rentals); [10_Privacy](../../../10_Privacy); [11_Federation](../../../11_Federation). Dependency rows: [dependency matrix](../../../DEPENDENCY_MATRIX.md).

## Purpose and scope
- PS-146-10.R01: Business outcome. Catalogue versions can be exported for governance review, imported into a clean instance for staging, backed up, and restored; decision and hold evidence is never imported, overwritten or rolled back. Activation can be reversed only by a new activation of an earlier version.
- Exclusions: federation of catalogue or decisions to other instances (F11; no federated export defined here, A-prohibited-16 scope); participant data portability (F10, which receives only the own-decision view from domain_schema via query).

## Export
- Formats: NDJSON (UTF-8, LF line endings), gzip-compressed, one file per record family, plus `manifest.json`.
- Files: `policy_versions.ndjson.gz`, `rules.ndjson.gz`, `manifest.json`. Decision and hold exports are separate, restricted files, produced only for auditors (`EVIDENCE_EXPORT` audit entry), and contain pseudonymous ids and digests only.
- Manifest fields: `schema_version: "1"`, `exported_at` (UTC ms), `source_instance_id`, `record_counts` per file, `sha256` per file, `policy_version_ids` included, `export_kind` in {CATALOGUE, EVIDENCE}.
- Catalogue export includes match_terms and structured_flag values. Classification: PSEUDONYMOUS_OPERATIONAL (A-prohibited-04); requires `prohibited.rule.internal.read`; not shared with participants.
- PS-146-10.R02: Export is read-only, consistent at a single transaction snapshot, and rate-limited to one catalogue export per instance per hour.

## Import
- PS-146-10.R03: Catalogue import creates new PolicyVersion rows in EDITING state with new version_number values (never reused, domain_schema.md). Imported status fields are ignored.
- PS-146-10.R04: Imported rules are validated with validation_rules.md R11-R15. Any failure rejects the whole file; no partial import.
- PS-146-10.R05: Imports never create ACTIVE, RETIRED or DISCARDED versions. Activation after import requires the normal approval (PS-146-05.R02).
- PS-146-10.R06: Evidence files (decisions, holds, audit) are not importable into a running instance. Restoring evidence is a restore operation only (below).
- PS-146-10.R07: Imports are idempotent by `content_sha256`: importing the same file twice creates one EDITING version and returns the existing id.
- Import is refused unless manifest sha256 values match, and unless `schema_version` is `"1"`.

## Backup
- Scope: all five records (domain_schema.md) plus the idempotency table and outbox.
- Backups: continuous WAL archiving with point-in-time recovery; daily full snapshot retained 35 days; encrypted at rest with platform KMS (F15).
- Recovery point objective: 5 minutes. Recovery time objective: 2 hours for a single-instance restore; 4 hours for a region restore (proposed defaults, to validate in 17_Quality).
- Hold keys (HMAC keys for input_digest) are backed up separately with restricted access. Without the key matching `hmac_key_id`, digests cannot be verified; the decisions remain valid.
- Backups contain subject ids and digests; they inherit PSEUDONYMOUS_OPERATIONAL handling and retention limits (privacy_retention_abuse.md). A restored backup past its retention window is not restored; its evidence is deemed lapsed.

## Restore
- PS-146-10.R08: Restore to a new instance first, then reconcile. Restoring over a live instance requires a maintenance window and an auditor approval recorded in PolicyAuditEntry (EVIDENCE_EXPORT is not reused; a restore approval is recorded with `reason_code` = `RESTORE_APPROVED`).
- PS-146-10.R09: Restore boundary: restoring to a point before an activation removes that activation and its later effects from the restored state. The events already emitted are not recalled; the owner reconciliation procedure applies (failure_recovery_idempotency.md R13).
- PS-146-10.R10: Evidence rows are never overwritten by a restore. A restore into a live instance writes evidence created after the restore point to a side table for auditor review, and does not delete it.
- Outbox replay after restore: events are re-emitted with their original event_id; consumers dedupe by event_id.

## Rollback
- Activation rollback: activate an earlier version as a new PolicyVersion (copy), with new version_number, through the normal approval flow. The rolled-back version becomes RETIRED. Rollback never deletes or edits the rolled-back version.
- Decision rollback: not applicable. Decisions are evidence. A wrong decision is superseded by a new decision (workflow_state_machine.md R05) with an audit reason.
- Hold rollback: not applicable. A wrong resolution is corrected by a new reviewer action with a reason_code; the earlier resolution stays in audit.
- Migration rollback: schema migrations are forward-only; a failed migration is rolled back by restoring the pre-migration snapshot to a new instance.

## Open decisions
- A-prohibited-02 (manifest and event timestamp format), A-prohibited-04 (export classification), A-prohibited-09 (backup retention aligned with evidence retention), A-prohibited-10 (idempotency records excluded from export).
- RPO and RTO values are proposed defaults and need platform confirmation (F15). Not in DECISIONS.md.
- Federated import and export of catalogues to peer instances is deferred (A-prohibited-16 scope; D01 OPEN for envelopes).
