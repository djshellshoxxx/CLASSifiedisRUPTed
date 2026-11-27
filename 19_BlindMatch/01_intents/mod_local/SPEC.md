# F19.S01.M01 — Private local intents

**Status:** SPECIFIED (Stage 3). **Scope:** FUTURE — deferral: Experimental headless foundation. Runtime remains off until UI, authenticated adapter, session wiring and native/mobile acceptance are qualified.. **Parent:** [F19.S01](../SPEC.md). **Process IDs:** PS-149-01…PS-149-10. **Code:** `packages/blindmatch/src/intents/local`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Owner-private local intent lifecycle, encrypted-vault composition and erasure without identifying deletion history.

## Responsibilities

- Own the current private intent and its local lifecycle.
- Validate owner, revision, expiry, bounds and inactive recovery.

## Not responsible for

- No remote computation, external disclosure, public publication, account-wide erasure or payment execution.

## User stories

- As an owner I keep my preferences local until an explicit action.
- As an owner I can stop matching and erase private intents without deletion history.

## Edge cases

- A foreign principal receives no private record.
- Delayed work after lock or erasure cannot return current results.
- Old backups restore private content inactive.
- Malformed or excessive input fails without truncation or fallback.

## UX and accessibility



Headless experimental API; local UI, help and accessibility remain separate activation gates.

## Owned data

- `PrivateIntent` (classrup.blindmatch.private_intent/v1, P3, RET-OWNER-LIVE)

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

F15.S02.M03, CTR-ERR-001, CTR-PRV-001, CTR-IOX-001, CTR-TST-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-149-01 | [Domain schema](domain_schema.md) | 3 |
| PS-149-02 | [Validation rules](validation_rules.md) | 3 |
| PS-149-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-149-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-149-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-149-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-149-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-149-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-149-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-149-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 defines the declared operations or local library interface, constrained by the authority rules in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/blindmatch/src/intents/local/index.ts`.

## Acceptance criteria

- All process requirements have explicit test contracts; executed evidence is separately reported.
- Focused tests and existing regressions pass without weakening assertions or counting unavailable browser execution.
- UI, authenticated discovery composition, mobile acceptance and confidential protocol release remain gated.
