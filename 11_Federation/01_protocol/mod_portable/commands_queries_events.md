# PS-083-04 — Commands, queries and events: Portable record packaging

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M01 Portable record packaging](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/portable` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-083-04.R01** The module exposes TypeScript functions only and no network commands or queries.
- **PS-083-04.R02** Functions return Result<T, AppError> and never include rejected field values in error params.
- **PS-083-04.R03** The module emits no events; draft building is a local pure step.
- **PS-083-04.R04** F11's own statement types and their signer roles are listed in the registry table of the domain schema (N2); other modules contribute entries for their own types, and every entry has an audience, signer role, role resolution, payload schema and maximum age.
- **PS-083-04.R05** The compiled registry is exported as machine-readable data (statement-registry.json) with one row per type {type, owner, audience, signerRole, roleResolution, payloadSchema, subjectKey?, version?, commitment?, maxAge, acknowledger, privacyClass, aliasOf?}, from which F17.S01.M03 generates one contract row per entry plus a wrong-role negative case.
- **PS-083-04.R06** roleFor(type, context) implements the F16.S01.M01 RoleResolverPort and is bound by the vault composition root; this module never calls authorizeStatement and stores no decision.

## Specification

### Commands

_None._

### Queries

_None._

### Events produced

_None._

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| FEDERATION_NOT_OPTED_IN | 403 | no | the owner has not enabled federation for this public record |
| FEDERATION_EXPORT_FORBIDDEN_FIELD | 422 | no | the record contains a field or precision that must not be exported |
| FEDERATION_PAYLOAD_INVALID | 422 | no | inbound payload has unknown members, wrong types, a location finer than L2 or coordinates, or exceeds string limits |
| FEDERATION_SIGNER_ROLE_INVALID | 422 | no | the type is unregistered or the signer key does not hold the role the type requires; the statement is quarantined |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** API: buildDraft(record, now) -> UnsignedDraft (no seq or prev; F11.S01.M02 allocates them; createdAt and every declared payload timestamp floored with F10.S02.M03 publicTime); previewDraft(record) -> {fields[], excluded[]}; toMirrorView(verifiedEnvelope) -> MirrorView {type, cid, author, recordKey, version?, remote: true, readOnly: true, fields} where fields are the allowlisted payload members (for classrup.bazaar.listing/v1 including listingRevision, expiresAt, inStock, variants, acceptedCurrencies, mailboxHints and giveaway closesAt); allowlistFor(type) -> string[]; validateInbound(envelope) -> Result<void> (V06, V07, V09, V11); entryFor(type) (alias registryEntry) -> {type, owner, audience, signerRole, roleResolution, payloadSchema, subjectKey?, version?, commitment?, maxAge, acknowledger, privacyClass, aliasOf?} or none; exportRegistry() -> rows of entryFor for every registered type (statement-registry.json); roleFor(type, context) -> RoleRule, the F16.S01.M01 RoleResolverPort implementation with resolvers {portableDoc, pinnedRelayKey, relayKeyHistory, subscriptions, delegations, operatorKeys} bound at composition (delegations.listed(publisherId, key) -> {role, firstListedReceiptAt, anchoredAt, listVersion} or none, registered by F18.S02.M01; operatorKeys.of(relayId) -> did:key[] or none, registered by F15.S04.M03), used by F16.S01.M01 authorizeStatement for F11.S01.M02 V14 and V15; subjectKeyOf(type, payload) -> string or none; conflictsWith(a, b) -> boolean (commitment predicate); maxAgeOf(type) -> ms or none. StatementPublisherPort { publish({type, audience, payload, recipients[{did, mailboxId}]}) -> {cid, seq, chainKey}; issueTombstone({targetCid?, targetRecordKey?, reason}) -> {tombstoneCid} } is implemented by F11.S01.M02. Participant-audience statements are encrypted by their source modules and only shape-checked, never mapped, here.

### Example

```
buildDraft({ type: "classrup.bazaar.listing/v1", listingId: "0192f3a4-...", title: "Road bike", geohash: "u33dbcx", publishedAt: "2026-11-04T10:37:21.410Z", federate: true }, now = 2026-11-04T10:37:22Z)
-> { v: 1, type: "classrup.bazaar.listing/v1", author: "did:key:z6MkRoot...", createdAt: "2026-11-04T10:00:00.000Z", payload: { listingId: "0192f3a4-...", title: "Road bike", regionCell: "u33db", listingRevision: 3, publishedAt: "2026-11-04T10:00:00.000Z" }, ext: { stream: "pub", audience: "public" } }
entryFor("classrup.bazaar.offer_decision/v1") -> { owner: "F01.S04.M01", audience: "participants", signerRole: "listing author", roleResolution: "principal", acknowledger: "counterparty", privacyClass: "P2", maxAge: null }
roleFor("classrup.federation.peer_accept/v1", { author: "did:key:z6MkUserDevice..." }, resolvers) -> { ok: false, code: "FEDERATION_SIGNER_ROLE_INVALID" }  // user key cannot hold a relay role
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-083-09.T07 | contract | PS-083-03.R01, PS-083-03.R02, PS-083-04.R01, PS-083-04.R02 | exercise each exported function | signatures and Result shapes match the schema registry; error params contain no values; toMirrorView refuses envelopes that F11.S01.M02 has not stored |
| TEST-PS-083-09.T08 | unit | PS-083-03.R03, PS-083-04.R03, PS-083-05.R01 | inspect module for event emission, stored lifecycle state and authorization calls | none present |
| TEST-PS-083-09.T16 | unit | PS-083-01.R04, PS-083-04.R04 | roleFor for every registry row (three portable types and every F11 type) with the correct signer and with a wrong signer of the same key class | correct signer resolves its role; wrong signer yields a rule that makes F11.S01.M02 quarantine; every row has audience, role, resolution, schema and maxAge |
| TEST-PS-083-09.T24 | unit | PS-083-01.R09, PS-083-04.R05 | entryFor and exportRegistry over every F11 and contributed row | every row has owner, audience, signerRole, roleResolution, payloadSchema, maxAge, acknowledger and privacyClass; participants rows give counterparty and P2, relay-audience rows destination_relay and P1, public rows none and P0 unless the row overrides; aliases carry aliasOf; the export validates against its JSON schema |
| TEST-PS-083-09.T25 | contract | PS-083-01.R10, PS-083-04.R06 | F16.S01.M01 authorizeStatement stub with RoleResolverPort bound to roleFor at composition; module import scan | authorizeStatement receives the role only from roleFor; this module never calls authorizeStatement and F16.S01.M01 has no import of it |
| TEST-PS-083-09.T28 | unit | PS-083-01.R04, PS-083-01.R05, PS-083-04.R04 | roleFor for contributed rows: offer_decision by the buyer, bid_receipt by a relay key not named in the terms, tenant_config by a key outside the relay key history, an advisory by an unsubscribed publisher, negotiation_accept/v1 by the consenting party, reservation with holder cycle by an owner who is not a giver in the head revision | each wrong signer yields a quarantining rule, the correct signer resolves, the alias resolves through the consent entry |
| TEST-PS-083-09.T29 | unit | PS-083-01.R12, PS-083-01.R04, PS-083-02.R03, PS-083-04.R04 | roleFor for F18 rows with delegations and operatorKeys resolver stubs: policy_decision by a decider first listed 15 d and 10 d before the proposal receipt, by the publisher's own key, and with no delegations resolver registered; policy_cosign by a listed cosigner and by an unlisted key; transparency_report by a second operator key, by the embedded draft's compiler and by a key outside operatorKeys; rule_pack by its publisher | the 15 d decider, the listed cosigner, the second operator and the publisher resolve; every other case yields a rule that makes the receiving path quarantine with FEDERATION_SIGNER_ROLE_INVALID |
| TEST-PS-083-09.T30 | unit | PS-083-01.R11, PS-083-01.R09, PS-083-04.R05 | entryFor and exportRegistry for policy_comment/v1, transparency_counts/v1, transparency_draft/v1, transparency_report/v1, policy_cosign/v1 and the publisher-signed F18 types | community row gives acknowledger destination_relay, P1 and maxAge 45 d; transparency_counts acknowledger none, P2, 30 d; transparency_draft counterparty, P2, 30 d; transparency_report none, P0, maxAge none; policy_cosign 60 d; publisher rows P0 and maxAge none; every F18 row is in the export |

## Dependencies

Module depends on: F06.S02.M01, F10.S02.M02, F10.S02.M03, F16.S01.M01, CTR-FED-001, CTR-PRV-001, CTR-ERR-001, CTR-SCH-001, CTR-TST-001, CTR-ID-001. Predecessor: [domain_schema.md](domain_schema.md).
