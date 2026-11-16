# PS-019-04 — Commands, queries and events: Matching participant eligibility

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M04 Matching participant eligibility](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/party` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-019-04.R01** update is a vault command that may produce a signed projection statement; ingest is a vault command that verifies peer projections; queries are local.
- **PS-019-04.R02** Statement delivery to user-selected relays goes through the sync outbox with states prepared, transport_acknowledged, peer_accepted, and the UI never shows more than the reached state.
- **PS-019-04.R03** The module emits mutiny.matching_profile.updated for local changes and for accepted peer projections (actor.kind federated).

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `mutiny.matching_profile.update` | mutiny.matching_profile.update | { optedIn?, confirmDisclosure?, optInVersion?, maxCycleLength?, maxDistanceBucket?, acceptsCompensation?, pausedUntil?, excludedActorIds?, expectedRevision? } — vault command; produces statement classrup.mutiny.matching_profile/v1 (projection or tombstone) when public fields change | { profileId, revision, seq, syncState: local_committed \| prepared } | VALIDATION_FAILED, MUTINY_OPTIN_REQUIRED, MUTINY_PROFILE_REGION_REQUIRED, MUTINY_EXCLUSION_LIMIT, CONFLICT_REVISION | mutiny.matching_profile.updated | yes (Idempotency-Key) |
| `mutiny.matching_profile.ingest` | mutiny.matching_profile.ingest | { envelope: classrup.mutiny.matching_profile/v1 signed by its author } — vault command; produces no statement | { actorId, seq, accepted: boolean, quarantineReason? } | MUTINY_PROJECTION_INVALID, UNSUPPORTED_SCHEMA_VERSION, VALIDATION_FAILED | mutiny.matching_profile.updated | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `mutiny.matching_profile.get_mine` | mutiny.matching_profile.read_own | { none — the principal own profile } | { profile: MatchingProfile, syncState, lastPublishedAt } | NOT_FOUND |
| `mutiny.matching_profile.list_known` | mutiny.matching_profile.read_projections | { actorIds?: did[] ≤ 200, optedInOnly? default true, cursor?, limit ≤ 200 } | { items: { actorId, maxCycleLength, maxDistanceBucket, acceptsCompensation, regionL1, seq, projectionAsOf }[], nextCursor? } |  |
| `mutiny.matching_profile.check_eligible` | mutiny.matching_profile.read_projections | { actorIds: did[] ≤ 8, cycleLength } | { results: { actorId, eligible, reason? }[] } | VALIDATION_FAILED |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `mutiny.matching_profile.updated` | P2 | { actorId, optedIn, paused, maxCycleLength, maxDistanceBucket, acceptsCompensation, seq, origin } |

### Events consumed

| Type | Effect |
|---|---|
| `identity.block.added` | no profile change; eligibility function reads the block list at evaluation time |
| `identity.block.removed` | no profile change; eligibility re-evaluated on next read |
| `discovery.location.updated` | if the principal is opted in and regionL1 changed, update regionL1 and publish projection seq+1 |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| MUTINY_OPTIN_REQUIRED | 422 | no | opt-in needs the current disclosure version and explicit confirmation |
| MUTINY_PROFILE_REGION_REQUIRED | 422 | no | a home region at L1 or finer is required to opt in |
| MUTINY_EXCLUSION_LIMIT | 422 | no | exclusion list is limited to 200 entries |
| MUTINY_PROJECTION_INVALID | 422 | no | peer projection failed signature, sequence, chain or timestamp checks |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
# vault command, actor = unlocked local principal did:key:z6MkAlice
mutiny.matching_profile.update  Idempotency-Key: 0192f3a4-0000-7000-8000-0000000000b1
{ "optedIn": true, "confirmDisclosure": true, "optInVersion": "mutiny.matching.optin.v1", "maxCycleLength": 3, "maxDistanceBucket": "5_10", "acceptsCompensation": false, "excludedActorIds": ["did:key:z6MkMallory"] }
-> { "profileId": "0192f3a5-…", "revision": 2, "seq": 1, "syncState": "prepared" }
statement sent to selected relays (excludedActorIds omitted):
{ "v":1, "type":"classrup.mutiny.matching_profile/v1", "author":"did:key:z6MkAlice", "seq":1,
  "payload": { "optedIn": true, "maxCycleLength": 3, "maxDistanceBucket": "5_10", "acceptsCompensation": false, "regionL1": "u0qj" }, "sig": "…" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-019-09.T02 | contract | PS-019-01.R02, PS-019-04.R02, PS-019-07.R02, PS-019-09.R02, PS-019-09.R03 | opt in with 2 exclusions | projection validates against schema, contains exactly the public fields, excludedActorIds absent from projection, events and logs |
| TEST-PS-019-09.T07 | integration | PS-019-04.R01, PS-019-04.R03, PS-019-06.R01 | replay update with same key and different body | original response replayed; IDEMPOTENCY_KEY_REUSED |
| TEST-PS-019-09.T09 | contract | PS-019-04.R02, PS-019-05.R03 | sync state progression with fake relay | UI model shows only the reached state among local_committed, prepared, transport_acknowledged, peer_accepted |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, F06.S02.M02, F16.S02.M03, F12.S03.M04, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
