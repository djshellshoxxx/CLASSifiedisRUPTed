# PS-051-10 — Import, export, backup and rollback: Relevance ranking

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S03.M01 Relevance ranking](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/ranking/relevance` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-051-10.R01** The vault export contains no RankingConfig because the bundled default is part of the app; relay configs are relay operational data.
- **PS-051-10.R02** A relay's configuration history is part of the relay backup and restored intact with the same version numbers.
- **PS-051-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** No vault export section; a relay operator can export the version history as JSON Lines of classrup.discovery.ranking_config/v1 for transparency.
- **import:** A relay operator import re-validates every version and rejects gaps in numbering or invalid parameters; a vault never imports relay configs into discovery_ranking_config and only caches verified fetched configs for display.
- **backup:** Relay backup per CTR-IOX-001 IOX-3 and IOX-7 includes the table; losing a relay loses no user-owned data.
- **migration rollback:** Additive parameters only within v1 with defaults; rollback is a new version copying an older one, and releases roll back by redeploying the previous version.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-051-09.T14 | integration | PS-051-10.R01, PS-051-10.R02, PS-051-10.R03 | restore relay from backup; vault fetches the relay's config with get_active | relay active version and numbering preserved; in the vault the config lands only in discovery_ranking_config_cache keyed by relay and version, the bundled row is unchanged and local ranking ignores it |

## Dependencies

Module depends on: F06.S02.M01, F06.S01.M01, F11.S01.M01, F11.S01.M03, F12.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
