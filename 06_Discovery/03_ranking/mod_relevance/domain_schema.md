# PS-051-01 — Domain schema: Relevance ranking

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S03.M01 Relevance ranking](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/ranking/relevance` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-051-01.R01** A RankingConfig is an immutable numbered version with bounded numeric parameters, a signature by the publishing relay key, and exactly one active version per relay.
- **PS-051-01.R02** The vault ships a default RankingConfig version 1 inside the app bundle and never edits it; relay configs fetched for display are stored only in a separate cache table and never used for local ranking.
- **PS-051-01.R03** The promotion multiplier cap is a hard maximum of 1.25 that no configuration can exceed.

## Specification

### RankingConfig

Schema `classrup.discovery.ranking_config/v1` · storage **relay+device** · privacy **P0** · retention **RET-AUDIT**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope |
| version | int — monotonic per relay starting at 1; the bundled default is version 1 in the vault |
| origin | enum — bundled \| relay_published |
| relayId? | string — relay that published the version |
| weights | object — { text, recency, distance } each 0.05..0.90, sum 1.0 within 1e-9; default 0.60, 0.25, 0.15 |
| bm25 | object — { titleWeight: 1..10 default 5, bodyWeight: 1..10 default 1, k: 1..10 default 3 } |
| recencyHalfLifeDays | int — 1..90, default 14 |
| distanceWeights | object — { lt5, 5_10, 10_25, 25_50, gt50 } each 0.05..1.0 and non-increasing; default 1.0, 0.85, 0.65, 0.4, 0.2 |
| promotionBoost | number — 0..0.25, default 0.15; multiplier is 1 plus this, at most 1.25 |
| reasonNote? | string — 0..280 code points explaining the change |
| statementCid? | string — cid of the signed publication statement |
| status | enum — active \| retired |
| activatedAt | timestamp — relay clock |
| retiredAt? | timestamp — relay clock |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- Exactly one RankingConfig per relay (and exactly the bundled one in a vault) has status active.
- Published versions are never edited; a change is a new version and a rollback is a new version copying an older one.
- promotionBoost is at most 0.25 and weights sum to 1.0.
- Relay configs cached by a vault live only in discovery_ranking_config_cache, never in discovery_ranking_config.

### Storage DDL

```sql
CREATE TABLE discovery_ranking_config (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, version INTEGER NOT NULL, origin TEXT NOT NULL,
  status TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX discovery_ranking_config_version ON discovery_ranking_config(tenant_id, version);
CREATE UNIQUE INDEX discovery_ranking_config_active ON discovery_ranking_config(tenant_id) WHERE status = 'active';
-- vault only: display cache of relay configs fetched with get_active (24 h), keyed by relay
CREATE TABLE discovery_ranking_config_cache (
  tenant_id TEXT NOT NULL, relay_id TEXT NOT NULL, version INTEGER NOT NULL, statement_cid TEXT NOT NULL,
  fetched_at TEXT NOT NULL, data TEXT NOT NULL, PRIMARY KEY (tenant_id, relay_id, version));
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-051-09.T01 | unit | PS-051-01.R01, PS-051-02.R01 | publish valid config | version 4 active, previous version 3 retired, one active row |
| TEST-PS-051-09.T03 | unit | PS-051-01.R02, PS-051-01.R03 | golden score vectors for text, recency, distance, promotion | final scores equal the golden values to 6 decimals; promoted multiplier never above 1.25 |
| TEST-PS-051-09.T05 | property | PS-051-01.R02, PS-051-06.R03 | 200 runs of the same ranking on two simulated devices with different documentIds but the same projections and first-seen times | identical order; ties resolved by recency anchor then projectionCid |
| TEST-PS-051-09.T09 | abuse | PS-051-07.R02, PS-051-01.R03 | document with future claimedPublishedAt and expired promotion flag | recency uses firstSeenAt; no multiplier and no label |
| TEST-PS-051-09.T12 | integration | PS-051-01.R02, PS-051-06.R03 | vault without relay config | bundled default used and explanation says default ranking |
| TEST-PS-051-09.T17 | unit | PS-051-01.R01, PS-051-02.R02 | browse query without center, document with empty cell, query without text | distance or text term dropped and remaining weights renormalised; golden values match |

## Dependencies

Module depends on: F06.S02.M01, F06.S01.M01, F11.S01.M01, F11.S01.M03, F12.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [module SPEC](SPEC.md).
