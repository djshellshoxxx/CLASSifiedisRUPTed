# PS-093-09 — Contract and acceptance tests: Moderation evidence

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M02 Moderation evidence](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/evidence` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-093-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-093-09.R02** Hash stability, canonicalization and signature checks are covered by property tests with known vectors.
- **PS-093-09.R03** Access logging and non-disclosure are covered by abuse tests.

## Specification

See the module test table below (all processes).

**Fixtures:** Vault of reporter R and relay X, author S with signed listing L (cid sha256-aa…, revision 3), moderators M1 and M2 assigned to case C, fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-093-09.T01 | unit | PS-093-01.R01, PS-093-02.R01 | capture signed listing revision 3 in a vault | snapshot stored with canonical body, SHA-256 equal to independent recomputation, signature status valid |
| TEST-PS-093-09.T02 | property | PS-093-01.R03, PS-093-03.R01 | random content objects with key order permuted | contentHash identical; mutated body fails verification |
| TEST-PS-093-09.T03 | unit | PS-093-02.R02, PS-093-02.R03 | each rule V02–V06 violated in turn | documented error code and no row stored; forged author signature refused |
| TEST-PS-093-09.T04 | integration | PS-093-01.R02, PS-093-03.R03, PS-093-04.R03 | retention end with and without legal hold | key destroyed and blobs deleted only without hold |
| TEST-PS-093-09.T05 | integration | PS-093-03.R02 | corrupt stored blob byte then verify | integrity_failed, alert raised, status final |
| TEST-PS-093-09.T06 | contract | PS-093-04.R01, PS-093-04.R02, PS-093-09.R02 | each command and query | outputs and captured event validate against registry schemas; no statement is produced by capture |
| TEST-PS-093-09.T07 | abuse | PS-093-05.R01, PS-093-05.R02, PS-093-07.R03 | member without case reads relay snapshot; unassigned moderator reads; assigned moderator reads | FORBIDDEN, FORBIDDEN, success with exactly one access row; refused reads write none |
| TEST-PS-093-09.T08 | abuse | PS-093-05.R03, PS-093-07.R01 | author reads access log of own snapshot and another's; attempt to UPDATE or DELETE an access row | own allowed, other NOT_FOUND; mutation aborts |
| TEST-PS-093-09.T09 | integration | PS-093-06.R01 | same Idempotency-Key replayed; two captures of identical content | original response replayed; one blob and two snapshot rows |
| TEST-PS-093-09.T10 | chaos | PS-093-06.R02, PS-093-06.R03 | blob store fails mid-capture; tab closed between key destruction and blob deletion | no orphan row; purge resumes and completes |
| TEST-PS-093-09.T11 | abuse | PS-093-07.R02 | author deletes own record after report | snapshot retained until RET-EVIDENCE end; UI states that copies cannot be recalled |
| TEST-PS-093-09.T12 | load | PS-093-08.R01, PS-093-08.R02, PS-093-08.R03 | 50 captures per second for 5 minutes on a relay with 256 KiB bodies; vault capture on Moto G profile | relay p95 ≤ 300 ms, vault p95 ≤ 150 ms, metrics exported, sweep of 10 000 snapshots ≤ 120 s |
| TEST-PS-093-09.T13 | unit | PS-093-09.R01, PS-093-09.R03 | traceability tool run | every PS-093 requirement maps to a passing test |
| TEST-PS-093-09.T14 | integration | PS-093-10.R01, PS-093-10.R02, PS-093-10.R03 | export evidence bundle for a case, import into fresh store, restore backup | hashes verify after round trip; import without keys marks bodies unreadable |

## Acceptance criteria

- All tests T01–T14 pass in CI.
- Every read of a snapshot body produces exactly one access row (property and abuse tests).
- A modified snapshot body, media or author signature is always detected by verification.

## Dependencies

Module depends on: F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
