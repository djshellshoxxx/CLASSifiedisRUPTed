# PS-030-10 — import export backup rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/02_service_booking/mod_disputes. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-SCH-001, CTR-FED-001, CTR-COM-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-030-10.R01 | Export: a participant may export its own `service_dispute_link` rows as JSON (≤ 20 per request) with reason codes and amounts (PRV-001 R11). Counterparty identifiers redacted to pseudonym. | MVP |
| PS-030-10.R02 | Canonical dispute records are exported by F09 only; this module's export contains link fields only. | MVP |
| PS-030-10.R03 | Import into this module is not supported in MVP. Imported links would bypass F09 eligibility. | MVP |
| PS-030-10.R04 | Backups: link rows included in backups with CTR-PRV-001 R06 expiry; restore creates a new version; no in-place overwrite. | MVP |
| PS-030-10.R05 | Rollback: a schema or code rollback never re-opens closed disputes; `link_state` values are preserved. | MVP |
| PS-030-10.R06 | Export and restore operations emit one audit record each with counts and no content (CTR-PRV-001 R12). | MVP |
| PS-030-10.R07 | Federation export of disputes is Future and requires a separate decision (CTR-FED-001 R03). | Future |

## Data / schema
Export: `{ "format": "classrup.service_dispute_link.v1", "exported_at": "…", "rows": [ … ] }`. Schema per CTR-SCH-001.

## Commands / queries / events
`service_dispute.exported` (audit event, counts only). No import command exists.

## States & transitions
Export does not change `link_state`. Restore sets `link_state` only from the backed-up snapshot ([workflow_state_machine.md](workflow_state_machine.md)).

## Validation & errors
`DISPUTE.EXPORT_LIMIT` above 20 rows per request (retryable false, use cursor). `DISPUTE.IMPORT_NOT_SUPPORTED` if an import is attempted.

## Authorization
Export: participant only. Restore: `ope` with purpose and dual approval (ASSUMPTION). See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Export is read-only and retry-safe. Restore is keyed by snapshot ID.

## Privacy, retention, abuse
Exports exclude other parties' reason notes (never stored here) and amounts of counterparties. Export files are deleted after download or 24 h, whichever first (ASSUMPTION).

## Observability & budgets
Export of 20 rows ≤ 1 s (ASSUMPTION). Restore audited.

## Tests
- TEST-PS-030-10-01 contract: export round-trip preserves all link fields.
- TEST-PS-030-10-02 negative: import request refused.
- TEST-PS-030-10-03 integration: restore does not reopen a `refused` or terminal link.

## Acceptance criteria
1. Export contains no counterparty `acc_`.
2. Restore never changes a terminal `link_state`.
3. No import path exists in MVP.

## Assumptions & open decisions
- ASSUMPTION: 24 h export expiry.
- D07 (retention) PROVISIONAL for backups.
- Payment checklist applies: amounts exported only to participants.
