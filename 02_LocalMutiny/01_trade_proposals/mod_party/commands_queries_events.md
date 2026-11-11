# PS-014-04 — Commands, queries and events: Proposal party roster

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S01.M02 Proposal party roster](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/trade_proposals/party` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-014-04.R01** join and leave are vault commands that change only local rows and produce no statement; the signed decline, withdrawal or revision that carries the same fact is produced by the owning module.
- **PS-014-04.R02** Events are emitted in the same IndexedDB transaction as the roster change.
- **PS-014-04.R03** Queries return only rosters of subjects stored in the vault.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `mutiny.party.join` | mutiny.party.join | { subjectType, subjectId, parties: { actorId, position, role }[2..8] } — vault command; no statement | { partyIds[], count } | VALIDATION_FAILED, MUTINY_ROSTER_SIZE, MUTINY_PARTICIPANT_DUPLICATE, BLOCKED_PARTY, MUTINY_PARTY_UNREACHABLE, MUTINY_PARTY_LIMIT, MUTINY_ROSTER_MISMATCH, CONFLICT_STATE | mutiny.party.joined | yes (Idempotency-Key) |
| `mutiny.party.leave` | mutiny.party.leave | { subjectId, actorId, reason: declined\|withdrew\|unavailable\|timeout\|fork_frozen\|locally_removed, expectedRevision } | { partyId, revision, status } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, FORBIDDEN | mutiny.party.left | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `mutiny.party.list_for_subject` | mutiny.party.read | { subjectType, subjectId } | { items: ProposalParty[], coordinatorId, matchesHeadRevision: boolean } | NOT_FOUND |
| `mutiny.party.check_roster` | mutiny.party.read | { actorIds: did[2..8] } | { ok: boolean, failures: { code }[] } | VALIDATION_FAILED |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `mutiny.party.joined` | P2 | { subjectType, subjectId, actorId, position, role } |
| `mutiny.party.left` | P2 | { subjectType, subjectId, actorId, position, reason } |

### Events consumed

| Type | Effect |
|---|---|
| `identity.block.added` | for every active subject containing the blocked DID and the principal, mark the principal's own party left with reason unavailable through the owning module; no event names the block |
| `mutiny.proposal.revised` | verify roster equals the new head snapshot; on peer revisions create missing roster rows with origin peer |
| `mutiny.cycle.declined` | mark the declining party left with reason declined |
| `mutiny.cycle.participant_dropped` | mark the dropped party left with the coarse reason |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| MUTINY_ROSTER_SIZE | 422 | no | roster size or coordinator count is invalid |
| MUTINY_PARTICIPANT_DUPLICATE | 422 | no | the same participant appears twice |
| MUTINY_PARTY_UNREACHABLE | 422 | no | a party has no verified mailbox hint so no statement could reach them |
| MUTINY_PARTY_LIMIT | 409 | no | the principal already has the maximum number of open subjects |
| MUTINY_ROSTER_MISMATCH | 409 | no | local roster differs from the signed head revision |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
# 4-party cycle roster created by coordinator Alice
mutiny.party.join { "subjectType":"cycle", "subjectId":"0192f400-…", "parties":[
  {"actorId":"did:key:z6MkAlice","position":0,"role":"coordinator"}, {"actorId":"did:key:z6MkBob","position":1,"role":"participant"},
  {"actorId":"did:key:z6MkCarol","position":2,"role":"participant"}, {"actorId":"did:key:z6MkDan","position":3,"role":"participant"} ] }
-> { "partyIds": ["0192f401-…","0192f402-…","0192f403-…","0192f404-…"], "count": 4 }
# ring: Alice->Bob, Bob->Carol, Carol->Dan, Dan->Alice. 2-party uses positions 0,1; 3-party 0..2; N-party 0..N-1 with N ≤ 8.
mutiny.party.leave { "subjectId":"0192f400-…", "actorId":"did:key:z6MkCarol", "reason":"declined", "expectedRevision":1 } -> { "status":"left" } (Carol is never replaced)
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-014-09.T05 | integration | PS-014-03.R03, PS-014-04.R03 | consume block.added, cycle.declined, participant_dropped, proposal.revised | rows marked with coarse reasons; roster mismatch detected on altered revision |
| TEST-PS-014-09.T06 | contract | PS-014-04.R01, PS-014-04.R02, PS-014-09.R02 | join and leave | events validate against registry and no statement is produced |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, F12.S03.M04, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
