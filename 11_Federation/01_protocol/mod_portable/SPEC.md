# F11.S01.M01 — Portable record packaging

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F11.S01](../SPEC.md). **Process IDs:** PS-083-01…PS-083-10. **Code:** `packages/federation/src/protocol/portable`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Library that maps locally owned P0 records (listings, public profiles, service offerings, rental offerings and rental busy blocks) to unsigned federation envelope drafts and maps verified inbound envelope payloads back to read-only mirror views. Every timestamp of a public draft, including the envelope createdAt, is floored to the UTC hour with F10.S02.M03 publicTime, and readers order records by version member or per-chain seq, never by time. Each portable record type has a field allowlist; anything not on the allowlist and anything above class P0 is refused, and location is snapped to its L2 cell (geohash 5) and checked with F06.S02.M01 assertPublicCell on the way out and on the way in. Signing, seq allocation and storage are done by F11.S01.M02 through the StatementPublisherPort declared here. It runs in the user's browser vault (ADR-0016) and in relays for validating inbound public projections. It also holds the statement-type registry (N2): for every envelope type the audience, the signer role a receiver must verify, how that role is resolved (user roles only through the author's portable identity document, relay roles only through pinned or self-certifying relay keys), the payload schema, the optional subject key and commitment predicate, the maximum age, the acknowledger and the privacy class. Its roleFor is the implementation of the F16.S01.M01 RoleResolverPort that the vault composition root injects into authorizeStatement.

## Responsibilities

- Define versioned field allowlists for classrup.bazaar.listing/v1, classrup.identity.profile/v1, classrup.services.offering/v1, classrup.rentals.offering/v1 and classrup.rentals.busy_blocks/v1 payloads, taking each closed key set from the record's owning module (F01.S01.M03, F07.S02.M01, F03.S01.M01, F05.S01.M01).
- Build an unsigned envelope draft (v, type, author, createdAt, payload, ext) from a local record, with every payload timestamp and the envelope createdAt floored to the UTC hour by F10.S02.M03 publicTime; seq and prev are allocated by F11.S01.M02 publish in the transaction that stores the signed envelope.
- Reject export of portable public records whose owner has not enabled federation for that record (opt-in flag from F01.S01.M03 or profile setting) and of any field classified above P0; participant statements need no federation opt-in.
- Maintain the statement-type registry mapping each envelope type to {audience, signerRole, roleResolution, payloadSchema, subjectKey?, version?, commitment?, maxAge, acknowledger, privacyClass}, expose entryFor(type), roleFor(type, context) (the F16.S01.M01 RoleResolverPort implementation), subjectKeyOf(type, payload) and maxAgeOf(type), and export the compiled registry as machine-readable data.
- Validate inbound payloads against the same allowlist and location rules and map them to a mirror view that the UI marks as remote and read-only and that exposes every allowlisted member readers need (for listings the author, listingRevision, expiresAt, inStock, variants, acceptedCurrencies, mailboxHints and the giveaway closesAt).
- Own the payload, opt-in and signer-role error codes (FEDERATION_PAYLOAD_INVALID, FEDERATION_NOT_OPTED_IN, FEDERATION_EXPORT_FORBIDDEN_FIELD, FEDERATION_SIGNER_ROLE_INVALID) referenced by other F11 modules through depends_on (N1).

## Not responsible for

- Signing and verification (F11.S01.M03 mod_signatures).
- Persisting, deduplicating or ordering envelopes and allocating seq and prev (F11.S01.M02 mod_records, F11.S02.M02 mod_dedup).
- Choosing which peers receive a record (F11.S02.M01 mod_delivery and F11.S03.M01 mod_trust).
- Geohash encoding and the L2 cell check itself (F06.S02.M01 assertPublicCell).
- Resolving keys: user roles are resolved by an injected portable-document resolver (F07.S02.M01) and relay roles by injected relay-key resolvers (pinned keys in F11.S03.M01, relay key history of F15.S02.M01), all bound at composition so this library has no dependency cycle.
- Deciding whether an incoming statement is acted on (F16.S01.M01 authorizeStatement, called by F11.S01.M02); this module only supplies roleFor through the RoleResolverPort bound at vault composition.
- Future: ActivityPub Note/Offer and AT Protocol lexicon mappings (documented in F11.S03.M03, not implemented).
- Future: federating reviews, offers, proposals or any P1-P4 data relay to relay; participant statements travel only as sealed mailbox envelopes and are never mapped here.

