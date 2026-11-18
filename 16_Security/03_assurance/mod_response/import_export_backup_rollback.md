# PS-132-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/03_assurance/mod_response. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001, CTR-PRV-001, CTR-SCH-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-132-10.R01 | Containment records export only with the parent incident (PS-131-10). | MVP |
| PS-132-10.R02 | No import of containment actions from peers; a peer notice creates a proposal only. | MVP |
| PS-132-10.R03 | Backups include action records and step logs; restore does not re-execute actions. | MVP |
| PS-132-10.R04 | Rollback of an action is a new action referencing the original (forward-only). | MVP |

## Data / schema
Export schema `containment_export` version 1.0.0 (CTR-SCH-001 registry pending).

## Commands / queries / events
Restore sets action status to `expired` if not `executed` at backup time; never re-runs execution.

## States & transitions
Restored `executing` actions become `failed` and require human decision.

## Validation & errors
Peer-supplied action body rejected with `RESPONSE.ACTION_TYPE_INVALID` when not a proposal.

## Authorization
Export requires `containment_action.read` with incident scope.

## Failure, idempotency, concurrency, offline
Restore is idempotent by `action_id`.

## Privacy, retention, abuse
Exports exclude target content; IDs only.

## Observability & budgets
Counter `response_restore_action_status_total{from,to}`.

## Tests
- TEST-PS-132-10-01: restore does not re-execute revocation.
- TEST-PS-132-10-02: peer-supplied execute body rejected.

## Acceptance criteria
1. Zero re-executions on restore in fixtures.
2. Peer-supplied action never reaches `executing`.

## Assumptions & open decisions
- ASSUMPTION: restored executing actions become failed.
- D01 (peer notices): PROVISIONAL (D01 default, unapproved).
