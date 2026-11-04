# PS-144-09 — Contract and acceptance tests: Goods taxonomy

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M03 Goods taxonomy](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/goods` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-144-09.R01** Every requirement is covered by at least one automated test.
- **PS-144-09.R02** Contract tests validate pack statements, commands and events against the registry and verify signatures.
- **PS-144-09.R03** Tree invariants are covered by property tests with at least 200 runs, 10 000 nightly.

## Specification

See the module test table below (all processes).

**Fixtures:** Seed pack core-1 with 12 top-level groups and 300 categories, publisher keys PK1 (trusted) and PK2 (untrusted), user vault U, clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-144-09.T01 | unit | PS-144-01.R01, PS-144-01.R02, PS-144-02.R01, PS-144-02.R02 | create category with names and key | stable id, key unique for publisher, en name required |
| TEST-PS-144-09.T02 | unit | PS-144-02.R03 | violate each rule V01-V10 | documented error code returned and nothing staged or applied |
| TEST-PS-144-09.T03 | property | PS-144-01.R03, PS-144-02.R02 | random trees and moves | depth <= 4, no cycles, child limit holds, restricted implies reason key |
| TEST-PS-144-09.T04 | property | PS-144-03.R01, PS-144-03.R02 | random status changes | only declared transitions; retired requires mergedInto; terminal never reverts |
| TEST-PS-144-09.T05 | integration | PS-144-03.R03, PS-144-06.R02 | pack with one invalid category | whole pack rejected, previous version still active |
| TEST-PS-144-09.T06 | contract | PS-144-04.R01, PS-144-04.R02, PS-144-09.R02 | release and apply | pack validates against classrup.governance.taxonomy_pack/v1, signature verifies, changed events validate |
| TEST-PS-144-09.T07 | integration | PS-144-04.R03, PS-144-05.R03 | relay serves and accepts pack | anonymous read allowed; upload only with operator device key; relay cannot alter user mirror |
| TEST-PS-144-09.T08 | abuse | PS-144-05.R01, PS-144-05.R02 | non-publisher authors; untrusted publisher pack; tampered pack | FORBIDDEN, pack pending untrusted, signature failure rejects |
| TEST-PS-144-09.T09 | integration | PS-144-06.R01, PS-144-06.R03 | replay release and apply same pack | one packCid, no duplicate events |
| TEST-PS-144-09.T10 | integration | PS-144-06.R03 | vault offline then reconnect; relay down for release | last pack in use; release prepared then transport_acknowledged only with receipt |
| TEST-PS-144-09.T11 | abuse | PS-144-07.R01, PS-144-07.R02, PS-144-07.R03 | scan stored data and logs; pack with 2 001 categories and 1.5 MiB | no personal data beyond fingerprint; oversized pack rejected before storage |
| TEST-PS-144-09.T12 | load | PS-144-08.R01, PS-144-08.R02, PS-144-08.R03 | 2 000-category tree on Moto G profile; relay at 50 req/s | tree p95 <= 60 ms, apply p95 <= 800 ms, relay p95 <= 150 ms, no telemetry |
| TEST-PS-144-09.T13 | unit | PS-144-09.R01, PS-144-09.R03 | traceability tool run, seeded property replay | every PS-144 requirement maps to a passing test |
| TEST-PS-144-09.T14 | integration | PS-144-10.R01, PS-144-10.R02, PS-144-10.R03 | export, import to fresh vault, import pack with id reuse | categories round-trip with provenance; id reuse rejected |
| TEST-PS-144-09.T15 | a11y | PS-144-01.R03 | axe run on picker and settings | zero serious or critical issues; keyboard tree navigation and Move to flow work |

## Acceptance criteria

- All tests T01-T15 pass in CI.
- A pack changes a vault only after signature, publisher trust and tree validation succeed, atomically.
- Category ids are never reused, depth never exceeds 4, and retired categories always resolve to a merge target.

## Dependencies

Module depends on: F18.S02.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
