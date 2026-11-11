# PS-056-04 — Commands, queries and events: Profiles

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S02.M02 Profiles](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/profiles/profiles` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-056-04.R01** update, publish, unpublish, block add and block remove are vault commands; publish produces the signed statement classrup.identity.profile/v1 and unpublish produces classrup.federation.tombstone/v1, both signed by a device key active in the owner's document and both signed and stored only through the F11.S01.M01 StatementPublisherPort (publish and issueTombstone, implemented by F11.S01.M02, which allocates seq and prev); receive is the vault intake of someone else's profile statement.
- **PS-056-04.R02** Block commands emit local P3 events that other modules consume to cancel work; block data is never placed in a statement.
- **PS-056-04.R03** Reads of profiles apply the viewer's perspective - strangers see public fields, conversation participants see contacts fields, the owner sees all.
- **PS-056-04.R04** A tombstone withdraws a received profile only when its author equals the profile's DID and its signer key is active in that DID's document; a tombstone signed by an origin relay only removes that relay from the profile's provenance.
- **PS-056-04.R05** Relay hosting actions (moderation.action.applied and moderation.action.reverted) are consumed only by the relay runtime for the relay's own copy and never change vault records.
- **PS-056-04.R06** F08.S01.M01 calls MailboxHintPort.set(relayId, mailboxId, previousMailboxId?) after comms.mailbox.register and comms.mailbox.rotate; the own profile keeps at most 5 mailbox IDs, and when the profile is published a new version with seq plus 1 carrying the new or replacement ID is published to the relays that hold the current version, with federation_publish consent re-checked (N15).

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `identity.profile.update` | identity.profile.write_own | { bio?, avatar?, languages?, visibility?, expectedRevision } | { profileId, revision } | VALIDATION_FAILED, IDENTITY_AVATAR_INVALID, IDENTITY_REGION_INVALID, CONFLICT_REVISION | identity.profile.updated | yes (Idempotency-Key) |
| `identity.profile.publish` | identity.profile.publish_own | { audience: public\|contacts, targetRelays?: array, threadIds?: array, expectedRevision } | { profileId, seq, cid, statement: classrup.identity.profile/v1, syncState: local_committed, skippedRelays: array } | CONFLICT_REVISION, VALIDATION_FAILED, IDENTITY_REGION_INVALID, PRECONDITION_FAILED | identity.profile.updated | yes (Idempotency-Key) |
| `identity.profile.unpublish` | identity.profile.unpublish_own | { targetRelays?: array (default every relay that received it), expectedRevision } | { profileId, revision, tombstone: classrup.federation.tombstone/v1, syncStates: [{ relayId, syncState }] } | CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED | identity.profile.updated | yes (Idempotency-Key) |
| `identity.profile.receive` | identity.profile.receive | { statement: classrup.identity.profile/v1, provenance } | { profileId, seq, status } | IDENTITY_PROFILE_INVALID, VALIDATION_FAILED, RATE_LIMITED | identity.profile.updated | yes (Idempotency-Key) |
| `identity.block.add` | identity.block_entry.write_own | { blockedDid, note? } | { blockId, revision: 1 } | VALIDATION_FAILED, IDENTITY_BLOCK_LIMIT, CONFLICT_STATE | identity.block.added | yes (Idempotency-Key) |
| `identity.block.remove` | identity.block_entry.write_own | { blockId, expectedRevision } | { blockId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | identity.block.removed | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `identity.profile.get` | identity.profile.read_view | { did, viewerContext?: stranger\|contact } | { profile: Profile with fields filtered by visibility, provenance?, blockedByMe: boolean } | NOT_FOUND |
| `identity.block.list` | identity.block_entry.read_own | { cursor?, limit? (1..100) } | { items: BlockEntry[], nextCursor? } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `identity.profile.updated` | P0 | { did, origin: own\|received, seq, changedFields: array (field names only, for example withdrawn or mailboxes) } |
| `identity.block.added` | P3 | { blockId, blockerDid, blockedDid } |
| `identity.block.removed` | P3 | { blockId, blockerDid, blockedDid } |

### Events consumed

| Type | Effect |
|---|---|
| `identity.account.created` | create the default own Profile with the pseudonym, visibility region private, no bio |
| `identity.pseudonym.changed` | refresh displayPseudonym on the own profile and mark it unpublished-changes |
| `discovery.location.updated` | set regionCell to publicCell after F06.S02.M01 assertPublicCell, or clear it at L0, still subject to the region visibility |
| `identity.portable_doc.published` | origin received - re-verify quarantined profile statements of that DID whose signer key was unknown; for each newly revoked key, profiles first seen at or after its clamped revokesEffectiveAt are quarantined and earlier ones stay valid with a revoked-signer marker |
| `moderation.action.applied` | relay runtime only - the relay stops serving its own copy of the targeted profile statement under its hosting policy; vault records are never changed |
| `moderation.action.reverted` | relay runtime only - the relay serves its copy of the profile statement again; vault records are never changed |
| `federation.tombstone.applied` | delete the received profile only when the tombstone author equals Profile.did and its signer key was active in that DID's document; a tombstone signed by an origin relay only drops that relay from provenance and the profile stays |
| `privacy.deletion.completed` | final cleanup only - the DeletionPort steps already sent the own profile tombstone and deleted profiles and blocks |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| IDENTITY_AVATAR_INVALID | 422 | no | avatar is not a 128 by 128 WebP under 24 KiB without metadata |
| IDENTITY_REGION_INVALID | 422 | no | region cell fails assertPublicCell or differs from the public cell of the location settings |
| IDENTITY_BLOCK_LIMIT | 409 | no | 1 000 active blocks already exist |
| IDENTITY_PROFILE_INVALID | 422 | no | received profile signature, signer key status, size or sequence check failed |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statements and signer roles (N2): classrup.identity.profile/v1 - a device key active in the owner's portable document (author the principal did:key, ext.signerKey the device key, CTR-FED-001 FED-7); classrup.federation.tombstone/v1 for unpublish (CTR-FED-001 FED-4 and FED-9, the format owned by F11.S01.M02) - a device key of the profile's DID. Both are signed and stored through the StatementPublisherPort declared in F11.S01.M01 and implemented by F11.S01.M02 (wired at composition, since F11.S01.M02 depends on this module), delivered by the sync outbox, and applied by F11.S01.M02 on relays and in receiving vaults. Port provided to F08.S01.M01: MailboxHintPort.set(relayId, mailboxId, previousMailboxId?). A received statement from a blocked DID is dropped silently - receive returns no error the sender could observe. Ports provided: isBlockedEither(a, b), filterBlocked(dids up to 500), and BlockFilterPort.isBlocked(did) for F07.S02.M01 (N7).

### Example

```
vault command: identity.profile.update { "bio": "Fixes bikes on weekends.", "visibility": { "bio": "public", "region": "contacts" }, "expectedRevision": 2 }
-> { "profileId": "0192f440-…", "revision": 3 }
vault command: identity.profile.unpublish { "expectedRevision": 3 }
-> { "profileId": "0192f440-…", "revision": 4, "tombstone": { "type": "classrup.federation.tombstone/v1", "author": "did:key:z6Mk…", "payload": { "target": "sha256-…", "reason": "withdrawn" }, "sig": "…" }, "syncStates": [ { "relayId": "relay.example.org", "syncState": "prepared" } ] }
vault command: identity.block.add { "blockedDid": "did:key:z6Mk…", "note": "spam offers" }
-> { "blockId": "0192f441-…", "revision": 1 }
port: isBlockedEither("did:key:z6MkA…", "did:key:z6MkB…") -> true
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-056-09.T05 | integration | PS-056-01.R02, PS-056-04.R02 | block S2 then deliver a profile, an offer card and a message from S2 | all dropped silently; S2 gets no error; isBlockedEither is true both ways |
| TEST-PS-056-09.T06 | contract | PS-056-04.R01, PS-056-04.R03 | every command, query and event run | outputs, statements and payloads validate against registry schemas; signatures verify; a stranger view has only public fields |
| TEST-PS-056-09.T07 | integration | PS-056-04.R02, PS-056-09.R03 | consumer fakes subscribe to identity.block.added | open offers, drafts, shares and outbox items to the blocked DID are cancelled with reason blocked |
| TEST-PS-056-09.T15 | integration | PS-056-04.R01 | unpublish a profile published to R1 while R1 is offline, then online | tombstone signed by P1 queued with per-relay sync state; identity.profile.updated with changedFields [withdrawn]; after delivery a viewer vault deletes the profile |
| TEST-PS-056-09.T16 | abuse | PS-056-04.R04 | a tombstone for P's profile signed by origin relay R1, then one signed by P1 | after the relay tombstone the profile stays active with R1 removed from provenance; the author tombstone deletes it |
| TEST-PS-056-09.T17 | integration | PS-056-04.R05, PS-056-03.R01 | moderation.action.applied and moderation.action.reverted delivered to a vault and to the relay runtime | the relay stops and then resumes serving its copy; the vault Profile is unchanged except an optional notServedBy provenance entry |
| TEST-PS-056-09.T22 | integration | PS-056-04.R06 | F08.S01.M01 stub calls MailboxHintPort.set after register on R1, then after rotate with a new ID, with the profile published to R1 and mailboxes visibility public; then with mailboxes private | the own profile holds the ID, then the replacement; a new version with seq plus 1 carrying only the replacement is published to R1 after the consent check; identity.profile.updated lists mailboxes; private mailboxes never enter a statement |
| TEST-PS-056-09.T23 | contract | PS-056-04.R01 | publish and unpublish with a StatementPublisherPort spy | publish calls StatementPublisherPort.publish and unpublish calls issueTombstone; seq and prev come from the port; no other signing path is used |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, F11.S01.M01, F06.S02.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F10.S02.M03, F15.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
