# PS-045-09 — Contract and acceptance tests: Search index

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S01.M01 Search index](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/search/index` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-045-09.R01** Every requirement is covered by at least one automated test with deterministic clock and ID generator.
- **PS-045-09.R02** Event handlers are verified against recorded event fixtures and a fake signed-projection reader.
- **PS-045-09.R03** Privacy and signature tests prove that no field outside P0, no unsigned projection and no cell longer than 5 characters can be indexed.

## Specification

See the module test table below (all processes).

**Fixtures:** Tenant T, author A with did:key keypair, signed projections L1..L5, fixed clock 2026-11-04T10:00:00Z, fake projection reader, relay and vault harnesses sharing the same package.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-045-09.T01 | unit | PS-045-01.R01, PS-045-01.R02, PS-045-02.R01 | upsert a valid signed projection | document stored active, FTS row present, text NFC-normalized, provenance fields set |
| TEST-PS-045-09.T02 | unit | PS-045-01.R01, PS-045-02.R02 | projection with geo cell u4pruy (6 chars) | DISCOVERY_CELL_TOO_PRECISE, no row written |
| TEST-PS-045-09.T03 | property | PS-045-02.R03 | random Unicode titles with control and bidi characters | stored text has none of them and length limits hold |
| TEST-PS-045-09.T04 | integration | PS-045-03.R01, PS-045-03.R02 | publish, unpublish, republish a listing | active, removed (FTS row gone), active with fresh text and a newer revision |
| TEST-PS-045-09.T05 | integration | PS-045-01.R03, PS-045-03.R03 | removed document older than 30 days | purge sweep deletes it; younger rows kept |
| TEST-PS-045-09.T06 | integration | PS-045-04.R02, PS-045-06.R01 | deliver the same event twice and an older edit afterwards | one document, stale edit ignored |
| TEST-PS-045-09.T07 | contract | PS-045-04.R01, PS-045-04.R03 | rebuild command and each applied change | command and discovery.index.updated payloads validate against registry schemas; one event per change |
| TEST-PS-045-09.T08 | abuse | PS-045-02.R02, PS-045-07.R03 | tampered projection, wrong author key and unsigned projection | all rejected with DISCOVERY_PROJECTION_INVALID, nothing indexed |
| TEST-PS-045-09.T09 | abuse | PS-045-05.R01, PS-045-05.R02 | non-operator calls rebuild on a relay; locked vault calls rebuild | FORBIDDEN in both cases |
| TEST-PS-045-09.T10 | integration | PS-045-04.R02, PS-045-07.R02 | signed tombstone then later republish of the same cid | document removed with reason tombstoned, republish refused |
| TEST-PS-045-09.T11 | integration | PS-045-06.R02, PS-045-06.R03 | handler fails 8 times; crash during rebuild; verification key unavailable | dead_letter after 8 attempts; live index unchanged; event quarantined after 24 h |
| TEST-PS-045-09.T12 | abuse | PS-045-07.R03 | author with 201 documents; claimedPublishedAt 3 years ahead | excess stored removed; recency uses firstSeenAt |
| TEST-PS-045-09.T13 | integration | PS-045-05.R03, PS-045-07.R01 | query layer asks for a document from a removed row | no title or body is ever returned |
| TEST-PS-045-09.T14 | load | PS-045-08.R01, PS-045-08.R02, PS-045-08.R03 | 200 events/s on relay for 5 minutes and 5 000 documents rebuild in a vault emulation | freshness p95 <= 5 s; relay 100 000 rebuild <= 10 min; vault rebuild <= 30 s |
| TEST-PS-045-09.T15 | unit | PS-045-09.R01, PS-045-09.R02, PS-045-09.R03 | traceability tool run over PS-045 | every requirement maps to a passing test and privacy suite is green |
| TEST-PS-045-09.T16 | integration | PS-045-10.R01, PS-045-10.R02, PS-045-10.R03 | restore of vault from export then rebuild; relay backup restore then rebuild | index equals expectation derived from retained signed projections |

## Acceptance criteria

- All tests T01-T16 pass in CI.
- A newly published listing is searchable on a relay within 5 seconds p95 and a tombstoned one is gone within 5 seconds p95.
- No indexed row contains a geohash longer than 5 characters, an unsigned projection or any P1-P4 field (privacy suite).

## Dependencies

Module depends on: F06.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-FED-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
