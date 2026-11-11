# PS-090-09 — Contract and acceptance tests: Account and relay migration

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M03 Account and relay migration](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/migration` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-090-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-090-09.R02** Security tests cover stolen key, backdated announcement, forged move, replay and veto race.
- **PS-090-09.R03** A documentation check verifies that bridge mappings exist and are labelled Future.

## Specification

See the module test table below (all processes).

**Fixtures:** Principal P with device keys K1 (signer, first seen 3 days ago) and K2 (veto), vault V, relays R1 (old), R2 (new), observer relay R3 and observer vault V3, sender relay S, fake clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-090-09.T01 | integration | PS-090-01.R01, PS-090-01.R02, PS-090-04.R01 | prepare, copy, announce, wait 24 h | status effective, moveCid verified, account.moved emitted once, did unchanged, statement holds only did, relay ids and times |
| TEST-PS-090-09.T02 | unit | PS-090-02.R03 | each rule V01–V08 violated | documented code; no state change |
| TEST-PS-090-09.T03 | abuse | PS-090-02.R01, PS-090-07.R02 | own announce signed by a revoked key, by an unlisted key and by a key added 1 h earlier | FEDERATION_MOVE_SIGNER_INVALID for each |
| TEST-PS-090-09.T04 | integration | PS-090-03.R01, PS-090-03.R02 | veto from K2 at 23 h 59 min and at 24 h 01 min after this receiver's first receipt | first cancels the move; second ignored; redirect inactive after cancel |
| TEST-PS-090-09.T05 | property | PS-090-03.R01, PS-090-03.R03 | random command sequences on one record | only declared transitions succeed; cancelled and closed never change |
| TEST-PS-090-09.T06 | integration | PS-090-03.R02, PS-090-04.R03 | observer R3 receives a move before and after its local effectiveAt | fetch hints and redirect switch only after effective; F11.S01.M02 accepts P's records from R2 both before and after, on signature alone |
| TEST-PS-090-09.T07 | contract | PS-090-04.R01, PS-090-04.R02, PS-090-04.R04, PS-090-09.R02 | each command, query and event | validate against registry schemas including statements move/v1 and move_cancel/v1 and their signer roles |
| TEST-PS-090-09.T08 | abuse | PS-090-05.R01, PS-090-05.R02, PS-090-05.R03 | non-owner announces; veto by the signing key itself; anonymous reads redirect | FORBIDDEN or FEDERATION_MOVE_VETO_INVALID; redirect read allowed |
| TEST-PS-090-09.T09 | integration | PS-090-06.R01, PS-090-06.R02 | replay announce; kill app during copy then resume | same moveCid; copy resumes without duplicates |
| TEST-PS-090-09.T10 | chaos | PS-090-06.R02, PS-090-06.R03 | new relay accepts 95 of 100 records; new relay goes down before effective | announce refused with PRECONDITION_FAILED until under 1 percent failed or explicit acceptance; the old relay stays the selected delivery relay and the vault is untouched |
| TEST-PS-090-09.T11 | abuse | PS-090-07.R01, PS-090-07.R02, PS-090-07.R03 | inspect move statement and UI with a single device key | no private data in statement; UI states that no veto is possible; no mailbox contents moved |
| TEST-PS-090-09.T12 | abuse | PS-090-07.R02, PS-090-02.R01 | second move after 10 days; 4th move statement in 90 days | FEDERATION_MOVE_COOLDOWN; rate limit |
| TEST-PS-090-09.T13 | abuse | PS-090-03.R01 | replay of an old move statement after a newer effective move | rejected by cid dedup and the cool-down; no move back |
| TEST-PS-090-09.T14 | integration | PS-090-02.R05, PS-090-04.R03 | relay move signed by the pinned key; relay move signed by a different key delivered by sender relay S with S's request signature | base URL updated on peers for the first; second dropped with FEDERATION_KEY_MISMATCH, counted against S only, and the named relay is not suspended |
| TEST-PS-090-09.T15 | load | PS-090-08.R01, PS-090-08.R02, PS-090-08.R03 | 60 redirect lookups per minute and 1000 observed moves | p95 ≤ 150 ms, rate limit enforced, metrics exported, veto alert above 5 in 24 h |
| TEST-PS-090-09.T16 | manual | PS-090-09.R03 | review docs/federation/bridges.md | ActivityPub and AT Protocol mappings listed and each labelled Future and not implemented |
| TEST-PS-090-09.T17 | a11y | PS-090-03.R01 | operate wizard, countdown and veto prompt by keyboard and screen reader | steps announced in order prepared, announced, effective; countdown text milestones announced; targets ≥ 44 px |
| TEST-PS-090-09.T18 | unit | PS-090-09.R01 | traceability tool run | every PS-090 requirement maps to a passing test |
| TEST-PS-090-09.T19 | integration | PS-090-10.R01, PS-090-10.R02, PS-090-10.R03 | export vault, import into fresh vault on R2, restore backup | records round trip; imported records re-verified; move state preserved |
| TEST-PS-090-09.T20 | integration | PS-090-01.R03 | move effective at E; clock advanced to E + 180 days - 1 min and to E + 180 days | redirect served at the first time; at the second the record is closed and GET /fed/v1/moved returns moved false |
| TEST-PS-090-09.T21 | integration | PS-090-02.R02 | observer V3 receives a move signed by a key not listed in P's portable document | ignored: no announced record, no account.moved, no redirect or fetch-hint change; FEDERATION_MOVE_SIGNER_INVALID recorded locally |
| TEST-PS-090-09.T22 | abuse | PS-090-02.R04 | observer V3 receives a move whose announcedAt claims 25 h ago with no old relay receipt; R1 receives the same move straight from a hosted device | V3 holds it for a full 24 h from its first receipt and a K2 veto at 23 h cancels it; R1 refuses it with VALIDATION_FAILED |
| TEST-PS-090-09.T23 | integration | PS-090-04.R04, PS-090-03.R04 | two moves for P with different targets reach V3 | federation.conflict.detect called with statementClass commitment and subjectRef move:P; both held with no redirect; a drop_all resolution cancels both |
| TEST-PS-090-09.T24 | unit | PS-090-07.R04 | export, deletion and retention ports called by F10 (plan, execute in step order, pseudonymize with a given pseudonym, twice); privacy.deletion.completed delivered alone | migration section exported; deletion plan returned; the pseudonymize step replaces the DID in retained records with exactly that pseudonym and a second run changes nothing; privacy.deletion.completed changes no record |
| TEST-PS-090-09.T25 | integration | PS-090-02.R01 | K1 revoked in a newer portable document after the move was announced but before V3's effectiveAt | the promotion re-check cancels the move; no account.moved emitted |
| TEST-PS-090-09.T26 | integration | PS-090-07.R05, PS-090-03.R01 | privacy.deletion.requested with a prepared own migration, then privacy.deletion.cancelled; a second request with an announced own move, then execution | copy and announce refused with PRIVACY_DELETION_PENDING while pending and nothing signed, cancelled or sent; after cancel copy and announce succeed; at execution the DeletionPort sign step cancels the move and signs move_cancel before the revoke_keys step |

## Acceptance criteria

- All tests T01–T26 pass in CI.
- A stolen-key move, including one with a backdated announcedAt, is cancelled by a second device key within the veto window (abuse tests T04 and T22).
- The did and every local record are unchanged by a move, and no relay becomes authoritative for the principal's records.
- Bridge documents exist and are marked Future.

## Dependencies

Module depends on: F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S02.M01, F11.S02.M03, F11.S03.M01, F07.S02.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
