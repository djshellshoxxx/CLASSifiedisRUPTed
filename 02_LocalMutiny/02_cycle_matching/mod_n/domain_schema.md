# PS-018-01 — Domain schema: N-party cycle engine

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M03 N-party cycle engine](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/n` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-018-01.R01** A CycleSuggestion stores an ordered ring of legs (giver, receiver, item, satisfied want), its cycleKey, score tuple, mode, expiry and status; it is advice and contains no consent, reservation or signature of any participant.
- **PS-018-01.R02** The cycleKey is sha256 over the RFC 8785 JCS bytes of the ring rotated so the smallest giver DID is first, so the same cycle yields the same key in every vault and on every relay.
- **PS-018-01.R03** A CompatibilityGraph is a derived, short-lived cache of nodes and edges plus run statistics (expansions, duration, truncation) and an inputHash used to prove determinism; it is never exported and is purged after 24 h.
- **PS-018-01.R04** Edge, node and result caps are fixed numbers, at most 2000 nodes, 20000 edges, 8 legs per cycle and 500 suggestions per run.

## Specification

### CycleSuggestion

Schema `classrup.mutiny.cycle_suggestion/v1` · storage **device** · privacy **P2** · retention **RET-SHORT**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key in the vault |
| tenantId | uuidv7 — vault tenant scope |
| cycleKey | cid — sha256-base64url of JCS(ring rotated to smallest giver DID first); unique among status suggested |
| runId | uuidv7 — run that produced or last confirmed it |
| mode | enum — local_rooted \| relay_global \| relay_imported |
| length | int — 2..8 |
| legs | array — 2..8 items {position, giverId did, receiverId did, inventoryItemId uuidv7, listingCid cid, wantCid cid, indicativeValue Money, distanceBucket int 0..4 (F02.S02.M04 ordinal of bucketBetween(giver listing cell, receiver want cell))} |
| settlementCurrency | string — registered currency code (F09.S03.M01) |
| score | object — {participants int, imbalancePermille int 0..1000, maxDistanceBucket 0..4, oldestWantAgeDays int} |
| needsCompensation | boolean — true when some gap exceeds the profile tolerance but is within 250 permille and all participants accept compensation |
| rank | int — 1-based position in the run selection |
| status | enum — suggested \| proposed \| dismissed \| expired \| superseded |
| verifiedLocally | boolean — true when every leg was rechecked against retained signed projections in this vault (shown as 'rechecked against signed listings on this device'; peer availability remains a claim until that peer signs a reservation) |
| trust | array — one per participant {actorId, firstSeenDays int (local first sighting of the projection), completedTrades int (F07.S03.M01 completedByType total known here), keyLinkedWith did[] (F07 key-linkage reads), newIdentity boolean} |
| keyLinked | boolean — true when two or more participants are key-linked; the ring is shown with a warning and needs explicit confirmation to propose |
| projectionAsOf | timestamp — oldest projection timestamp used (a claim of the projection authors) |
| relayId? | string — origin relay when mode is relay_imported |
| relaySig? | string — Ed25519 signature of the relay over JCS of the suggestion body; evidence of relay assertion only |
| firstSeenAt | timestamp — RFC 3339 UTC, local clock |
| expiresAt | timestamp — now + 24 h on every confirmation, hard cap firstSeenAt + 7 d |
| suppressedUntil? | timestamp — set to dismissal time + 30 d on dismissed |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- Every legs[i].receiverId equals legs[i+1 mod length].giverId, all giverIds are distinct and all inventoryItemIds are distinct.
- A participant DID and an inventory item appear in at most one suggestion with status suggested per vault.
- length equals legs.length and is at most min(tenant Lmax, 8).

### CompatibilityGraph

Schema `classrup.mutiny.compatibility_graph/v1` · storage **derived** · privacy **P2** · retention **RET-EPHEMERAL**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| runId | uuidv7 — owning run |
| partitionKey | string — 'all' or 'l1:<geohash4>' from the matching profile regionL1 (partitioning only); cross-cell edges are not built in MVP |
| mode | enum — local_rooted \| relay_global |
| inputHash | cid — sha256 of JCS(sorted nodes, sorted edges, parameters); equal inputHash must give equal output |
| nodeCount | int — 0..2000 |
| edgeCount | int — 0..20000 |
| edges | array — sorted by (from, to) items {from did, to did, inventoryItemId, wantCid, valueMinor string, distanceBucket int 0..4 (cell to cell from L2 cells), wantCreatedAt timestamp} |
| lmax | int — 2..8 |
| expansions | int — 0..100000 |
| durationMs | int — wall time of enumeration |
| cyclesFound | int — elementary cycles discovered before filtering |
| truncated | enum — none \| expansions \| time \| graph_cap |
| startedAt | timestamp — RFC 3339 UTC |

**Invariants**
- At most one edge exists per ordered pair (from, to) and no edge has from equal to to.
- Nodes are ordered by DID string ascending, the order used by the enumeration.

### Storage DDL

```sql
CREATE TABLE mutiny_cycle_suggestion (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, cycle_key TEXT NOT NULL, status TEXT NOT NULL,
  length INTEGER NOT NULL, expires_at TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX mutiny_suggestion_active_key ON mutiny_cycle_suggestion(tenant_id, cycle_key) WHERE status = 'suggested';
CREATE INDEX mutiny_suggestion_expiry ON mutiny_cycle_suggestion(tenant_id, status, expires_at);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-018-09.T01 | unit | PS-018-01.R01, PS-018-01.R02, PS-018-04.R01, PS-018-09.R04 | run on g2, g3, g4 | suggestions of length 2, 3, 4 with stable cycleKey rotated to smallest DID; no statement emitted |
| TEST-PS-018-09.T02 | unit | PS-018-01.R04, PS-018-02.R01, PS-018-02.R02 | Lmax 1 and 9, and graph with 2001 nodes | MUTINY_LMAX_INVALID and MUTINY_GRAPH_TOO_LARGE respectively |
| TEST-PS-018-09.T03 | property | PS-018-09.R02, PS-018-01.R01 | random graphs up to 60 nodes | every suggestion is elementary, has distinct participants, distinct items, length ≤ Lmax and receiverId of leg i equals giverId of leg i+1 |
| TEST-PS-018-09.T21 | integration | PS-018-01.R03 | graph built at T0, clock injected to T0 + 24 h + 1 s | CompatibilityGraph purged by the retention sweep and get_stats returns NOT_FOUND for that run |
| TEST-PS-018-09.T23 | unit | PS-018-02.R02, PS-018-01.R01 | pair distance from L2 cells u4pru and u4prv, an L1-only listing cell, and a 6-character cell | ordinal 0, at least 3, and DISCOVERY_PRECISION_FORBIDDEN rejection of the projection edge |

## Dependencies

Module depends on: F02.S02.M04, F02.S02.M05, F02.S04.M03, F01.S01.M01, F01.S02.M02, F01.S03.M01, F06.S02.M01, F07.S02.M02, F07.S02.M01, F07.S03.M01, F07.S03.M02, F09.S03.M02, F09.S03.M03, F11.S01.M01, F11.S01.M02, F16.S02.M03, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-OBS-001, CTR-SCH-001. Predecessor: [module SPEC](SPEC.md).
