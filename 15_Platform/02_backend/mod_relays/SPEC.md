# F15.S02.M01 — relays

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Platform Lead (F15). **Parent:** [F15.S02 backend](../SPEC.md).

## Purpose and business behavior
relays is the store-and-forward transport for signed federation envelopes (CTR-FED-001). It accepts batches from peer nodes, verifies signatures and peer state, queues each event for its target peer, forwards with backoff, and records per-event acknowledgment. Relays move opaque bytes; they do not interpret listings, offers, messages or payments, and they never report that an exchange has happened.

## User stories
- As a participant on a federated node, my public listing reaches peer nodes that have opted in, without my home region or account name crossing the relay.
- As a peer operator, I can see whether each event I sent was accepted, duplicated, rejected or deferred, with a reason code.
- As an operator, I can suspend a peer and have its queued items purged without affecting other peers.

## Scope
Process specifications PS-118-01 to PS-118-10. Covers inbound and outbound batch transport, queueing, retry and acknowledgment. Excludes federation record semantics (F11 owns CTR-FED-001) and client offline queueing (D08, PWA module).

## Public interfaces
- `POST /v1/federation/batches` (inbound, peer-authenticated; PS-118-04).
- Outbound batch POST to peer endpoints (paths PENDING CTR-FED-001).
- Internal commands: relay.enqueue, relay.forward, relay.ack, relay.expire.
- Error codes: RELAY.* (PS-118-02) and shared FED.* codes from CTR-FED-001.

## Relationships, dependencies and integration
Upstream: F11 federation (peer state, keys, envelopes, CTR-FED-001); F16 authorization (CTR-CAP-001). Downstream: receiving relays and peers. Related: mod_api (client-facing API, no direct peer path), mod_observability (metrics). PENDING CTR for private-message ciphertext format (PS-118-07).

## Data ownership
Owns `relay_queue_item` and relay-side breaker state. Does not own peer records, node keys or events; those belong to F11 and F15 contracts.

## Risk considerations
Specific to relays: metadata leakage (sender node, recipient peer, timing and size) enabling graph analysis; Sybil relay operators; malicious peers flooding queues or replaying old batches; equivocation; forwarding of out-of-class data. Mitigations are in PS-118-07. No platform custody of money; relays carry no value fields. Pseudonymous peer labels are not anonymity guarantees.

## Completion criteria
All ten PS-118 files approved by Platform Lead and Security Lead; Privacy Lead (F10) metadata inventory signed; CTR-FED-001 interop tests green; PENDING items resolved.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-118-01 (SPEC-DRAFT-COMPLETE)
- [x] [validation_rules.md](validation_rules.md) — PS-118-02 (SPEC-DRAFT-COMPLETE)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-118-03 (SPEC-DRAFT-COMPLETE)
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-118-04 (SPEC-DRAFT-COMPLETE)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-118-05 (SPEC-DRAFT-COMPLETE)
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-118-06 (SPEC-DRAFT-COMPLETE)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-118-07 (SPEC-DRAFT-COMPLETE)
- [x] [observability_performance.md](observability_performance.md) — PS-118-08 (SPEC-DRAFT-COMPLETE)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-118-09 (SPEC-DRAFT-COMPLETE)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-118-10 (SPEC-DRAFT-COMPLETE)

## Assumptions and open decisions
- D01 PROVISIONAL (default: versioned signed envelopes with explicit opt-in; unapproved) governs the transport contract.
- D05 PROVISIONAL (default: coarse public regions; unapproved): relay carries no location fields.
- D08 PROVISIONAL (default: local pending queue until authenticated relay acknowledgment; unapproved) defines the acknowledgment rule.
- PENDING CTR for private-message ciphertext format; PENDING CTR-FED-001 HTTP path definitions.
