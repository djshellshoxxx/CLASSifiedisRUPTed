# PS-056-04 — Commands, queries and events: Profiles

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S02.M02 Profiles](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/profiles/profiles` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-056-04.R01** update, publish, block add and block remove are vault commands; publish produces the signed statement classrup.identity.profile/v1; receive is the vault intake of someone else's profile statement.
- **PS-056-04.R02** Block commands emit local P3 events that other modules consume to cancel work; block data is never placed in a statement.
- **PS-056-04.R03** Reads of profiles apply the viewer's perspective - strangers see public fields, conversation participants see contacts fields, the owner sees all.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `identity.profile.update` | identity.profile.write_own | { bio?, avatar?, languages?, visibility?, expectedRevision } | { profileId, revision } | VALIDATION_FAILED, IDENTITY_AVATAR_INVALID, IDENTITY_REGION_INVALID, CONFLICT_REVISION | identity.profile.updated | yes (Idempotency-Key) |
| `identity.profile.publish` | identity.profile.publish_own | { audience: public\|contacts, targetRelays?: array, threadIds?: array, expectedRevision } | { profileId, seq, cid, statement: classrup.identity.profile/v1, syncState: local_committed } | CONFLICT_REVISION, VALIDATION_FAILED | identity.profile.updated | yes (Idempotency-Key) |
| `identity.profile.receive` | identity.profile.receive | { statement: classrup.identity.profile/v1, provenance } | { profileId, seq, status } | IDENTITY_PROFILE_INVALID, BLOCKED_PARTY, VALIDATION_FAILED | identity.profile.updated | yes (Idempotency-Key) |
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
| `identity.profile.updated` | P0 | { did, origin: own\|received, seq, changedFields: array } |
| `identity.block.added` | P3 | { blockId, blockerDid, blockedDid } |
| `identity.block.removed` | P3 | { blockId, blockerDid, blockedDid } |

### Events consumed

| Type | Effect |
|---|---|
| `identity.account.created` | create the default own Profile with the pseudonym, visibility region private, no bio |
| `identity.pseudonym.changed` | refresh displayPseudonym on the own profile and mark it unpublished-changes |
| `discovery.location.updated` | set regionCell to the public cell (L1 or L2) or clear it at L0, still subject to the region visibility |
| `moderation.action.applied` | relay: hide the targeted profile on that relay under its hosting policy; vault: apply the user's local hide |
| `federation.tombstone.applied` | delete the received profile the signed tombstone targets |
| `privacy.deletion.completed` | vault erase - delete all profiles and blocks |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| IDENTITY_AVATAR_INVALID | 422 | no | avatar is not a 128 by 128 WebP under 24 KiB without metadata |
| IDENTITY_REGION_INVALID | 422 | no | region cell is longer than 5 characters or differs from the public cell of the location settings |
| IDENTITY_BLOCK_LIMIT | 409 | no | 1 000 active blocks already exist |
| IDENTITY_PROFILE_INVALID | 422 | no | received profile signature, size or sequence check failed |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command: identity.profile.update { "bio": "Fixes bikes on weekends.", "visibility": { "bio": "public", "region": "contacts" }, "expectedRevision": 2 }
-> { "profileId": "0192f440-…", "revision": 3 }
vault command: identity.block.add { "blockedDid": "did:key:z6Mk…", "note": "spam offers" }
-> { "blockId": "0192f441-…", "revision": 1 }
port: isBlockedEither("did:key:z6MkA…", "did:key:z6MkB…") -> true
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-056-09.T05 | integration | PS-056-01.R02, PS-056-04.R02 | block S2 then deliver a profile, an offer card and a message from S2 | all dropped silently; S2 gets no error; isBlockedEither is true both ways |
| TEST-PS-056-09.T06 | contract | PS-056-04.R01, PS-056-04.R03, PS-056-09.R02 | every command, query and event run | outputs, statements and payloads validate against registry schemas; signatures verify |
| TEST-PS-056-09.T07 | integration | PS-056-04.R02, PS-056-06.R01 | consumer fakes subscribe to identity.block.added | open offers, drafts, shares and outbox items to the blocked DID are cancelled with reason blocked |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
