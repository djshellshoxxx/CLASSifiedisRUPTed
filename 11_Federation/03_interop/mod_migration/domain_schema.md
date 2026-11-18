# PS-090-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/03_interop/mod_migration. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R07–R10), CTR-EVT-001 (R08), CTR-FED-001 (R08, R09), CTR-ID-001 (new prefix PENDING CTR-ID-001: `mig_`).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-090-01.R01 | A migration run records `kind` (`schema`, `node`, `key`), `from_version`, `to_version`, `scope` (aggregate filter), and a dry-run report digest. | MVP |
| PS-090-01.R02 | A run has an approval list of distinct approvers and a `rollback_deadline` (≤ 14 days, ASSUMPTION). | MVP |
| PS-090-01.R03 | Migration never changes stored bytes of signed records (CTR-SCH-001 R08). Lossless view is produced instead. | MVP |
| PS-090-01.R04 | Migration `scope` must be an explicit list or a named filter; `*` is rejected. | MVP |

## Data / schema
| Field | Type | Constraint |
|---|---|---|
| `run_id` | string | `mig_` + 26 chars (PENDING) |
| `kind` | enum | `schema`, `node`, `key` |
| `from_version`, `to_version` | SemVer | `to` > `from` within the same MAJOR, or a MAJOR step with a registered migration |
| `scope` | object | `{type: list\|filter, ids[] \| filter_name}` |
| `dry_run_digest` | string | sha256 of dry-run report |
| `status` | enum | see [workflow_state_machine.md](workflow_state_machine.md) |
| `approvals[]` | object[] | `{approver_ref, approved_at}`, distinct refs |
| `rollback_deadline` | date-time | ≤ `completed_at` + 14 d |
| `schema_version` | const | `1.0.0` |

Class of migration records: PSEUDONYMOUS. No payload stored in run records.

## Commands / queries / events
See [commands_queries_events.md](commands_queries_events.md).

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md).

## Authorization
See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Checkpoints per batch of aggregates (PS-090-06). Migrations are operator-run and online only.

## Privacy, retention, abuse
Run records contain IDs and counts. Retention in file 07.

## Observability & budgets
Progress and checkpoint metrics in file 08.

## Tests
- TEST-PS-090-01-01 (schema): scope `*` rejected.
- TEST-PS-090-01-02 (approvals): duplicate approver refs count once.
- TEST-PS-090-01-03 (deadline): rollback deadline beyond 14 days rejected.

## Acceptance criteria
1. Run record validates.
2. Scope and approval rules enforced.

## Assumptions & open decisions
- ASSUMPTION: 14-day rollback window.
- PROVISIONAL (D01 default, unapproved): versioned protocol with explicit migration hooks.
