# PS-131-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/03_assurance/mod_incident. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-FED-001, CTR-SCH-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-131-10.R01 | Export for regulators or auditors includes incident metadata and chain heads; timeline text only under legal hold. | MVP |
| PS-131-10.R02 | Export of incident data to federated peers is forbidden except sanitized notices (PS-131-07.R03). | MVP |
| PS-131-10.R03 | Backups include timelines encrypted at rest; restore verifies chain heads before serving. | MVP |
| PS-131-10.R04 | Rollback is forward-only: corrections are new timeline entries, never edits. | MVP |

## Data / schema
Export bundle schema `incident_export` version 1.0.0 (CTR-SCH-001 registry entry pending).

## Commands / queries / events
Export is a privileged read emitting `aud_` records.

## States & transitions
Import is not supported for incidents; external feeds create a new incident through `incident.declare`.

## Validation & errors
Export without authority: `SYS.FORBIDDEN`.

## Authorization
Export needs `security_incident.administer` at `global` and two approvers.

## Failure, idempotency, concurrency, offline
Restore drill quarterly (ASSUMPTION).

## Privacy, retention, abuse
Exported bundles carry PRIVATE_PERSONAL text only under legal hold.

## Observability & budgets
Counter `incident_export_total{purpose}`.

## Tests
- TEST-PS-131-10-01: restore, chain heads match.
- TEST-PS-131-10-02: export without hold excludes timeline text.

## Acceptance criteria
1. Zero timeline text in non-hold exports.
2. Restore drill passes quarterly.

## Assumptions & open decisions
- ASSUMPTION: quarterly restore drill.
- D07 (legal holds): PROVISIONAL (D07 default, unapproved).
