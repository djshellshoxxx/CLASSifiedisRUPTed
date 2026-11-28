# PS-093-09 — Contract and acceptance tests: Moderation evidence

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M02 Moderation evidence](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/evidence` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-093-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-093-09.R02** Hash stability, canonicalization and signature checks are covered by property tests with known vectors.
- **PS-093-09.R03** Access logging and non-disclosure are covered by abuse tests.

## Specification

See the module test table below (all processes).

**Fixtures:** Vault of reporter R and relay X, author S with signed listing L (cid sha256-aa…, revision 3, 10 P0 photos of 5 MiB) and end-to-end message M with an L3 location share, a geohash u4pruydqqvj, an email, a phone number and one attachment, moderators M1 and M2 assigned to case C, injectable clock starting 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-093-09.T01 | unit | PS-093-01.R01, PS-093-02.R01 | capture signed listing revision 3 in a vault | snapshot stored with canonical body, SHA-256 equal to independent recomputation, signature status valid, disclosure public_target |
| TEST-PS-093-09.T02 | property | PS-093-01.R03, PS-093-03.R01, PS-093-09.R02 | random content objects with key order permuted and known vectors; random sequences of verify, purge and disclosure steps | contentHash identical; mutated body fails verification; only declared transitions succeed; fields other than integrity, lifecycle and legalHold never change |
| TEST-PS-093-09.T03 | unit | PS-093-02.R02, PS-093-02.R03 | each rule V02–V08 violated in turn | documented error code and no row stored; forged author signature refused |
| TEST-PS-093-09.T04 | integration | PS-093-01.R02, PS-093-03.R03, PS-093-04.R03 | RetentionPurgePort run at RET-EVIDENCE end with and without a relay legal hold | privacy.legal_hold.check called per snapshot; key destroyed and blob deleted only without hold; no purge happens on a privacy.retention.purged event |
| TEST-PS-093-09.T05 | integration | PS-093-03.R02 | corrupt a stored blob byte, verify, then reach retention end | integrity failed, alert raised, never returns to verified; the failed snapshot is purged and its blob shredded at retention end |
| TEST-PS-093-09.T06 | contract | PS-093-04.R01, PS-093-04.R02 | each command and query | outputs and captured event validate against registry schemas; capture produces no statement |
| TEST-PS-093-09.T07 | abuse | PS-093-05.R01, PS-093-05.R02, PS-093-07.R03, PS-093-09.R03 | member without case reads relay snapshot; unassigned moderator reads; assigned moderator reads | FORBIDDEN, FORBIDDEN, success with exactly one access row; refused reads write none |
| TEST-PS-093-09.T08 | abuse | PS-093-05.R02, PS-093-07.R05, PS-093-09.R03 | author reads access log of own snapshot and of another's; attempt to UPDATE or DELETE an access row | own shows purpose, role and time only, accessor redacted, reporter rows excluded; other NOT_FOUND; mutation aborts |
| TEST-PS-093-09.T09 | integration | PS-093-06.R01, PS-093-01.R04 | same Idempotency-Key replayed; two captures of identical content | original response replayed; one EvidenceBlob with refCount 2 and two snapshot rows |
| TEST-PS-093-09.T10 | chaos | PS-093-06.R02, PS-093-06.R03 | blob store fails mid-capture; tab closed between key destruction and blob deletion | no orphan row; purge resumes and completes |
| TEST-PS-093-09.T11 | abuse | PS-093-07.R02 | author deletes own record after report | snapshot retained until RET-EVIDENCE end; UI states that copies cannot be recalled |
| TEST-PS-093-09.T12 | load | PS-093-08.R01, PS-093-08.R02, PS-093-08.R03 | 50 captures per second for 5 minutes on a relay with 256 KiB bodies; vault capture on Moto G profile | relay p95 ≤ 300 ms, vault p95 ≤ 150 ms, metrics exported, sweep of 10 000 snapshots ≤ 120 s |
| TEST-PS-093-09.T13 | unit | PS-093-09.R01 | traceability tool run | every PS-093 requirement maps to a passing test |
| TEST-PS-093-09.T14 | integration | PS-093-10.R01, PS-093-10.R02, PS-093-10.R03 | export evidence bundle for a case, import into fresh store, restore backup | hashes verify after round trip; import without keys marks bodies unreadable |
| TEST-PS-093-09.T15 | abuse | PS-093-05.R03, PS-093-07.R03 | verify, export and purge one snapshot each | exactly one access row per action with action verify, export and purge |
| TEST-PS-093-09.T16 | integration | PS-093-01.R04, PS-093-03.R03, PS-093-07.R02 | two snapshots share one blob, one under relay legal hold, both past retention | unheld snapshot purged and refCount drops to 1; blob key survives; after hold release and the next run the blob key is destroyed and the blob deleted |
| TEST-PS-093-09.T17 | integration | PS-093-02.R02, PS-093-04.R04 | report listing L with 10 photos of 5 MiB and a message with 2 P2 photos; relay ingests both bundles | listing reportable with 10 blob:sha256 references and no copies; P2 photos copied into evidence blobs; relay re-verifies hashes and resolves P0 media by reference |
| TEST-PS-093-09.T18 | unit | PS-093-02.R04, PS-093-03.R04 | disclosure preview of message M; approve with a stale digest; approve with the latest digest | each item redacted by its redact/1 rule and counted; PRECONDITION_FAILED; export_prepared with disclosure participant_disclosure |
| TEST-PS-093-09.T19 | abuse | PS-093-07.R01, PS-093-07.R04 | report message M without disclosure and inspect the relay copy and moderator view | relay holds only targetCid, sender key, sender signature and reason; no plaintext; label 'metadata only' shown |
| TEST-PS-093-09.T20 | integration | PS-093-07.R06 | ExportSectionPort run, then privacy.deletion.completed in the vault with keepEvidence true and false | export section moderation.evidence produced; evidence purged or pseudonymized as documented |
| TEST-PS-093-09.T21 | integration | PS-093-04.R03 | privacy.legal_hold.placed then released on a relay | snapshots of the held author flagged after privacy.legal_hold.check; flag cleared on release; purge only afterwards |
| TEST-PS-093-09.T22 | abuse | PS-093-07.R01, PS-093-07.R04 | F12 privacy suite after captures, ingests, disclosures and purges in a vault and on a relay: scan federation payloads, public projections, relay and vault logs, events and notification payloads | no snapshot body, media reference of a P2 item, accessorId or redacted value appears in any of them; events carry only ids, hashes and enums |
| TEST-PS-093-09.T23 | unit | PS-093-01.R05, PS-093-02.R05 | approve an unredacted disclosure of message M with its K, with a wrong K, and a redacted disclosure with K; relay ingests the first bundle and a bundle whose disclosed text was altered | first stored with messageKey and commitmentStatus verified; MODERATION_EVIDENCE_COMMITMENT_MISMATCH for the wrong K, the redacted disclosure and the altered text; metadata of every message snapshot holds messageCid and the signed envelope without wrapped keys |

## Acceptance criteria

- All tests T01–T23 pass in CI.
- Every read, verify, export and purge of a snapshot produces exactly one access row (property and abuse tests).
- A modified snapshot body, media or author signature is always detected by verification, and no P2 plaintext reaches a relay without an approved disclosure.

## Dependencies

Module depends on: F15.S02.M03, F16.S01.M01, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
