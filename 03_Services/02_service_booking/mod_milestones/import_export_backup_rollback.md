# PS-031-10 — import export backup rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/02_service_booking/mod_milestones. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-SCH-001, CTR-FED-001, CTR-COM-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-031-10.R01 | Participant export of own milestone plans (≤ 12 rows per booking) as JSON; acceptance text included for the exporter's own rows only (CTR-PRV-001 R11). | MVP |
| PS-031-10.R02 | Counterparty acceptance text is redacted in exports. | MVP |
| PS-031-10.R03 | Import of milestone plans is not supported in MVP; plans are created only via `milestone.plan_set`. | MVP |
| PS-031-10.R04 | Backups follow CTR-PRV-001 R06 expiry; restore creates a new version, never overwrites. | MVP |
| PS-031-10.R05 | Rollback never reverts a claim state; `accepted` milestones remain accepted after a code rollback. | MVP |
| PS-031-10.R06 | Export and restore emit audit records with counts only (CTR-PRV-001 R12). | MVP |
| PS-031-10.R07 | Federation of milestone plans is Future (CTR-FED-001). | Future |

## Data / schema
Export: `{ "format": "classrup.milestone_plan.v1", "rows": [ … ] }`; schema per CTR-SCH-001.

## Commands / queries / events
`milestone.exported` (audit, counts only). No import command.

## States & transitions
Restore sets state only from snapshot; never moves a terminal milestone back. See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
`MILESTON.EXPORT_LIMIT` above 12 rows per request; `MILESTON.IMPORT_NOT_SUPPORTED`.

## Authorization
Export: participant only. Restore: `ope` with purpose and dual approval (ASSUMPTION). See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Export is read-only and retry-safe. Restore keyed by snapshot ID.

## Privacy, retention, abuse
Export files deleted after download or 24 h (ASSUMPTION). Backups per CTR-PRV-001 R06.

## Observability & budgets
Export ≤ 1 s for one booking (ASSUMPTION).

## Tests
- TEST-PS-031-10-01 contract: export round trip.
- TEST-PS-031-10-02 negative: import refused.
- TEST-PS-031-10-03 integration: restore keeps `accepted` state.

## Acceptance criteria
1. Export contains no counterparty acceptance text.
2. Restore never changes a terminal milestone state.
3. No import path in MVP.

## Assumptions & open decisions
- ASSUMPTION: 24 h export expiry.
- D07 PROVISIONAL for backups.
- Payment checklist applies: amounts exported to participants only.
