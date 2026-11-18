# F03.S02.M03 — disputes

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Commerce Lead (F03). **Parent:** [F03.S02 service_booking](../SPEC.md).

## Purpose and business behavior
Lets the client or provider of a service booking raise, answer and withdraw a disagreement about a milestone or booking: non-delivery, scope mismatch, quality, lateness or a disputed acceptance. It defines which service states can be disputed, the service-specific reason codes, evidence requirements and the 14-day window. It does not hold funds, decide outcomes or verify physical delivery.

**Canonical record owner (B-06):** the dispute record class is owned by F09.S02.M02 `09_Commerce/02_settlement/mod_disputes` ([SPEC](../../../09_Commerce/02_settlement/mod_disputes/SPEC.md)). Consumers, including this module, reference it by full ID only. PROVISIONAL (ASSUMPTION): the canonical owner choice is pending Commerce Lead confirmation.

## User stories
- As a client, I can dispute a submitted milestone with a reason code, a note and evidence digests within 14 days.
- As a provider, I can answer a dispute and add evidence within 7 days, without the platform treating my statement as verified.
- As an operator, I see dispute state through the canonical F09 record and never receive free-text narratives in service analytics.

## Scope
Ten canonical process specifications (PS-030-01 to PS-030-10). Link-level behavior only; outcome and funds handling are F09 scope.

## Public interfaces
Commands `dispute.create`, `dispute.add_evidence`, `dispute.respond`, `dispute.withdraw`. Queries `dispute.get_link`, `dispute.list_for_subject`. Events `service_dispute.link_opened`, `service_dispute.link_refused`, `service_dispute.exported`. Error prefix `DISPUTE`. Canonical contracts: CTR-COM-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001, CTR-PRV-001.

## Relationships, dependencies and integration
Upstream: F03.S02.M02 milestones (subject state), F03.S02.M01 quotes (booking context), F07 identity, F16 capabilities. Downstream: F09.S02.M02 canonical dispute record, F12 moderation (conduct signals), F09 claim states. Integration requires contract tests against F09 and timeout/retry behavior per [failure_recovery_idempotency.md](failure_recovery_idempotency.md).

## Data ownership
Owns `service_dispute_link` only. Does not own dispute records, evidence bodies, claims, milestones or quotes.

## Risk considerations
Unfair or serial disputes, false non-delivery claims for physical services, reason codes leaking sensitive detail, unknown outcomes after a timeout leaving a duplicate or missing record, and claim states implying payment. Pseudonyms do not guarantee anonymity between parties who share a booking.

## Completion criteria
Ten process specifications at SPEC-DRAFT-COMPLETE; canonical owner link resolves; contract tests specified against F09; open decisions (D04, D06, D07) linked as PROVISIONAL. Approval and implementation remain future gates.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-030-01
- [x] [validation_rules.md](validation_rules.md) — PS-030-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-030-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-030-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-030-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-030-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-030-07
- [x] [observability_performance.md](observability_performance.md) — PS-030-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-030-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-030-10
