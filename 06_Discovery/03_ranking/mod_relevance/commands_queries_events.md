# PS-051-04 — Commands, queries and events: Relevance ranking

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S03.M01 Relevance ranking](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/ranking/relevance` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-051-04.R01** publish and rollback are relay commands that produce the signed statement classrup.discovery.ranking_config/v1 signed with the relay key; there is no vault command because the vault uses the bundled default.
- **PS-051-04.R02** get_active is a public query available in the vault (bundled default) and on a relay (its active version).
- **PS-051-04.R03** The event discovery.ranking_config.published is emitted in the same transaction as the activation and is local to the relay.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `discovery.ranking_config.publish` | discovery.ranking_config.publish | { weights, bm25, recencyHalfLifeDays, distanceWeights, promotionBoost, reasonNote?, expectedActiveVersion } | { configId, version, statementCid } | RANKING_CONFIG_INVALID, CONFLICT_REVISION, RATE_LIMITED, FORBIDDEN | discovery.ranking_config.published | yes (Idempotency-Key) |
| `discovery.ranking_config.rollback` | discovery.ranking_config.rollback | { targetVersion, expectedActiveVersion, reasonNote? } | { configId, version, statementCid } | NOT_FOUND, CONFLICT_REVISION, RATE_LIMITED, FORBIDDEN | discovery.ranking_config.published | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `discovery.ranking_config.get_active` | discovery.ranking_config.read_public | { includeHistory?: boolean } | { active: RankingConfig, history?: RankingConfig[] (at most 20 versions) } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `discovery.ranking_config.published` | P0 | { configId, version, origin, relayId?, statementCid, activatedAt } |

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| RANKING_CONFIG_INVALID | 422 | no | a ranking parameter is outside its allowed range or the weights do not sum to 1.0 |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
relay command: discovery.ranking_config.publish { "weights": { "text": 0.6, "recency": 0.25, "distance": 0.15 }, "bm25": { "titleWeight": 5, "bodyWeight": 1, "k": 3 }, "recencyHalfLifeDays": 14, "distanceWeights": { "lt5": 1, "5_10": 0.85, "10_25": 0.65, "25_50": 0.4, "gt50": 0.2 }, "promotionBoost": 0.15, "expectedActiveVersion": 3 }
-> { "configId": "0192f3f0-…", "version": 4, "statementCid": "sha256-Qm…" }
score: text = s/(s+k) with s = -bm25; base = 0.60*text + 0.25*0.5^(ageDays/14) + 0.15*bucketWeight; final = round(base * (1 + boost if promoted), 6)
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-051-09.T06 | contract | PS-051-04.R01, PS-051-04.R02, PS-051-04.R03, PS-051-09.R02 | commands, query and event run | outputs and statement validate against registry schemas and the signature verifies |

## Dependencies

Module depends on: F06.S02.M01, F06.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
