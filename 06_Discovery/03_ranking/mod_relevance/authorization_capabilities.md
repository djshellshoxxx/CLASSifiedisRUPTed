# PS-051-05 — Authorization and capabilities: Relevance ranking

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S03.M01 Relevance ranking](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/ranking/relevance` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-051-05.R01** Relay policy - only the operator role of the relay hosting the config may publish or roll back; the action is recorded in that relay's audit log with actor and version only.
- **PS-051-05.R02** The active config is public read so users can inspect how a relay ranks; the vault's bundled default is read by the principal.
- **PS-051-05.R03** No role can influence another relay or any vault; a vault ignores relay configs for its own local ranking.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| discovery.ranking_config.publish | operator | operator role on this relay; flag on; within 10 publications per 24 h |
| discovery.ranking_config.rollback | operator | operator role on this relay; target version exists |
| discovery.ranking_config.read_public | principal, anonymous | public read; relay policy quota applies |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-051-09.T07 | abuse | PS-051-05.R01, PS-051-05.R02, PS-051-05.R03 | member publishes; anonymous reads; operator of relay A publishes on relay B | FORBIDDEN for the first and last; read allowed |

## Dependencies

Module depends on: F06.S02.M01, F06.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
