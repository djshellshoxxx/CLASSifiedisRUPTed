# PS-083-09 — Contract and acceptance tests: Portable record packaging

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M01 Portable record packaging](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/portable` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-083-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-083-09.R02** A privacy test suite enumerates every field of every source record type and proves non-allowlisted fields never appear in a draft.
- **PS-083-09.R03** Round-trip tests prove that a draft payload maps back to an equal mirror view.

## Specification

See the module test table below (all processes).

**Fixtures:** Listing, profile and offering fixtures with P0..P3 fields populated including a home address, exact lat/lon, geohash 7 and a GPS-tagged image; a pinned relay key R and a user principal U with device key D in a portable-document stub; shared golden envelopes from F11.S01.M03; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-083-09.T01 | unit | PS-083-01.R01, PS-083-01.R02, PS-083-02.R01, PS-083-09.R02 | build drafts for the three record types | payload members equal the allowlist subset; classification annotations present; drafts carry no seq or prev |
| TEST-PS-083-09.T02 | property | PS-083-01.R03, PS-083-02.R01, PS-083-07.R01 | random records with random extra fields and outbound geohash lengths 1-12 | no draft contains a non-allowlisted member; geohash length ≤ 5 and equal to the prefix of the source cell (snapped); assertPublicCell called once per draft |
| TEST-PS-083-09.T03 | unit | PS-083-02.R04, PS-083-07.R02 | outbound record with geohash 7 only; with exact lat/lon; with homeAddress and email | geohash 7 is snapped to its 5-character L2 cell with level L2 (export succeeds); lat/lon, homeAddress and email each refuse the export with FEDERATION_EXPORT_FORBIDDEN_FIELD |
| TEST-PS-083-09.T04 | unit | PS-083-02.R03, PS-083-02.R01 | record with opt-in false | FEDERATION_NOT_OPTED_IN; error params contain no field values |
| TEST-PS-083-09.T05 | unit | PS-083-02.R02, PS-083-02.R03 | inbound payload with extra member, 65537 bytes, unknown type version listing/v2 | FEDERATION_PAYLOAD_INVALID, PAYLOAD_TOO_LARGE (and not PAYLOAD_INVALID), UNSUPPORTED_SCHEMA_VERSION |
| TEST-PS-083-09.T06 | unit | PS-083-01.R02, PS-083-02.R01 | image referenced with GPS tag present | FEDERATION_EXPORT_FORBIDDEN_FIELD |
| TEST-PS-083-09.T07 | contract | PS-083-03.R01, PS-083-03.R02, PS-083-04.R01, PS-083-04.R02 | exercise each exported function | signatures and Result shapes match the schema registry; error params contain no values; toMirrorView refuses envelopes that F11.S01.M02 has not stored |
| TEST-PS-083-09.T08 | unit | PS-083-03.R03, PS-083-04.R03, PS-083-05.R01 | inspect module for event emission, stored lifecycle state and authorization calls | none present |
| TEST-PS-083-09.T09 | integration | PS-083-03.R02, PS-083-05.R03, PS-083-09.R03 | draft then F11.S01.M02 publish then receive in a second vault then toMirrorView | mirror view equals source P0 fields, labelled remote, readable anonymously, no private fields |
| TEST-PS-083-09.T10 | unit | PS-083-06.R01, PS-083-06.R02, PS-083-06.R03 | identical inputs twice; failing draft; two concurrent publishes of drafts from one device | identical drafts; failure leaves no state; F11.S01.M02 assigns seq n+1 and n+2 and no caller-supplied seq exists in the API |
| TEST-PS-083-09.T11 | a11y | PS-083-07.R03 | open consent preview with screen reader and keyboard only | every field and the linkability notice are announced, controls ≥ 44 px |
| TEST-PS-083-09.T12 | abuse | PS-083-02.R02, PS-083-07.R03 | inbound payload with script tag and long link text | stored as plain text and rendered escaped |
| TEST-PS-083-09.T13 | load | PS-083-08.R02, PS-083-08.R01 | 10 000 draft builds of 4 KiB records | p95 ≤ 1 ms, counters exported |
| TEST-PS-083-09.T14 | unit | PS-083-08.R03, PS-083-09.R01 | coverage and traceability tools run | allowlist and registry report produced; every PS-083 requirement maps to a passing test |
| TEST-PS-083-09.T16 | unit | PS-083-01.R04, PS-083-04.R04 | roleFor for every registry row (three portable types and every F11 type) with the correct signer and with a wrong signer of the same key class | correct signer resolves its role; wrong signer yields a rule that makes F11.S01.M02 quarantine; every row has audience, role, resolution, schema and maxAge |
| TEST-PS-083-09.T15 | unit | PS-083-10.R01, PS-083-10.R02, PS-083-10.R03 | upgrade allowlist v1 to v1 plus optional field; read older drafts; downgrade | older mirror views still validate; rollback keeps v1 behavior and rejects newer members |
| TEST-PS-083-09.T17 | integration | PS-083-05.R02 | opt-in revoked between buildDraft and F11.S01.M02 publish; opt-in revoked after publish while deliveries are prepared | first refused with FEDERATION_NOT_OPTED_IN and nothing signed; second cancels the prepared deliveries and queues a tombstone for delivered copies |
| TEST-PS-083-09.T18 | unit | PS-083-07.R02, PS-083-09.R02 | release privacy suite over every source record type with P1-P4 fields, home address and contact details | none appears in any draft |
| TEST-PS-083-09.T19 | unit | PS-083-01.R05, PS-083-01.R06 | listing signed by pinned relay key R as author; peer_accept signed by user device key D; type classrup.federation.unknown/v1 | each quarantined with FEDERATION_SIGNER_ROLE_INVALID; V01 runs and fails independently of V08 |
| TEST-PS-083-09.T20 | property | PS-083-02.R02, PS-083-02.R04 | inbound payloads with geohash lengths 6-12 and with latitude or longitude members | every one rejected with FEDERATION_PAYLOAD_INVALID; assertPublicCell invoked on the inbound path |
| TEST-PS-083-09.T21 | contract | PS-083-01.R07 | producer stubs (listing publication, profile, offering, peer, blocklist, migration) call StatementPublisherPort.publish and issueTombstone | every call reaches the F11.S01.M02 implementation, which allocates seq; no producer signs through another path |
| TEST-PS-083-09.T22 | unit | PS-083-01.R06, PS-083-02.R03 | tombstone, ack, peer_offer and move payloads, and a participants ciphertext payload of 12288 and 12289 bytes | per-type schemas checked; portable allowlist (V08) and opt-in (V02) never applied to them; 12289 bytes rejected with FEDERATION_PAYLOAD_INVALID |
| TEST-PS-083-09.T23 | unit | PS-083-01.R08, PS-083-02.R05 | listing published at 10:47:12.345 with expiresAt 2026-12-04T10:47:12.345Z; busy block 10:20-11:40; two listing revisions inside one hour; a draft with an undeclared fine timestamp member | createdAt and publishedAt 10:00:00.000Z, expiresAt 2026-12-04T10:00:00.000Z; busy block 10:00-12:00; assertCoarseTime passes; revisions ordered by listingRevision and seq; the undeclared member refused with FEDERATION_EXPORT_FORBIDDEN_FIELD |
| TEST-PS-083-09.T24 | unit | PS-083-01.R09, PS-083-04.R05 | entryFor and exportRegistry over every F11 and contributed row | every row has owner, audience, signerRole, roleResolution, payloadSchema, maxAge, acknowledger and privacyClass; participants rows give counterparty and P2, relay-audience rows destination_relay and P1, public rows none and P0 unless the row overrides; aliases carry aliasOf; the export validates against its JSON schema |
| TEST-PS-083-09.T25 | contract | PS-083-01.R10, PS-083-04.R06 | F16.S01.M01 authorizeStatement stub with RoleResolverPort bound to roleFor at composition; module import scan | authorizeStatement receives the role only from roleFor; this module never calls authorizeStatement and F16.S01.M01 has no import of it |
| TEST-PS-083-09.T26 | unit | PS-083-01.R02, PS-083-02.R01 | build drafts for a listing with every kind subset and variants, a service offering with credential evidence, a rental offering and a busy-blocks summary | payload keys equal the closed key sets of the note; offering keeps providerTimeZone, seq, prev and publishedAt and drops evidenceAttachmentId; maxBudget only when budgetVisible; busy blocks carry intervals and unit counts only |
| TEST-PS-083-09.T27 | unit | PS-083-03.R01, PS-083-05.R03 | toMirrorView of a verified listing (sell with variants, and giveaway) and of a rental offering | mirror exposes author, recordKey, version, listingRevision, expiresAt, inStock, variants, acceptedCurrencies, mailboxHints and giveaway closesAt, labelled remote and read-only; no member outside the allowlist |
| TEST-PS-083-09.T28 | unit | PS-083-01.R04, PS-083-01.R05, PS-083-04.R04 | roleFor for contributed rows: offer_decision by the buyer, bid_receipt by a relay key not named in the terms, tenant_config by a key outside the relay key history, an advisory by an unsubscribed publisher, negotiation_accept/v1 by the consenting party, reservation with holder cycle by an owner who is not a giver in the head revision | each wrong signer yields a quarantining rule, the correct signer resolves, the alias resolves through the consent entry |
| TEST-PS-083-09.T29 | unit | PS-083-01.R12, PS-083-01.R04, PS-083-02.R03, PS-083-04.R04 | roleFor for F18 rows with delegations and operatorKeys resolver stubs: policy_decision by a decider first listed 15 d and 10 d before the proposal receipt, by the publisher's own key, and with no delegations resolver registered; policy_cosign by a listed cosigner and by an unlisted key; transparency_report by a second operator key, by the embedded draft's compiler and by a key outside operatorKeys; rule_pack by its publisher | the 15 d decider, the listed cosigner, the second operator and the publisher resolve; every other case yields a rule that makes the receiving path quarantine with FEDERATION_SIGNER_ROLE_INVALID |
| TEST-PS-083-09.T30 | unit | PS-083-01.R11, PS-083-01.R09, PS-083-04.R05 | entryFor and exportRegistry for policy_comment/v1, transparency_counts/v1, transparency_draft/v1, transparency_report/v1, policy_cosign/v1 and the publisher-signed F18 types | community row gives acknowledger destination_relay, P1 and maxAge 45 d; transparency_counts acknowledger none, P2, 30 d; transparency_draft counterparty, P2, 30 d; transparency_report none, P0, maxAge none; policy_cosign 60 d; publisher rows P0 and maxAge none; every F18 row is in the export |

## Acceptance criteria

- All tests T01–T30 pass in CI, including the signer-role tests T16, T19, T28 and T29.
- No P1-P4 field, exact coordinate or home address appears in any draft, and no inbound cell finer than L2 is accepted (privacy suite on fixtures).
- A public record whose owner has not opted in can never produce a signed statement.

## Dependencies

Module depends on: F06.S02.M01, F10.S02.M02, F10.S02.M03, F16.S01.M01, CTR-FED-001, CTR-PRV-001, CTR-ERR-001, CTR-SCH-001, CTR-TST-001, CTR-ID-001. Predecessor: [domain_schema.md](domain_schema.md).
