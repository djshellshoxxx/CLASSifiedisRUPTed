# PS-045-02 — Validation rules: Search index

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S01.M01 Search index](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/search/index` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-045-02.R01** Every upsert is validated against the SearchDocument schema and the author signature before it touches the FTS table; failures leave the previous document unchanged.
- **PS-045-02.R02** Location precision, tombstone state and revision monotonicity are checked on every event so a bad or hostile source cannot widen what is publicly findable.
- **PS-045-02.R03** Text is normalized (NFC, control and bidi characters removed, length limits applied) so index content is stable across browsers and Node.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | title is 1..120 and body 0..2000 code points after NFC normalization and control or bidi character removal | VALIDATION_FAILED |
| V02 | geoCell5 is empty or matches ^[0-9b-hjkmnp-z]{5}$ (geohash base32, exactly 5 characters) | DISCOVERY_CELL_TOO_PRECISE |
| V03 | the projection is a known public P0 schema, not expired, not tombstoned, and its Ed25519 signature verifies against authorDid over JCS bytes | DISCOVERY_PROJECTION_INVALID |
| V04 | incoming source revision is greater than the stored sourceRevision, otherwise the event is acknowledged and ignored | DISCOVERY_SOURCE_STALE |
| V05 | priceMinor is an integer within 0..1 000 000 000 000 and currency is present when priceMinor is present | VALIDATION_FAILED |
| V06 | rebuild is requested by the vault principal or a relay operator and no other rebuild is running | DISCOVERY_REBUILD_IN_PROGRESS |
| V07 | the index holds fewer than 5 000 documents in a vault or fewer than 200 active documents per author on a relay, otherwise least-recently-viewed or oldest documents are evicted or deferred | DISCOVERY_INDEX_CAP |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-045-09.T01 | unit | PS-045-01.R01, PS-045-01.R02, PS-045-02.R01 | upsert a valid signed projection | document stored active, FTS row present, text NFC-normalized, provenance fields set |
| TEST-PS-045-09.T02 | unit | PS-045-01.R01, PS-045-02.R02 | projection with geo cell u4pruy (6 chars) | DISCOVERY_CELL_TOO_PRECISE, no row written |
| TEST-PS-045-09.T03 | property | PS-045-02.R03 | random Unicode titles with control and bidi characters | stored text has none of them and length limits hold |
| TEST-PS-045-09.T08 | abuse | PS-045-02.R02, PS-045-07.R03 | tampered projection, wrong author key and unsigned projection | all rejected with DISCOVERY_PROJECTION_INVALID, nothing indexed |

## Dependencies

Module depends on: F06.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-FED-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
