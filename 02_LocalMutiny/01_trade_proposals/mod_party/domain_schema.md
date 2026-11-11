# PS-014-01 — Domain schema: Proposal party roster

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S01.M02 Proposal party roster](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/trade_proposals/party` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-014-01.R01** A ProposalParty links one DID to one subject with a ring position, role, status, mailbox hints and the time it joined or left on the local clock.
- **PS-014-01.R02** The roster is canonical only through the signed revision snapshot; local rows are a view that must match the head revision's party list.
- **PS-014-01.R03** Mailbox hints are public routing data (relay ids) and nothing else about a party is stored here.

## Specification

### ProposalParty

Schema `classrup.mutiny.proposal_party/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — vault tenant scope |
| subjectType | enum — trade_proposal \| cycle |
| subjectId | uuidv7 — subject the party belongs to |
| actorId | did — party DID (did:key); unique within the subject |
| position | int — 0..7 ring position; giver at position i gives to position (i+1) mod N |
| role | enum — coordinator \| participant |
| isLocal | boolean — true for the vault's principal |
| mailboxHints | array — 1..3 relay ids or direct endpoints from the party's signed projection |
| status | enum — active \| left \| removed |
| leftReason? | enum — declined \| withdrew \| unavailable \| timeout \| fork_frozen \| locally_removed |
| joinedAt | timestamp — local clock |
| leftAt? | timestamp — local clock |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- (subjectId, actorId) is unique and (subjectId, position) is unique.
- Per subject there are 2..8 parties, exactly one has role coordinator, and for trade_proposal there are exactly 2.
- A party with status left or removed is never reactivated; a returning person means a new subject.

### Storage DDL

```sql
CREATE TABLE mutiny_proposal_party (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, subject_id TEXT NOT NULL, actor_id TEXT NOT NULL, position INTEGER NOT NULL,
  role TEXT NOT NULL, status TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX mutiny_party_actor ON mutiny_proposal_party(tenant_id, subject_id, actor_id);
CREATE UNIQUE INDEX mutiny_party_position ON mutiny_proposal_party(tenant_id, subject_id, position);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-014-09.T01 | unit | PS-014-01.R01, PS-014-01.R03, PS-014-02.R01 | join valid 2, 3, 4 and 8 party rosters | rows stored with unique positions and one coordinator |
| TEST-PS-014-09.T09 | integration | PS-014-06.R03, PS-014-01.R02, PS-014-02.R03 | tampered revision with different party order | MUTINY_ROSTER_MISMATCH and consent blocked |
| TEST-PS-014-09.T14 | a11y | PS-014-01.R01 | roster and ring screens | axe zero serious issues; ring text alternative present |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, F12.S03.M04, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [module SPEC](SPEC.md).
