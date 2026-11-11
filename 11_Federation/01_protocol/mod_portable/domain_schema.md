# PS-083-01 — Domain schema: Portable record packaging

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M01 Portable record packaging](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/portable` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-083-01.R01** The module owns no stored entity; it defines allowlist tables, the statement-type registry and draft value types keyed by envelope type string.
- **PS-083-01.R02** Allowed payload fields per type are listed in code and in the schema registry and each is annotated P0 by F10.S02.M02; a field without an annotation is not exportable.
- **PS-083-01.R03** Location is carried only as a geohash string of length ≤ 5 plus locationLevel L1 or L2, never coordinates; finer cells are snapped to their containing L2 cell before the F06.S02.M01 assertPublicCell check.
- **PS-083-01.R04** The statement-type registry is static versioned data that names, for every registered envelope type, the audience, the signer role a receiving vault must verify before acting on the statement, how that role is resolved, the payload schema, the optional subject key and commitment predicate used by F11.S02.M03, and the maximum age used by F11.S01.M02 V08.
- **PS-083-01.R05** Relay roles resolve only through relay keys pinned in F11.S03.M01 and user roles only through the author principal's portable identity document (F07.S02.M01), so a relay key never satisfies a user role and a user key never satisfies a relay role.
- **PS-083-01.R06** Unregistered types, and registered types whose role cannot be resolved, are quarantined by receivers with FEDERATION_SIGNER_ROLE_INVALID; the registry check (V01) is separate from the portable-allowlist check (V08), which applies only to audience public portable types.
- **PS-083-01.R07** The StatementPublisherPort (publish and issueTombstone) is declared here and implemented by F11.S01.M02, so every producer (F01, F03, F07, F11.S03.*) signs through the single F11.S01.M02 path that allocates seq and prev, without a dependency cycle.

## Specification

**Note:** Pure mapping library; allowlists and the registry are static data versioned with the schema registry and nothing is persisted here.
Statement-type registry (F11 types and the three portable types; other modules contribute entries for their own types per N2, compiled into the same registry at build time). Role resolution: "principal" means the envelope author is a principal did:key and ext.signerKey is a device key active in that principal's latest verified portable document (F07.S02.M01 key_status at receiver time); "relay" means the author is a relay did:key pinned in F11.S03.M01 (current key, or previous key inside the 7-day rotation overlap).

| Type | Audience | Signer role (resolution) | Payload schema | Subject key | Class | maxAge |
|---|---|---|---|---|---|---|
| classrup.bazaar.listing/v1 | public | listing author (principal) | listing allowlist | recordKey payload.id | public_projection | 120 d |
| classrup.identity.profile/v1 | public | profile owner, author = payload.did (principal) | profile allowlist | recordKey payload.did | public_projection | 400 d |
| classrup.services.offering/v1 | public | provider (principal) | offering allowlist | recordKey payload.offeringId | public_projection | 400 d |
| classrup.federation.tombstone/v1 | audience of the target | target author: author equals the target record's author principal (principal); binding deletion | {target: cid or recordKey, reason} | target | control | none |
| classrup.federation.relay_removal/v1 | public | hosting relay whose index held the item (relay); advisory only | {target, relayId, reasonCode, statementOfReasons ≤ 2000 chars} | target | advisory | none |
| classrup.federation.ack/v1 | participants | recipient: a principal named in ext.recipients of the acknowledged statement (principal) | {ackedCid, ackedType} | ackedCid | control | 60 d |
| classrup.federation.peer_offer/v1 | relay to relay | proposing relay, self-certifying key confirmed by fingerprint (relay) | {relayId, baseUrl, relayKey, direction, targetRelayId} | none | control | 14 d |
| classrup.federation.peer_accept/v1 | relay to relay | accepting relay: key pinned for the offer target (relay) | {offerCid, relayId, relayKey} | none | control | none |
| classrup.federation.key_rotation/v1 | public | current pinned relay key (old key) (relay) | {relayId, newKey, effectiveAt} | none | control | none |
| classrup.federation.relay_identity/v1 | public | the relay key named in the payload (relay, self-certifying) | {relayId, baseUrl, relayKey, hostingPolicy} | none | control | 30 d |
| classrup.federation.blocklist/v1 | public | any publisher, advisory, never applied without review (principal or relay) | {title, entries ≤ 10000} | none | advisory | 180 d |
| classrup.federation.move/v1 | public | account move: device key of the subject (principal); relay move: pinned relay key (relay) | {subject, kind, fromRelay, toRelay, announcedAt} | move:subject | commitment (identity) | 210 d |
| classrup.federation.move_cancel/v1 | public | device key of the subject; a veto needs a key other than the move signer (principal) | {moveCid, subject} | move:subject | control | 210 d |

Commitment predicates (subject key and conflict test used by F11.S01.M02 and F11.S02.M03; owning modules confirm their entries): classrup.federation.move/v1 conflicts when two verified moves of one subject are open with different toRelay; classrup.comms.consent/v1 (F08.S02.M02) conflicts when one signer signs the same subjectType, subjectRef and statementKey over different subjectRevisionHash values, which covers two acceptances of one offer and two consents on one proposal; classrup.bazaar.reservation/v1 (F01.S03.M01) conflicts when one signer reserves overlapping items of the same listing to different holders with overlapping unexpired windows; classrup.commerce.deal/v1 (F09.S01.M01) conflicts when one signer signs two different obligation digests for one dealId. Registered ext members: stream, signerKey, audience, recipients [{did, mailboxId}], supersedes.


## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-083-09.T01 | unit | PS-083-01.R01, PS-083-01.R02, PS-083-02.R01, PS-083-09.R02 | build drafts for the three record types | payload members equal the allowlist subset; classification annotations present; drafts carry no seq or prev |
| TEST-PS-083-09.T02 | property | PS-083-01.R03, PS-083-02.R01, PS-083-07.R01 | random records with random extra fields and outbound geohash lengths 1-12 | no draft contains a non-allowlisted member; geohash length ≤ 5 and equal to the prefix of the source cell (snapped); assertPublicCell called once per draft |
| TEST-PS-083-09.T06 | unit | PS-083-01.R02, PS-083-02.R01 | image referenced with GPS tag present | FEDERATION_EXPORT_FORBIDDEN_FIELD |
| TEST-PS-083-09.T16 | unit | PS-083-01.R04, PS-083-04.R04 | roleFor for every registry row (three portable types and every F11 type) with the correct signer and with a wrong signer of the same key class | correct signer resolves its role; wrong signer yields a rule that makes F11.S01.M02 quarantine; every row has audience, role, resolution, schema and maxAge |
| TEST-PS-083-09.T19 | unit | PS-083-01.R05, PS-083-01.R06 | listing signed by pinned relay key R as author; peer_accept signed by user device key D; type classrup.federation.unknown/v1 | each quarantined with FEDERATION_SIGNER_ROLE_INVALID; V01 runs and fails independently of V08 |
| TEST-PS-083-09.T21 | contract | PS-083-01.R07 | producer stubs (listing publication, profile, offering, peer, blocklist, migration) call StatementPublisherPort.publish and issueTombstone | every call reaches the F11.S01.M02 implementation, which allocates seq; no producer signs through another path |
| TEST-PS-083-09.T22 | unit | PS-083-01.R06, PS-083-02.R03 | tombstone, ack, peer_offer and move payloads, and a participants ciphertext payload of 12288 and 12289 bytes | per-type schemas checked; portable allowlist (V08) and opt-in (V02) never applied to them; 12289 bytes rejected with FEDERATION_PAYLOAD_INVALID |

## Dependencies

Module depends on: F06.S02.M01, F10.S02.M02, CTR-FED-001, CTR-PRV-001, CTR-ERR-001, CTR-SCH-001, CTR-TST-001, CTR-ID-001. Predecessor: [module SPEC](SPEC.md).
