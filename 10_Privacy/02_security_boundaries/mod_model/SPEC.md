# F10.S02.M02 — Data classification model

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F10.S02](../SPEC.md). **Process IDs:** PS-081-01…PS-081-10. **Code:** `packages/privacy/src/security_boundaries/model`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The shared vocabulary and enforcement helpers for data classification: privacy classes P0 to P4, location levels L0 to L4, field-level classification annotations on schemas, and redaction helpers that every sink uses (logs, events, federation envelopes, notifications, relay projections, exports). Unannotated fields are treated as P3 private and fail CI, so new data is protected by default. The library is pure and runs in the browser vault and on relays; it never reads files, network or clocks.

## Responsibilities

- Define the types PrivacyClass (P0 to P4) and LocationLevel (L0 to L4) with total ordering and helper functions maxClass, canFlow(class, sink) and capLocation(level, sink).
- Provide the classification annotation format for module schemas (per-field class, location level where relevant, and redaction strategy) and read it from the schema registry.
- Provide redaction helpers redactForLog, redactForEvent, redactForFederation, redactForNotification, redactForProjection and redactForExport that take a record, its schema and the sink and return a safe copy or a refusal.
- Enforce the sink matrix of CTR-PRV-001 including location capped at L2 in any public, search or federated payload and the rule that P3 and P4 never reach logs or federation.
- Provide a CI lint that fails when a schema field has no classification, an event payload is classified below its most sensitive field, or a public projection includes a P1 or higher field.

## Not responsible for

- Deciding which fields a module defines or how they are stored (owning modules).
- Consent decisions (F10.S01.M01) and retention (F10.S01.M02).
- Image and header metadata stripping (F10.S02.M03) and encryption of P2 envelopes (CTR-FED-001 transport).
- Future: automatic data-flow tracing across modules at build time and differential-privacy aggregates.

## User stories

- As a developer, I annotate a new field once and every log, event, export and federation path handles it correctly.
- As a reviewer, CI tells me exactly which field is unclassified or flows to a sink it must not.
- As a user, I can trust that my exact address and keys never appear in logs, events, public listings or federation.

## Edge cases

- A schema adds a field without annotation; the lint fails the build and at runtime the field is treated as P3 and redacted from every non-owner sink.
- An event payload mixes a P0 listing ID with a P3 address field; the event class becomes P3 and publishing it to a federation sink is refused.
- A location with L4 precision is passed to a public projection; it is snapped to the L2 geohash cell or refused when no cell can be derived.
- A free-text field contains an email address; the redaction helper for logs replaces it with a typed token such as [email] before output, but the class of the field stays that of its annotation.
- Nested objects and arrays carry different classes per element; redaction applies per path and unknown paths default to P3.
- A sink asks for P1 data of a record the viewer does not own; the helper returns the record minus P1 fields, not an error, unless the sink is declared strict.

## UX and accessibility



Headless library with no screens. UI badges that show a data class (for example Private, Shared with participants, Public) use helper labelKey(class) which returns i18n keys privacy.class.p0 to privacy.class.p4.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

CTR-PRV-001, CTR-EVT-001, CTR-FED-001, CTR-ERR-001, CTR-IOX-001, CTR-OBS-001, CTR-TST-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-081-01 | [Domain schema](domain_schema.md) | 3 |
| PS-081-02 | [Validation rules](validation_rules.md) | 3 |
| PS-081-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-081-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-081-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-081-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-081-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-081-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-081-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-081-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/privacy/src/security_boundaries/model/index.ts`.

## Acceptance criteria

- Every schema field in the repository has a classification and CI reports 0 unclassified fields.
- The full class by sink matrix test passes and matches CTR-PRV-001.
- No public, search, federation or notification payload in tests contains a location finer than L2 or any P3 or P4 field.
