# F11.S02.M01 — delivery

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Platform Lead (role). **Parent:** F11.S02.

## Purpose and business behavior
Move federated events between nodes and relays in signed batches: queue events per peer, send after a random 0–60 s delay, retry retryable failures with jittered backoff, enforce per-peer size and rate limits, and record per-event results (accepted, duplicate, rejected, deferred). Node-to-node transport only; the PWA client's pending-write queue (D08) is not owned here.

## User stories
- As a node operator, events for a peer are delivered after a partition without manual replay.
- As a peer, I receive results for each event I sent, in order.
- As a participant, restricted-class data never enters a delivery queue.
- As an operator, revoking a peer drops its queued events immediately.

## Scope
- [domain_schema.md](domain_schema.md) — PS-088-01
- [validation_rules.md](validation_rules.md) — PS-088-02
- [workflow_state_machine.md](workflow_state_machine.md) — PS-088-03
- [commands_queries_events.md](commands_queries_events.md) — PS-088-04
- [authorization_capabilities.md](authorization_capabilities.md) — PS-088-05
- [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-088-06
- [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-088-07
- [observability_performance.md](observability_performance.md) — PS-088-08
- [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-088-09
- [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-088-10

## Public interfaces
Commands `fed.send_batch`, `fed.receive_batch`; events `dlv.sent`, `dlv.acknowledged`, `dlv.failed`, `delivery.dropped`. Details in PS-088-04.

## Relationships, dependencies and integration
Upstream: committed events (CTR-EVT-001), peer state and verification (CTR-FED-001), dedupe (`11_Federation/02_relay_sync/mod_dedup`). Downstream: peers, conflict handling (`mod_conflicts`), observability (F15).

## Data ownership
Owns batch records and per-peer queue rows. Event payloads remain with the origin aggregate.

## Risk considerations
Retry storms after a partition. Events expiring in the queue during long outages. Timing correlation between sender and content. Relay as a single point of failure. Delivery to a peer whose trust was revoked mid-queue. Acknowledgement lost, causing duplicate sends.

## Completion criteria
All 10 process specs reviewed; partition acceptance test defined; restricted-class refusal tested.

## Required process specification inventory
- [x] `domain_schema.md` — PS-088-01, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `validation_rules.md` — PS-088-02, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `workflow_state_machine.md` — PS-088-03, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `commands_queries_events.md` — PS-088-04, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `authorization_capabilities.md` — PS-088-05, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `failure_recovery_idempotency.md` — PS-088-06, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `privacy_retention_abuse.md` — PS-088-07, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `observability_performance.md` — PS-088-08, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `contract_and_acceptance_tests.md` — PS-088-09, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `import_export_backup_rollback.md` — PS-088-10, SPEC-DRAFT-COMPLETE (pending approval)
