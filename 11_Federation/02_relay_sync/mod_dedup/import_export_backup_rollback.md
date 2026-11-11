# PS-087-10 — Import, export, backup and rollback: Federated dedup

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M02 Federated dedup](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/dedup` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-087-10.R01** The library stores no data, so export, import and backup of chain heads and buffers belong to F11.S01.M02.
- **PS-087-10.R02** Importing a vault or relay backup must rebuild each chain head by running verifyChain() over stored envelopes before ingest resumes.
- **PS-087-10.R03** The limits are constants of the envelope v=1 protocol; changing them requires a new release note and does not alter stored data.

## Specification

- **export:** Nothing is exported by this module; the constants (24 h, 100, 50, 5, 500, 5000, 1000) are published in the build artifact federation-limits.json for audit.
- **import:** On import F11.S01.M02 calls verifyChain() per chain key; segments are rebuilt with their anchors and gaps, forks are quarantined and reported.
- **backup:** Nothing to back up; chain state is part of the F11.S01.M02 backup (CTR-IOX-001).
- **migration rollback:** Pin to library version; rollback is a dependency revert because decisions are pure and no data format is owned here.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-087-09.T12 | unit | PS-087-10.R01, PS-087-10.R02, PS-087-10.R03 | decisions on golden chains from the previous release | identical decisions after upgrade; constants are exported for audit |

## Dependencies

Module depends on: F11.S01.M03, CTR-FED-001, CTR-ERR-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
