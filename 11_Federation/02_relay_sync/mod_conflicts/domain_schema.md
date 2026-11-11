# PS-086-01 — Domain schema: Federated conflicts

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M03 Federated conflicts](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/conflicts` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-086-01.R01** A ConflictRecord stores the author, subject, conflict kind, class (public_projection or commitment), up to 5 candidate cids with provenance, status, resolution and freeze scope.
- **PS-086-01.R02** Commitment ConflictRecords are P2, visible only to the vault owner, never leave the vault by themselves and appear in logs as IDs only; public_projection ConflictRecords are the only kind a relay holds and are visible to that relay's operator.
- **PS-086-01.R03** Candidate claimed times are stored as claims and relay receipt times as evidence of that relay's clock only.
- **PS-086-01.R04** Commitment conflict predicates and subject keys come from the F11.S01.M01 registry, and the promise index they are evaluated against is the FederatedRecord subject index owned by F11.S01.M02.

## Specification

### ConflictRecord

Schema `classrup.federation.conflict/v1` · storage **relay+device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope (vault id in the browser vault) |
| kind | enum — fork_seq \| prev_mismatch \| commitment_conflict |
| statementClass | enum — public_projection \| commitment (relays hold public_projection only) |
| author | string — did:key whose statements conflict |
| chainKey? | json — {signerKey, stream} for fork kinds |
| seq? | int — conflicting sequence number for fork kinds |
| subjectRef? | string — registry subject key the commitment concerns, e.g. consent subject, reservation listing, move:subject |
| candidates | json — 2..5 entries {cid, claimedAt, receivedAt, receivedFromRelay?, fromListedRelay: boolean, relayReceipt?} |
| freezeScope | string[] — subject keys and aggregate IDs whose coordination is frozen; empty for public_projection |
| requiredSigners? | string[] — commitment only: every principal the registry requires to sign a superseding statement |
| status | enum — open \| resolved \| auto_resolved \| superseded |
| resolution? | json — {decision: keep\|drop_all\|origin_wins\|superseded, keptCid?, decidedBy: principal\|operator\|policy, decidedAt, listedRelaysAtDecision?} |
| supersededByCid? | string — renegotiated or corrected statement that closed the conflict |
| detectedAt | timestamp — local clock |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- At most one open ConflictRecord per (tenantId, author, chainKey, seq) for fork kinds and per (tenantId, subjectRef) for commitment conflicts.
- A commitment ConflictRecord never reaches auto_resolved and never ends with decision keep.
- status resolved with decision keep implies statementClass public_projection and keptCid is one of the candidate cids.
- candidates always has at least 2 distinct cids.
- A relay never stores a ConflictRecord with statementClass commitment.

### Storage DDL

```sql
CREATE TABLE fed_conflict (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, kind TEXT NOT NULL, statement_class TEXT NOT NULL,
  author TEXT NOT NULL, chain_key TEXT, seq INTEGER, subject_ref TEXT, status TEXT NOT NULL, detected_at TEXT NOT NULL,
  revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX fed_conflict_open_fork ON fed_conflict(tenant_id, author, chain_key, seq) WHERE status = 'open' AND seq IS NOT NULL;
CREATE UNIQUE INDEX fed_conflict_open_subject ON fed_conflict(tenant_id, subject_ref) WHERE status = 'open' AND subject_ref IS NOT NULL;
CREATE INDEX fed_conflict_author_open ON fed_conflict(tenant_id, author) WHERE status = 'open';
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-086-09.T01 | unit | PS-086-01.R01, PS-086-01.R03, PS-086-02.R02 | detect with E7a and E7b | one open ConflictRecord with 2 candidates, claimed and receipt times stored separately |
| TEST-PS-086-09.T10 | abuse | PS-086-07.R03, PS-086-01.R04 | attacker signs a statement as a non-participant for a victim's proposal | quarantined by F11.S01.M02 V14, no conflict opened, trade not frozen |
| TEST-PS-086-09.T15 | e2e | PS-086-01.R02, PS-086-03.R02 | two vaults receive conflicting acceptances; user opens review screen | trade paused banner visible, labels claim vs evidence, only the owner sees the record, axe zero serious issues |
| TEST-PS-086-09.T19 | unit | PS-086-01.R04, PS-086-04.R04 | each registry predicate: consents on one subject with different digests, overlapping reservations to different holders, two deal obligation digests, two moves with different toRelay, plus non-conflicting pairs | detect is called exactly for the conflicting pairs and freezeScope names the subject |

## Dependencies

Module depends on: F11.S02.M02, F11.S01.M03, F11.S01.M01, F07.S02.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [module SPEC](SPEC.md).