## User stories

- As a seller, I can opt one listing in to federation and see exactly which fields will be shared before confirming.
- As a service provider, I can federate my public offering with a coarse region only, never my address.
- As a remote reader, I see a mirrored listing labelled with the relay it came from and a notice that it cannot be edited here.
- As a vault, I can tell for any received statement type which role must have signed it and whether that role is a user role or a relay role, and I quarantine anything I cannot resolve.
- As a test generator (F17.S01.M03), I can read the compiled registry as data and produce one contract row and one wrong-role negative case per statement type.

## Edge cases

- Listing contains a photo with GPS EXIF still present; export is refused with FEDERATION_EXPORT_FORBIDDEN_FIELD and nothing is drafted.
- Listing location is stored at geohash 7; the draft carries the containing L2 cell (the first 5 characters), records locationLevel L2 and passes assertPublicCell; a record that carries latitude and longitude members is refused with FEDERATION_EXPORT_FORBIDDEN_FIELD.
- Inbound payload carries an extra field "homeAddress"; the whole payload is rejected rather than silently trimmed.
- Inbound listing payload carries regionCell "u33dbc" (length 6); rejected with FEDERATION_PAYLOAD_INVALID and never mirrored into a public index.
- Seller revokes opt-in after drafting but before F11.S01.M02 signs; publish refuses with FEDERATION_NOT_OPTED_IN and nothing is signed.
- Payload exceeds 65536 bytes after serialization; rejected with PAYLOAD_TOO_LARGE only.
- Record type version unknown (classrup.bazaar.listing/v2); rejected with UNSUPPORTED_SCHEMA_VERSION.
- A listing statement whose author is a pinned relay key, or a peer_accept signed by a user device key; roleFor finds no matching key class and the receiver quarantines it with FEDERATION_SIGNER_ROLE_INVALID.
- Statement type classrup.federation.unknown/v1 is not registered; receivers quarantine it with FEDERATION_SIGNER_ROLE_INVALID rather than storing it as accepted.
- A listing is published at 10:47:12.345 with expiresAt 2026-12-04T10:47:12.345Z; the draft carries createdAt and publishedAt 10:00:00.000Z and expiresAt 2026-12-04T10:00:00.000Z, and two drafts inside the same hour are ordered by listingRevision and seq only.
- A rental busy block runs 10:20 to 11:40; the busy-blocks draft carries 10:00 to 12:00 (start floored, end raised to the next full hour) so a published busy interval never shrinks.
- A service offering carries a credential with evidenceAttachmentId; the projection omits the member and keeps label, issuer and year, while providerTimeZone, the projection seq, prev and publishedAt are exported.
- A vault receives classrup.bazaar.negotiation_accept/v1; the registry resolves it as an alias of classrup.comms.consent/v1 and verifies it with the consent entry's role, schema and predicate.

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

F06.S02.M01, F10.S02.M02, F10.S02.M03, F16.S01.M01, CTR-FED-001, CTR-PRV-001, CTR-ERR-001, CTR-SCH-001, CTR-TST-001, CTR-ID-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-083-01 | [Domain schema](domain_schema.md) | 10 |
| PS-083-02 | [Validation rules](validation_rules.md) | 5 |
| PS-083-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-083-04 | [Commands, queries and events](commands_queries_events.md) | 6 |
| PS-083-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-083-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-083-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-083-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-083-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-083-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/federation/src/protocol/portable/index.ts`.

## Acceptance criteria

- All tests T01–T28 pass in CI, including the signer-role tests T16, T19 and T28.
- No P1-P4 field, exact coordinate or home address appears in any draft, and no inbound cell finer than L2 is accepted (privacy suite on fixtures).
- A public record whose owner has not opted in can never produce a signed statement.
