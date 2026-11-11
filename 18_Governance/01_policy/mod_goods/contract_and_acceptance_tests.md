# PS-144-09 — Contract and acceptance tests: Goods taxonomy

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M03 Goods taxonomy](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/goods` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-144-09.R01** Every requirement is covered by at least one automated test.
- **PS-144-09.R02** Contract tests validate pack statements, commands and events against the registry and verify signatures.
- **PS-144-09.R03** Tree invariants are covered by property tests with at least 200 runs, 10 000 nightly.

## Specification

See the module test table below (all processes).

**Fixtures:** Seed pack core-1 with 12 top-level groups and 300 categories (bundled), publisher keys PK1 (trusted) and PK2 (untrusted), decision D1 approving a restricted flip of C1 by PK1, user vault U, fresh vault F, relay stub R with receipts, clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-144-09.T01 | unit | PS-144-01.R01, PS-144-01.R02, PS-144-02.R01, PS-144-02.R02 | create category with names and key | stable id, key unique for publisher, en name required |
| TEST-PS-144-09.T02 | unit | PS-144-02.R03 | violate each rule V01-V14 | documented error code returned and nothing staged or applied |
| TEST-PS-144-09.T03 | property | PS-144-02.R02 | random trees and moves | depth <= 4, no cycles, child limit holds, restricted implies reason key |
| TEST-PS-144-09.T04 | property | PS-144-03.R01, PS-144-03.R02, PS-144-03.R04 | random status changes with an injected clock | only declared transitions; no active to retired; retired only after 30 days deprecated and with mergedInto; terminal never reverts |
| TEST-PS-144-09.T05 | integration | PS-144-03.R03, PS-144-06.R02 | pack with one invalid category; pack with one change lacking its decision | first rejected whole and previous version active; second applied atomically with that record held |
| TEST-PS-144-09.T06 | contract | PS-144-04.R01, PS-144-04.R02, PS-144-04.R05, PS-144-09.R02 | release and apply | pack validates against classrup.governance.taxonomy_pack/v1 and its F11.S01.M01 registry row, signature verifies, changed events validate |
| TEST-PS-144-09.T07 | integration | PS-144-04.R03, PS-144-05.R03 | relay_latest by anonymous client; relay_upload by operator key and by another key | read served unchanged with receipt; upload by operator applied as hosting taxonomy with relay-local changed events; other key FORBIDDEN; relay cannot alter user mirror |
| TEST-PS-144-09.T08 | abuse | PS-144-05.R01, PS-144-05.R02 | non-publisher authors; untrusted publisher pack; tampered pack; apply called with a trust flag from sync ingestion | FORBIDDEN; pack held pending; signature failure rejects; trust unchanged |
| TEST-PS-144-09.T09 | integration | PS-144-06.R01 | replay release and apply same pack | one packCid, no duplicate events |
| TEST-PS-144-09.T10 | integration | PS-144-06.R03 | vault offline then reconnect; relay down for release | last pack in use; release prepared then transport_acknowledged only with receipt |
| TEST-PS-144-09.T11 | abuse | PS-144-07.R01, PS-144-07.R02 | scan stored data and logs; pack with 2 001 categories; pack of 1.5 MiB | no personal data beyond fingerprint; 2 001 rejected with GOVERNANCE_CATEGORY_TREE_INVALID; 1.5 MiB rejected with PAYLOAD_TOO_LARGE before storage |
| TEST-PS-144-09.T12 | load | PS-144-08.R01, PS-144-08.R02, PS-144-08.R03 | 2 000-category tree on Moto G profile; relay at 50 req/s | tree p95 <= 60 ms, apply p95 <= 800 ms, relay p95 <= 150 ms, no telemetry |
| TEST-PS-144-09.T13 | unit | PS-144-09.R01, PS-144-09.R03 | traceability tool run, seeded property replay | every PS-144 requirement maps to a passing test |
| TEST-PS-144-09.T14 | integration | PS-144-10.R01, PS-144-10.R02, PS-144-10.R03 | export, import to fresh vault, import pack with id reuse | categories round-trip with provenance; id reuse rejected |
| TEST-PS-144-09.T15 | a11y | PS-144-07.R03 | axe run on picker, settings and the pending review diff | zero serious or critical issues; keyboard tree navigation, Move to flow, Apply and Refuse work |
| TEST-PS-144-09.T16 | integration | PS-144-01.R03 | listing in a restricted category with no matching prohibited rule and no profile notice, then with a profile notice | F01.S01.M03 publish fixture allows it; with the profile only the notice is required, never a block |
| TEST-PS-144-09.T17 | abuse | PS-144-02.R04, PS-144-01.R04, PS-144-07.R03 | PK1 flips restricted on C1 without a proposal and releases to U; same flip with D1; owner refuses; owner applies | first held with GOVERNANCE_CATEGORY_PROPOSAL_REQUIRED and C1 unchanged; second held for owner review; refuse leaves C1 unchanged; apply sets the flag |
| TEST-PS-144-09.T18 | abuse | PS-144-02.R05 | PK2 pack reuses a PK1 category id; pack retires a category deprecated 10 days earlier; pack retires an active category | all rejected with GOVERNANCE_CATEGORY_TREE_INVALID |
| TEST-PS-144-09.T19 | integration | PS-144-04.R04, PS-144-02.R04 | F applies the bundled seed pack offline; U offline 45 days applies the next pack; F applies a snapshot whose restricted change was approved a year ago | seed applied with provenance bundled; both packs apply because asOf comes from anchors or the claimed release time, not the vault clock |
| TEST-PS-144-09.T20 | abuse | PS-144-07.R04 | pack signed by a revoked PK1 device key; owner pauses PK1 and a new pack arrives | revoked pack quarantined; new pack held with reason paused_publisher; applied mirror unchanged |

## Acceptance criteria

- All tests T01-T20 pass in CI.
- A pack changes a vault only after signature, publisher trust, tree validation and decision verification succeed, atomically, and restricted flips and retirements reach a user vault only after owner review.
- Category ids are never reused or shared between publishers, depth never exceeds 4, and retired categories always resolve to a merge target after at least 30 days of deprecation.

## Dependencies

Module depends on: F18.S02.M01, F16.S02.M03, F11.S01.M01, F15.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
