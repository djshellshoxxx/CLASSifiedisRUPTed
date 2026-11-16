# F11.S01.M01 — Portable record packaging

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F11.S01](../SPEC.md). **Process IDs:** PS-083-01…PS-083-10. **Code:** `packages/federation/src/protocol/portable`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Library that maps locally owned P0 records (listings, public profiles, service offerings) to unsigned federation envelope drafts and maps verified inbound envelope payloads back to read-only mirror views. Each record type has a field allowlist; anything not on the allowlist, anything above class P0 and any location finer than L2 (geohash 5) is stripped or the export is refused. Signing is done by F11.S01.M03 and storage by F11.S01.M02. It runs in the user's browser vault (ADR-0016) where the principal drafts statements locally, and in relays for validating inbound public projections. It also holds the registry that says which signer role each statement type requires, which vaults use to accept or quarantine statements.

## Responsibilities

- Define versioned field allowlists for classrup.bazaar.listing/v1, classrup.identity.profile/v1 and classrup.services.offering/v1 payloads.
- Build an unsigned envelope draft (v, type, author, createdAt, seq, prev, payload, ext) from a local record plus the author head supplied by the caller.
- Reject export of records whose owner has not enabled federation for that record (opt-in flag from F01.S01.M03 or profile setting) and of any field classified above P0.
- Maintain the statement-type registry mapping each envelope type to the signer role it requires (for example listing author for classrup.bazaar.listing/v1 and listing acceptance statements, proposal participant for consent statements) and expose roleFor(type, context).
- Validate inbound payloads against the same allowlist and map them to a mirror view that the UI marks as remote and read-only.

## Not responsible for

- Signing and verification (F11.S01.M03 mod_signatures).
- Persisting, deduplicating or ordering envelopes (F11.S01.M02 mod_records, F11.S02.M02 mod_dedup).
- Choosing which peers receive a record (F11.S02.M01 mod_delivery and F11.S03.M01 mod_trust).
- Future: ActivityPub Note/Offer and AT Protocol lexicon mappings (documented in F11.S03.M03, not implemented).
- Future: federating reviews, offers, proposals or any P1-P4 data; excluded permanently from MVP by CTR-FED-001 FED-1.

## User stories

- As a seller, I can opt one listing in to federation and see exactly which fields will be shared before confirming.
- As a service provider, I can federate my public offering with a coarse region only, never my address.
- As a remote reader, I see a mirrored listing labelled with its origin relay and a notice that it cannot be edited here.

## Edge cases

- Listing contains a photo with GPS EXIF still present; export is refused with FEDERATION_EXPORT_FORBIDDEN_FIELD and nothing is drafted.
- Listing location is stored at geohash 7; the draft carries only the first 5 characters and records locationLevel L2.
- Inbound payload carries an extra field "homeAddress"; the whole payload is rejected rather than silently trimmed.
- Seller revokes opt-in after drafting but before signing; the draft builder refuses with FEDERATION_NOT_OPTED_IN.
- Payload exceeds 65536 bytes after serialization; rejected with PAYLOAD_TOO_LARGE.
- Record type version unknown (classrup.bazaar.listing/v2); rejected with UNSUPPORTED_SCHEMA_VERSION.

## UX and accessibility



Headless library. The consent preview screen that shows the allowlisted fields is owned by F10.S01.M01 and F01.S01.M03 and calls previewDraft(record) from this module.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

F10.S02.M02, CTR-FED-001, CTR-PRV-001, CTR-ERR-001, CTR-SCH-001, CTR-TST-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-083-01 | [Domain schema](domain_schema.md) | 4 |
| PS-083-02 | [Validation rules](validation_rules.md) | 3 |
| PS-083-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-083-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-083-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-083-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-083-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-083-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-083-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-083-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/federation/src/protocol/portable/index.ts`.

## Acceptance criteria

- All tests T01–T15 pass in CI.
- No P1-P4 field, exact coordinate or home address appears in any draft (privacy suite on fixtures).
- A record whose owner has not opted in can never produce a draft.
