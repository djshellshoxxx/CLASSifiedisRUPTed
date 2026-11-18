# F13.S01.M01 — push

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Platform Lead. **Parent:** [F13.S01 delivery](../SPEC.md).

## Purpose and business behavior
Deliver Web Push wake-ups for `ntf_` notification records to devices the account has enrolled and opted into. Push is a signal, not a content channel: payloads carry only `ntf_id`, `category` and schema version; the client fetches detail over an authenticated API. MVP channel is `web_push` (VAPID). Native APNs/FCM is Future. Push never states that a payment, handover or deposit is confirmed; it reports claimed or changed states only (CTR-COM-001).

## User stories
- As a participant, I get a push when a cycle consent, dispute deadline or message needs my action, and the lock screen shows only "New activity".
- As a participant, I can revoke push on one device without affecting my other devices.
- As an operator, I can turn dispatch off with one flag and see provider health, without ever seeing endpoints or keys.

## Scope
- In scope: subscription registration and revocation per `dev_`; dispatch of `ntf_` references; retry, circuit breaker and expiry; generic payloads.
- Out of scope: notification text and content (F13.S01.M03 and content owners); quiet, hours and opt-in decisions (F13.S02); email (F13.S01.M02); native push (Future).

## Public interfaces
Commands `push.register_subscription`, `push.revoke_subscription`, `push.dispatch_notification`; queries `push.list_subscriptions`, `push.get_attempt_summary`; events `push_subscription.*` and `notification.push_*`. Full contracts in [commands_queries_events.md](commands_queries_events.md).

## Relationships, dependencies and integration
Upstream: device enrollment and sessions (F07.S01.M02, `dev_`); category registry and opt-in state (F13.S02.M03); quiet and hours gating (F13.S02.M01, F13.S02.M02) evaluated before dispatch. Downstream: in-app inbox (F13.S01.M03) reads the same `ntf_` IDs. Contracts: CTR-EVT-001, CTR-ERR-001, CTR-PRV-001, CTR-CAP-001, CTR-ID-001. Edges per DEPENDENCY_MATRIX.md.

## Data ownership
Owns `push_subscription` (`psb_`, PENDING CTR-ID-001) and `push_attempt` (`pda_`, PENDING CTR-ID-001) and their key material. References `ntf_` (F13 notification record) and `dev_` (F07) by ID only.

## Risk considerations
- Privacy: lock-screen leakage; provider metadata (endpoint, timing, size) visible to push services; an endpoint plus keys can be abused if leaked.
- Abuse: SSRF through a user-supplied endpoint; subscription flooding; push spam to a target account.
- Failure: provider outages; duplicate sends under at-least-once delivery; stale endpoints returning 404/410.
- Pseudonyms: a `prf_` view does not hide device enrollment from the owning `acc_`.
- No platform custody of money; push must not report payment as confirmed.

## Completion criteria
Process specs PS-104-01 to PS-104-10 at SPEC-DRAFT-COMPLETE; implementation and tests in later phases; Privacy Lead and Security Lead reviews pending; registry prefixes resolved.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-104-01
- [x] [validation_rules.md](validation_rules.md) — PS-104-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-104-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-104-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-104-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-104-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-104-07
- [x] [observability_performance.md](observability_performance.md) — PS-104-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-104-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-104-10
