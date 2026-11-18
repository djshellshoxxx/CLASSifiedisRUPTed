# F03.S02.M02 — milestones

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Commerce Lead (F03). **Parent:** [F03.S02 service_booking](../SPEC.md).

## Purpose and business behavior
Splits an accepted service quote into an ordered plan of up to 12 milestones, each with an amount, a due date and acceptance text. Tracks each milestone from start through provider submission to client acceptance, auto-acceptance after 7 days, or dispute. Acceptance records the participants' assertion only. Money movement and claim states are owned by F09; this module never reports a milestone as paid.

## User stories
- As a client, I review a milestone plan whose amounts add up exactly to the accepted quote total before I agree to it.
- As a provider, I submit a milestone with evidence digests and know that acceptance starts a claim but does not prove payment.
- As a client, I can reject a submission twice; a third disagreement goes to the dispute process.

## Scope
Ten canonical process specifications (PS-031-01 to PS-031-10). No payment rails, escrow or custody.

## Public interfaces
Commands `milestone.plan_set`, `milestone.start`, `milestone.submit`, `milestone.accept`, `milestone.reject`, `milestone.cancel`. Queries `milestone.list_for_booking`, `milestone.get`, `milestone.export`. Events `milestone.submitted`, `milestone.accepted`, `milestone.rejected`, `milestone.auto_accepted`, `milestone.cancelled`, `milestone.disputed`, `milestone.exported`. Error prefix `MILESTON`. Canonical contracts: CTR-COM-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001, CTR-PRV-001.

## Relationships, dependencies and integration
Upstream: F03.S02.M01 quotes (accepted total), F07 identity, F16 capabilities. Downstream: F09 claims (CLAIMED requests), F03.S02.M03 disputes (link opened, outcome). Integration requires idempotent claim requests and timeout/retry per [failure_recovery_idempotency.md](failure_recovery_idempotency.md).

## Data ownership
Owns `milestone` rows and the plan. Does not own quotes, claims, dispute records or payment evidence.

## Risk considerations
Plan amounts that do not match the quote, acceptance mistaken for payment, duplicate claim requests after retries, pressure through repeated plan edits, and disagreements about physical work that the platform cannot verify. Acceptance is an attestation and does not prove handover.

## Completion criteria
Ten process specifications at SPEC-DRAFT-COMPLETE; sum invariant and claim-state rules specified; open decisions (D03, D04, D07, D08) linked as PROVISIONAL. Approval and implementation remain future gates.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-031-01
- [x] [validation_rules.md](validation_rules.md) — PS-031-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-031-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-031-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-031-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-031-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-031-07
- [x] [observability_performance.md](observability_performance.md) — PS-031-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-031-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-031-10
