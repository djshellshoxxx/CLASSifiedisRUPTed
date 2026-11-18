# F15.S02.M02 — api

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Platform Lead (F15). **Parent:** [F15.S02 backend](../SPEC.md).

## Purpose and business behavior
api is the versioned HTTP/JSON boundary between ClassRup clients (PWA) and owning modules. It authenticates the session, validates request shape, enforces idempotency for state-changing commands, maps errors to CTR-ERR-001 envelopes and dispatches to the owning module. It owns no business aggregate and makes no completion claim: a 202 or 200 response reports acceptance by the owning module, not settlement.

## User stories
- As a participant on a slow connection, I can resend a publish or offer without creating a duplicate, because my retry carries the same idempotency key.
- As a participant, I receive a localized, stable error code when a request is rejected, without any echo of what I submitted.
- As an operator, I can deprecate and sunset an API version with a dated notice, and clients on a sunset version receive an explicit `API.VERSION_SUNSET` response.

## Scope
Process specifications (see inventory below): PS-117-01 to PS-117-10. Routes `/v1/*` only. Federation traffic is out of scope (mod_relays, CTR-FED-001).

## Public interfaces
- `POST /v1/commands/{command_type}` with required `Idempotency-Key`.
- `GET /v1/{resource}/{entity_id}`, `GET /v1/{resource}` (keyset pagination).
- `GET /v1/version`.
- Error envelope: CTR-ERR-001 (PENDING CTR-ERR-001 registry entries for `API.*` codes to be added on approval).

## Relationships, dependencies and integration
Upstream: F07 identity (session `ses_`), F16 authorization (CTR-CAP-001), F15 contracts (CTR-ID-001, CTR-EVT-001, CTR-SCH-001). Downstream: every owning module through the command registry. Sibling: mod_relays (federation transport), mod_storage (attachments). Integration tests use contract fixtures (PS-117-09). Timeouts and retries follow PS-117-06.

## Data ownership
Owns `api_idempotency` and `api_version` only (PS-117-01). Owns no user, listing, transaction or message data.

## Risk considerations
Specific to api: duplicate effects from retried commands without keys; IDOR through guessable identifiers; enumeration of objects via error differences; mass assignment through lenient parsing; memory exhaustion from large or deeply nested bodies; metadata leakage through access logs. No platform custody of money: api never holds balances. Pseudonyms do not hide `acc_` IDs from api logs, which therefore use hashed or pseudonymous references only.

## Completion criteria
All ten PS-117 files approved by Platform Lead and Security Lead; contract tests PS-117-09 green; privacy review (F10) of access-log fields complete; traceability to CTR IDs complete.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-117-01 (SPEC-DRAFT-COMPLETE)
- [x] [validation_rules.md](validation_rules.md) — PS-117-02 (SPEC-DRAFT-COMPLETE)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-117-03 (SPEC-DRAFT-COMPLETE)
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-117-04 (SPEC-DRAFT-COMPLETE)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-117-05 (SPEC-DRAFT-COMPLETE)
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-117-06 (SPEC-DRAFT-COMPLETE)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-117-07 (SPEC-DRAFT-COMPLETE)
- [x] [observability_performance.md](observability_performance.md) — PS-117-08 (SPEC-DRAFT-COMPLETE)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-117-09 (SPEC-DRAFT-COMPLETE)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-117-10 (SPEC-DRAFT-COMPLETE)

## Assumptions and open decisions
- D08 PROVISIONAL (default: local pending queue until authenticated relay acknowledgment; unapproved) drives the 24 h idempotency window.
- D10 PROVISIONAL (default: user-controlled keys with documented recovery; unapproved) is not applied in api v1.
- ASSUMPTION: limits and timeouts as stated in PS-117-02, -06, -07.
