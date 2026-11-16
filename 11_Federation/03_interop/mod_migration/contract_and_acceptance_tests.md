# PS-090-09 — Contract and acceptance tests: Account and relay migration

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M03 Account and relay migration](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/migration` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-090-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-090-09.R02** Security tests cover stolen key, forged move, replay and veto race.
- **PS-090-09.R03** A documentation check verifies that bridge mappings exist and are labelled Future.

## Specification

See the module test table below (all processes).

**Fixtures:** Principal P with device keys K1 (signer) and K2 (veto), vault V, relays R1 (old), R2 (new), observer relay R3, fake clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-090-09.T01 | integration | PS-090-01.R01, PS-090-01.R02, PS-090-04.R01 | prepare, copy, announce, wait 24 h | status effective, moveCid verified, account.moved emitted once, did unchanged |
| TEST-PS-090-09.T02 | unit | PS-090-02.R01, PS-090-02.R03 | each rule V01–V07 violated | documented code; no state change |
| TEST-PS-090-09.T03 | abuse | PS-090-02.R01, PS-090-07.R02 | move signed by revoked key, unlisted key and key registered 1 h earlier | FEDERATION_MOVE_SIGNER_INVALID |
| TEST-PS-090-09.T04 | integration | PS-090-03.R01, PS-090-03.R02, PS-090-02.R02 | veto from K2 at 23 h 59 min and at 24 h 01 min | first cancels the move; second ignored; redirect inactive after cancel |
| TEST-PS-090-09.T05 | property | PS-090-03.R01, PS-090-03.R03 | random command sequences on one record | only declared transitions succeed; cancelled and closed never change |
| TEST-PS-090-09.T06 | integration | PS-090-03.R02, PS-090-04.R03 | observer R3 receives move before and after effectiveAt | rebinding of origin relay only after effective; F11.S01.M02 accepts records from R2 afterward |
| TEST-PS-090-09.T07 | contract | PS-090-04.R01, PS-090-04.R02, PS-090-09.R02 | each command, query and event | validate against registry schemas including statements move/v1 and move_cancel/v1 |
| TEST-PS-090-09.T08 | abuse | PS-090-05.R01, PS-090-05.R02, PS-090-05.R03 | non-owner announces; veto by the signing key itself; anonymous reads redirect | FORBIDDEN or FEDERATION_MOVE_VETO_INVALID; redirect read allowed |
| TEST-PS-090-09.T09 | integration | PS-090-06.R01, PS-090-06.R02 | replay announce; kill app during copy then resume | same moveCid; copy resumes without duplicates |
| TEST-PS-090-09.T10 | chaos | PS-090-06.R03, PS-090-06.R01 | new relay accepts 95 of 100 records | announce refused with PRECONDITION_FAILED until under 1 percent failed or explicit acceptance |
| TEST-PS-090-09.T11 | abuse | PS-090-07.R01, PS-090-07.R02, PS-090-07.R03 | inspect move statement and UI with a single device key | no private data in statement; UI states that no veto is possible |
| TEST-PS-090-09.T12 | abuse | PS-090-07.R02, PS-090-02.R02 | second move after 10 days; 4th move statement in 90 days | FEDERATION_MOVE_COOLDOWN; rate limit |
| TEST-PS-090-09.T13 | abuse | PS-090-07.R01, PS-090-03.R01 | replay of old move statement after a newer move | rejected by cid dedup and chain position; no move back |
| TEST-PS-090-09.T14 | integration | PS-090-04.R03, PS-090-07.R03 | relay move signed by pinned key, and by a different key | base URL updated on peers for the first; second FEDERATION_KEY_MISMATCH and peer suspended |
| TEST-PS-090-09.T15 | load | PS-090-08.R01, PS-090-08.R02, PS-090-08.R03 | 60 redirect lookups per minute and 1000 observed moves | p95 ≤ 150 ms, rate limit enforced, metrics exported |
| TEST-PS-090-09.T16 | manual | PS-090-09.R03, PS-090-01.R03 | review docs/federation/bridges.md | ActivityPub and AT Protocol mappings listed and each labelled Future and not implemented |
| TEST-PS-090-09.T17 | a11y | PS-090-03.R03, PS-090-01.R01 | operate wizard, countdown and veto prompt by keyboard and screen reader | steps announced, countdown text milestones announced, targets ≥ 44 px |
| TEST-PS-090-09.T18 | unit | PS-090-09.R01 | traceability tool run | every PS-090 requirement maps to a passing test |
| TEST-PS-090-09.T19 | integration | PS-090-10.R01, PS-090-10.R02, PS-090-10.R03 | export vault, import into fresh vault on R2, restore backup | records round trip; imported records re-verified; move state preserved |

## Acceptance criteria

- All tests T01–T19 pass in CI.
- A stolen-key move is cancelled by a second device key within the veto window (abuse test).
- The did and every local record are unchanged by a move.
- Bridge documents exist and are marked Future.

## Dependencies

Module depends on: F11.S01.M02, F11.S01.M03, F11.S02.M01, F11.S03.M01, F07.S02.M01, F10.S01.M04, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
