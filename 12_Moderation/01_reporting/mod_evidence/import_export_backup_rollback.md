# PS-093-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/01_reporting/mod_evidence (Trust&Safety Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-093-10.R01 | No import of moderation evidence from any federated peer (CTR-FED-001 R03). | MVP |
| PS-093-10.R02 | Export only under a signed legal-process ticket and an active legal hold; dual `ope` approval. | MVP |
| PS-093-10.R03 | Export bundle is encrypted, contains a SHA-256 manifest, and redacts uninvolved third-party personal fields. | MVP |
| PS-093-10.R04 | Backups are encrypted and excluded from analytics restores. | MVP |
| PS-093-10.R05 | Rollback disables capture only; it never deletes or alters stored items. | MVP |

## Export
| Step | Rule |
|---|---|
| Request | `evidence.export` by `sys_` on ticket; ticket has case ID, legal basis, end date |
| Scope | items in one `cas_` under hold only |
| Bundle | encrypted, manifest (IDs, sha256, captured_at), redaction applied |
| Delivery | to approved recipient only; download link expires in 24 h |
| Audit | `aud_` per export; bundle hash recorded |

## Backup and restore
- Backup schedule per F15 policy (ASSUMPTION daily, 30-day retention for staging-free snapshots).
- Restore order: purges → holds → serve. Restored items with expired retention are purged, not served (BT-04).
- Content keys held in KMS; a backup without KMS access is unreadable by design.

## Rollback
- Feature flag `evidence.capture_enabled` (F15.S04.M02 flags, distinct class) off → new captures return `SYS.UNAVAILABLE`.
- Read paths and redaction stay on during rollback so that moderators keep access.
- Schema rollback is forbidden for 1.0.0 once items exist; use a new MINOR.

## Versioning
Schema 1.0.0. Adding an optional field is MINOR. Changing a class is MAJOR (CTR-PRV-001).

## Validation & errors
Export without ticket → `CAP.DUAL_APPROVAL_REQUIRED` or `SYS.FORBIDDEN`. Expired bundle link → `SYS.GONE`.

## Failure, idempotency, concurrency, offline
Export is idempotent on (ticket ID, bundle hash). Interrupted export restarts from manifest; no partial bundle is delivered.

## Privacy, retention, abuse
Exports are the highest-risk path: manifest contains IDs only; recipients receive an access log entry. Federation and third-party sharing are not permitted.

## Observability & budgets
`evidence_exports_total{outcome}`; any export without ticket is a Sev-1 alert.

## Tests
- TEST-PS-093-10-01 (export): bundle manifest hashes match; third-party personal fields absent.
- TEST-PS-093-10-02 (backup): restored store replays redaction before serving.
- TEST-PS-093-10-03 (rollback): capture disabled, reads and redaction still work, no item altered.

## Acceptance criteria
1. No federated import path exists for `mev_` (lint).
2. Rollback leaves item count and hashes unchanged (TEST-03).

## Assumptions & open decisions
- ASSUMPTION: legal-process handling defined by F10 with jurisdiction review (OPEN).
- PROVISIONAL (D10 default, unapproved): user-controlled keys with documented recovery; evidence keys are operator-held in KMS, not user-held.
