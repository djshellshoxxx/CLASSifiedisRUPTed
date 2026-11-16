# PS-086-01 — Domain schema: Federated conflicts

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M03 Federated conflicts](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/conflicts` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-086-01.R01** A ConflictRecord stores the author, subject, conflict kind, class (public_projection or commitment), up to 5 candidate cids with provenance, status, resolution and freeze scope.
- **PS-086-01.R02** ConflictRecords are P1-visible only to the vault owner or the operator of the relay that holds them and never leave the device or relay by themselves.
- **PS-086-01.R03** Candidate claimed times are stored as claims and relay receipt times as evidence of that relay's clock only.

## Specification

### ConflictRecord

Schema `classrup.federation.conflict/v1` · storage **relay+device** · privacy **P1** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope (vault id in the browser vault) |
| kind | enum — fork_seq \| prev_mismatch \| commitment_conflict |
| statementClass | enum — public_projection \| commitment |
| author | string — did:key whose statements conflict |
| seq? | int — conflicting sequence number for fork kinds |
| subjectRef? | string — aggregate the commitment concerns, e.g. proposal digest or reservation id |
| candidates | json — 2..5 entries {cid, claimedAt, receivedAt, originRelay, relayReceipt?} |
| freezeScope | string[] — aggregate IDs whose coordination is frozen; empty for public_projection |
| status | enum — open \| resolved \| auto_resolved \| superseded |
| resolution? | json — {decision: keep\|drop_all\|origin_wins\|superseded, keptCid?, decidedBy: principal\|operator\|policy, decidedAt, originAtDecision?} |
| supersededByCid? | string — renegotiated or corrected statement that closed the conflict |
| detectedAt | timestamp — local clock |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- At most one open ConflictRecord per (tenantId, author, seq) for fork kinds and per (tenantId, subjectRef) for commitment conflicts.
- A commitment ConflictRecord never reaches auto_resolved.
- status resolved with decision keep implies keptCid is one of the candidate cids.
- candidates always has at least 2 distinct cids.

### Storage DDL

```sql
CREATE TABLE fed_conflict (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, kind TEXT NOT NULL, statement_class TEXT NOT NULL,
  author TEXT NOT NULL, seq INTEGER, subject_ref TEXT, status TEXT NOT NULL, detected_at TEXT NOT NULL,
  revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX fed_conflict_open_fork ON fed_conflict(tenant_id, author, seq) WHERE status = 'open' AND seq IS NOT NULL;
CREATE UNIQUE INDEX fed_conflict_open_subject ON fed_conflict(tenant_id, subject_ref) WHERE status = 'open' AND subject_ref IS NOT NULL;
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-086-09.T01 | unit | PS-086-01.R01, PS-086-01.R02, PS-086-02.R02 | detect with E7a and E7b | one open ConflictRecord with 2 candidates, claimed and receipt times stored separately |
| TEST-PS-086-09.T05 | integration | PS-086-03.R02, PS-086-01.R03 | commitment conflict C1 vs C2 for 30 days | still open; freezeScope contains the proposal; resolve with origin_wins returns FEDERATION_CONFLICT_NOT_AUTO_RESOLVABLE |
| TEST-PS-086-09.T15 | e2e | PS-086-01.R03, PS-086-03.R02 | two vaults receive conflicting acceptances; user opens review screen | trade paused banner visible, labels claim vs evidence, axe zero serious issues |

## Dependencies

Module depends on: F11.S02.M02, F11.S01.M03, F11.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [module SPEC](SPEC.md).
