# PS-071-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/02_settlement/mod_receipts (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R05–R08), CTR-PRV-001 (R06, R07), CTR-FED-001 (R03). **Decisions:** D06, D07 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-071-10.R01 | No receipt or evidence import from third parties or federation. | MVP |
| PS-071-10.R02 | Owner export: signed receipts with original bytes (CTR-SCH-001 R08) and evidence content as decrypted files only on owner request. | MVP |
| PS-071-10.R03 | Export manifest lists `claim_hash` and evidence digests so a third party can verify without platform access. | MVP |
| PS-071-10.R04 | Rollback that disables evidence upload keeps existing evidence readable to parties. | MVP |
| PS-071-10.R05 | Backups encrypted; restore reapplies redactions. | MVP |

## Data / schema
Manifest: `schema_version`, `receipt_count`, `evidence_count`, `manifest_sha256`, `generated_at`.

## Commands / queries / events
`receipt.exported` event, count only.

## States & transitions
Export lifecycle: `queued` → `generated` → `expired` (24 h).

## Validation & errors
`SYS.RATE_LIMITED` on frequency breach.

## Authorization
Owner export only; moderators cannot export on behalf of users.

## Failure, idempotency, concurrency, offline
Idempotent export by export ID.

## Privacy, retention, abuse
Decrypted evidence files exist only for the download window (24 h).

## Observability & budgets
Export p95 ≤ 10 s for 100 receipts (ASSUMPTION).

## Tests
- TEST-PS-071-10-01 (contract): manifest verification by independent tool.
- TEST-PS-071-10-02 (integration): restore reapplies redaction.
- TEST-PS-071-10-03 (integration): rollback keeps evidence readable.
- TEST-PS-071-10-04 (unit): decrypted files deleted at 24 h.

## Acceptance criteria
1. Manifest verifies without platform access.
2. Rollback leaves evidence readable.
3. Restore never reintroduces redacted content.

## Assumptions & open decisions
- ASSUMPTION: export limit per 24 h.
- D06, D07 (PROVISIONAL, unapproved).
