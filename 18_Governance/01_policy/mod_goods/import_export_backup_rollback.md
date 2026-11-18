# PS-144-10 — import export backup rollback

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-144-10. **Owner:** [18_Governance/01_policy/mod_goods](SPEC.md). **Implementing module:** 18_Governance/01_policy/mod_goods. **Consumers:** F18 compliance (policy export), F15 platform (backups, restore), F10 privacy (export scope). **Upstream:** F07 identity, F10 privacy, F16 security. See [dependency matrix](../../../DEPENDENCY_MATRIX.md).

## Purpose and scope
**Business outcome.** Policy catalogs and audit records can be moved, restored and rolled back without changing history. Imports cannot activate policy by themselves. Restores cannot duplicate decisions or events.

**Exclusions.** Participant data export (F10 owns the portability request). Listing exports (F01). Decision records are exportable for audit but are never importable.

## Export format
- Format: JSON Lines, UTF-8, one file per entity: `goods_category.jsonl`, `goods_policy_rule.jsonl`, `goods_decision.jsonl`, `goods_review_case.jsonl`.
- Compression: gzip per file. Maximum 100,000 records per file; larger sets split into numbered parts.
- First line of each file is a header record: `{"record_type":"header","schema_version":"1.0","entity":"...","export_id":"...","generated_at":"..."}`.
- `manifest.json` lists each file with record count, byte size and SHA-256, plus `export_id`, `schema_version` and `generated_at` (UTC).
- Scope: OPS exports categories and rules. AUD exports all four entities. `reviewer_note` is included only for AUD with the `goods.export.read` capability; otherwise omitted and marked `"redacted": true`.
- Erased subjects appear as tombstones (`tmb_<ULID>`), never as raw references.

## Import format and staging
`ImportGoodsPolicyBatch` takes a `batch_id` and a file reference with the same format as export. Processing:
1. Stage the batch in a quarantine area; nothing is visible to other queries.
2. Check manifest hashes, schema version, and each record against validation_rules.md.
3. Check referential integrity inside the batch and against existing records.
4. Run overlap checks (I1) for the complete batch as if applied in order.
5. Commit all or nothing. Batch size limit: 10,000 records.

Rules for imported content:
- Imported rules land in `EDITING` only, never `SCHEDULED` or `ACTIVE` (A-goods-16). Activation requires a separate Activate command from an operator, subject to separation of duties.
- Imported categories keep their `status`.
- Duplicate `category_code` with identical content hash is a no-op. Duplicate with different content returns GOODS_CATEGORY_CODE_TAKEN for that record and fails the batch.
- `goods_decision` and `goods_review_case` records cannot be imported. A batch containing them fails with GOODS_PAYLOAD_INVALID.
- Every imported record carries `batch_id` for rollback.

## Backup and restore
- Continuous write-ahead log archiving with point-in-time restore. **RPO: 15 min. RTO: 4 h** (A-goods-17).
- Daily full snapshot, kept 35 days. Backups encrypted at rest; keys managed by F16.
- Restore drill: quarterly, against a staging copy; pass when the restored record counts match the last checkpoint and the drill completes within RTO.
- Restore marker: a restore writes a marker event so consumers know the outbox was replayed.

## Restore and replay safety
- After restore, the outbox re-sends events with their original `event_id`. Consumers dedupe on `event_id`.
- No decision is re-evaluated during restore. Idempotency records within the 72 h window stop duplicate commands.
- Restore never reruns activations; sweeps re-check state from stored values.

## Rollback boundaries
| Operation | Reversible? | How |
|---|---|---|
| Category create | Yes | `UpdateGoodsCategory` to `DEPRECATED`. Hard delete is not offered once referenced. |
| Category update | Yes | New update restores prior values; prior version kept in history |
| Rule draft | Yes | Discard (`DISCARDED_BEFORE_ACTIVE`) |
| Rule scheduled | Yes | Cancel before `effective_from` |
| Rule activated | No in place | Retire with reason, then draft a new version |
| Decision recorded | No | Never deleted. Corrections append a new REVIEW decision referencing the case |
| Review decision | No | Corrected by a further decision row; both kept |
| Import batch, before any activation | Yes | Revert batch: deletes only `EDITING` rows with that `batch_id`; other rows untouched |
| Import batch, after activation | No in place | Retire activated rules; reverting the batch is refused |
| Schema migration | Forward-only | Expand then contract. Previous code reads both versions for one release |
| Restore from backup | Point-in-time | Choose restore point; events after the point are replayed from the outbox with dedupe |

## Migration rules
- Schema changes are forward-only expand and contract migrations.
- Each migration records `schema_version` in the migration table.
- A migration that rewrites `goods_decision` is refused; decisions are immutable (I2).

## Assumptions
- **A-goods-16.** Imported rules never activate directly. This prevents a bulk file from changing live decisions without the activation check.
- **A-goods-17.** RPO 15 min and RTO 4 h are concrete defaults. They are not yet agreed with F15.

## Open decisions
- **OD-GOODS-10.** Whether exports to external regulators need a signed manifest. Default: manifest hash only; signing is F16 scope if required.
