# PS-019-01 — Domain schema: Matching participant eligibility

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M04 Matching participant eligibility](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/party` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-019-01.R01** A MatchingProfile stores opt-in state with the accepted disclosure version, maximum cycle length, distance bucket, compensation flag, pause time and exclusion list, with one record per principal.
- **PS-019-01.R02** The vault record is P3 because it contains exclusions; only the derived projection with four coarse fields is P0 and signed with the principal's Ed25519 key.
- **PS-019-01.R03** Projections from other members are stored as read-only mirrors with provenance and a per-author seq chain; tombstones win over any projection with an equal or lower seq.

## Specification

### MatchingProfile

Schema `classrup.mutiny.matching_profile/v1` · storage **device** · privacy **P3** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key in the vault |
| tenantId | uuidv7 — vault tenant scope |
| actorId | did — principal DID (did:key); unique per vault for the local record, peers' mirrors are keyed by (actorId) |
| origin | enum — local \| peer_projection |
| optedIn | boolean — default false |
| optInVersion? | string — disclosure text key accepted, e.g. mutiny.matching.optin.v1; required when optedIn |
| optInAt? | timestamp — local clock for local record; a claim for peer mirrors |
| maxCycleLength | int — 2..8, default 4 |
| maxDistanceBucket | int — 0..4, ordinal of the F06.S02.M01 bucket enum (lt5=0, 5_10=1, 10_25=2, 25_50=3, gt50=4); default 2; discovery.bucket.* labels are display text only |
| acceptsCompensation | boolean — default false |
| pausedUntil? | timestamp — at most now + 90 d |
| excludedActorIds | array — local only, ≤ 200 DIDs, never in the projection |
| includeUnknownIdentities | boolean — local only, default false; when false the engine excludes counterparties with no history known to this vault (F02.S02.M03) |
| regionL1 | string — geohash4 of home region from F06.S02.M02, validated with F06.S02.M01 assertPublicCell; used only to partition matching, never for pair distances; required when optedIn |
| seq | int — projection sequence per CTR-FED-001 FED-3, starts at 1 |
| prev? | cid — hash of previous projection envelope |
| projectionCid? | cid — sha256 of the signed projection envelope |
| projectionSig? | string — Ed25519 signature over JCS of the projection envelope |
| tombstoned | boolean — true after a signed tombstone |
| provenance? | object — {originRelay, receivedAt, via[], verifiedAt} for peer mirrors (receivedAt is the local clock) |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- excludedActorIds never appears in projection payloads, events, logs or relay requests, and never contains the principal's own DID.
- optedIn true implies optInVersion, regionL1 and a published projection with seq equal to the record seq.
- A tombstoned record has optedIn false and no later projection with a higher seq is accepted from the same author unless it is a new opt-in with seq greater than the tombstone.

### Storage DDL

```sql
CREATE TABLE mutiny_matching_profile (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, actor_id TEXT NOT NULL, origin TEXT NOT NULL, opted_in INTEGER NOT NULL,
  seq INTEGER NOT NULL, tombstoned INTEGER NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX mutiny_matching_profile_actor ON mutiny_matching_profile(tenant_id, actor_id, origin);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-019-09.T01 | unit | PS-019-01.R01, PS-019-02.R01, PS-019-02.R02 | update with each of V01..V06 violated (V07..V10 in T03 and T20) in turn | documented error code and nothing stored |
| TEST-PS-019-09.T02 | contract | PS-019-01.R02, PS-019-04.R02, PS-019-07.R02, PS-019-09.R02, PS-019-09.R03 | opt in with 2 exclusions | projection validates against schema, contains exactly the public fields, excludedActorIds absent from projection, events and logs |
| TEST-PS-019-09.T03 | unit | PS-019-01.R03, PS-019-02.R03, PS-019-04.R04 | ingest valid, bad signature, lower seq, broken prev, future createdAt, and a projection of a DID the principal blocked | accepted once, other four quarantined or ignored with reasons, blocked DID dropped silently; signer role matches the F11.S01.M01 registry entry |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, F06.S02.M01, F06.S02.M02, F16.S02.M03, F12.S03.M04, F15.S01.M01, F11.S01.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [module SPEC](SPEC.md).
