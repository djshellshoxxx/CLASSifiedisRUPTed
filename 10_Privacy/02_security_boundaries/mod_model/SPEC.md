# F10.S02.M02 — Data classification model

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F10.S02](../SPEC.md). **Process IDs:** PS-081-01…PS-081-10. **Code:** `packages/privacy/src/security_boundaries/model`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The shared vocabulary and enforcement helpers for data classification: privacy classes P0 to P4, location levels L0 to L4, field-level classification annotations on schemas, an explicit class-by-sink matrix, and redaction helpers that every sink uses (logs, events, federation envelopes, notifications, relay projections, search, end-to-end encrypted participant envelopes and exports). Unannotated or unknown fields are treated as P4, which no sink accepts, and fail CI, so new data is never emitted anywhere before it is classified. Two narrow, declared exceptions exist inside the encrypted participant envelope sink - a single-recipient disclosure annotation (a field that is P3 in the owner vault and P2 to exactly one listed participant, such as the auction host key named in the terms) and the CTR-PRV-001 PRV-9 moderation disclosure of an approved redact/1 copy to one relay moderation key. The library is pure and runs in the browser vault and on relays; it never reads files, network or clocks.

## Responsibilities

- Define the types PrivacyClass (P0 to P4) and LocationLevel (L0 to L4) with total ordering and helper functions maxClass, canFlow(class, sink) and capLocation(level, sink).
- Provide the classification annotation format for module schemas (per-field class, location level where relevant, redaction strategy, and an optional single-recipient disclosure that keeps the field at its own class for every sink but lets exactly one listed participant role receive it as P2 inside an encrypted participant envelope) and read it from the schema registry.
- Provide redaction helpers redactForLog, redactForEvent, redactForFederation, redactForNotification, redactForProjection, redactForSearch, redactForEnvelope and redactForExport that take a record, its schema and the sink context and return a safe copy or a refusal.
- Own and enforce the class-by-sink matrix written in this spec, which refines CTR-PRV-001, including location capped at L2 in any public, search or federated payload, P2 only inside encrypted participant envelopes, and P4 denied to every sink.
- Provide a CI lint that fails when a schema field has no classification, an event payload is classified below its most sensitive field, or a public projection includes a P1 or higher field.
- Enforce the single participant-disclosure exception of CTR-PRV-001 PRV-9 - redactForEnvelope admits a redact/1 copy of a P2 message, offer or cycle proposal for one relay moderation key only when the caller declares a disclosure preview approved to export prepared (F12.S01.M02, F12.S01.M01), and refuses every other P2 envelope to a non-participant.

## Not responsible for

- Deciding which fields a module defines or how they are stored (owning modules).
- Consent decisions (F10.S01.M01) and retention (F10.S01.M02).
- Image and header metadata stripping (F10.S02.M03) and the encryption of participant envelopes itself (CTR-FED-001 transport and the sending module); redactForEnvelope only checks that the caller declares the envelope encrypted to its listed recipients.
- Future: automatic data-flow tracing across modules at build time and differential-privacy aggregates.

## User stories

- As a developer, I annotate a new field once and every log, event, export, envelope and federation path handles it correctly.
- As a reviewer, CI tells me exactly which field is unclassified or flows to a sink it must not.
- As a user, I can trust that my exact address and keys never appear in logs, events, public listings, search or federation.

## Edge cases

- A schema adds a field without annotation; the lint fails the build and at runtime the field is treated as P4 and dropped from every sink, including export and owner views.
- An event payload mixes a P0 listing ID with a P3 address field; the event class becomes P3, which may stay in the vault outbox (EVT-8) but publishing it to a federation sink is refused.
- A location with L4 precision is passed to a public projection; it is snapped to the L2 geohash cell or refused when no cell can be derived; passed to the event sink it is refused (EVT-5).
- A free-text field contains an email address; the redaction helper for logs replaces it with a typed token such as [email] before output, but the class of the field stays that of its annotation.
- Nested objects and arrays carry different classes per element; redaction applies per path and unknown paths default to P4.
- A sink asks for P1 data of a record the viewer does not own; the helper returns the record minus P1 fields, not an error, unless the sink is declared strict.
- A P2 offer is handed to redactForEnvelope without the encrypted flag or with an empty recipient list; it is refused with PRIVACY_SINK_FORBIDDEN.
- A record imported from a newer schema version carries a field the current map does not know; it is held as P4 and never exported, logged or shown until a map classifies it.
- The seller's reservePrice (P3 in the vault, single-recipient disclosure to role auction_host) is passed to redactForEnvelope with two recipients, with recipientRole bidder, or to redactForEvent; all three are refused with PRIVACY_SINK_FORBIDDEN, and only an envelope encrypted to the one host key with recipientRole auction_host carries it.
- A reporter's vault passes a P2 message to redactForEnvelope addressed to a relay moderation key while the disclosure preview is only previewed, or passes the unredacted message; both are refused, and only the redact/1 output with state export_prepared and one relay_moderation recipient passes (PRV-9).

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
| PS-081-01 | [Domain schema](domain_schema.md) | 6 |
| PS-081-02 | [Validation rules](validation_rules.md) | 5 |
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
- The full class by sink matrix test passes and matches the matrix in this spec.
- No public, search, federation or notification payload in tests contains a location finer than L2 or any P3 or P4 field, and no event carries P4 or L4.
