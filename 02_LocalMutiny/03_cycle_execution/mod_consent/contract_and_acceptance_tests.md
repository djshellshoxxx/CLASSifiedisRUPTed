# PS-021-09 — Contract and acceptance tests: Cycle consent

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M01 Cycle consent](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/consent` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-021-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-021-09.R02** Multi-vault tests use in-memory vaults with a fake relay that drops, delays, duplicates and reorders, and an injected clock per vault.
- **PS-021-09.R03** Property tests show commit is impossible without every consent and reservation on the head hash, and that revisions void consents.
- **PS-021-09.R04** Fixtures cover explicit 2-, 3-, 4- and 8-party cycles.

## Specification

See the module test table below (all processes).

**Fixtures:** Vaults Alice, Bob, Carol, Dan and Erin..Hal; cycles C2 (proposal origin), C3, C4, C8; keys and a revoked key for Dan; fake relay with controllable delay; per-vault clocks starting 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-021-09.T01 | integration | PS-021-01.R01, PS-021-03.R01, PS-021-04.R03 | 3-party happy path across three vaults | each vault commits after verifying 3 consents and 3 reservations; committed event carries executionDeadline |
| TEST-PS-021-09.T02 | integration | PS-021-01.R01, PS-021-03.R01 | 2-party accepted proposal opens cycle as committed | Cycle id equals proposal id and both vaults commit with imported consents re-verified |
| TEST-PS-021-09.T03 | unit | PS-021-02.R01, PS-021-02.R03 | each rule V01..V12 violated in turn | documented error code returned, nothing signed |
| TEST-PS-021-09.T04 | property | PS-021-03.R01, PS-021-03.R02, PS-021-09.R03 | random interleavings, drops and duplicates of consents, locks, revisions | committed only with all valid consents and reservations on the head hash; terminal states immutable |
| TEST-PS-021-09.T05 | integration | PS-021-03.R02, PS-021-04.R02, PS-021-01.R03 | coordinator revises after two consents | all consents void, reservations superseded, only the coordinator can revise, participant change refused |
| TEST-PS-021-09.T06 | integration | PS-021-01.R04, PS-021-03.R04, PS-021-07.R04 | 4-party with Dan's consent arriving after deadline on Alice's clock | no commit at Alice's vault, cycle expires, reservations released, disagreement counted expired |
| TEST-PS-021-09.T07 | integration | PS-021-02.R02, PS-021-05.R02 | consent signed by revoked key, wrong subject, wrong hash, wrong signer | quarantined with MUTINY_CONSENT_STATEMENT_INVALID or STALE; not counted |
| TEST-PS-021-09.T08 | integration | PS-021-03.R03, PS-021-06.R03 | fork: coordinator sends two different revision 2 to different participants | cids compared, mutiny.revision.forked, both vaults freeze, no consent counted |
| TEST-PS-021-09.T09 | integration | PS-021-03.R03, PS-021-06.R03 | conflicting reservation for one item in two cycles seen by one vault | mutiny.lock.conflict_detected, both cycles frozen, renegotiation requires new cycle |
| TEST-PS-021-09.T10 | contract | PS-021-04.R01, PS-021-04.R04, PS-021-09.R02, PS-021-09.R04 | all commands and ingest | outputs, events and statements validate against classrup.mutiny.cycle/v1, cycle_consent/v1, cycle_decline/v1, and registry; sync states advance only when acknowledged |
| TEST-PS-021-09.T11 | abuse | PS-021-05.R01, PS-021-05.R02, PS-021-05.R03 | other principal consents; forged statements; relay tries to inject committed | FORBIDDEN or quarantine; verdict unaffected |
| TEST-PS-021-09.T12 | integration | PS-021-06.R01, PS-021-06.R02, PS-021-06.R04 | replay commands; crash mid-transaction; out-of-order and duplicate delivery | one consent per participant; no partial record; verdict converges |
| TEST-PS-021-09.T13 | chaos | PS-021-06.R04, PS-021-06.R03 | relay down 30 min during consent window | statements delivered afterwards, UI never shows peer_accepted before acknowledgement |
| TEST-PS-021-09.T14 | abuse | PS-021-07.R03, PS-021-07.R01 | 11 proposals from one DID in 24 h; 6th open cycle at one proposer | quarantine and MUTINY_CYCLE_LIMIT |
| TEST-PS-021-09.T15 | abuse | PS-021-07.R02 | participant erases identity; others export evidence | records retained and pseudonymized; signatures still verify |
| TEST-PS-021-09.T16 | e2e | PS-021-07.R04, PS-021-01.R04 | mobile 3-party consent flow | disclosure that pseudonymity is not anonymity shown; consent statement text before Sign; axe zero serious issues |
| TEST-PS-021-09.T17 | load | PS-021-08.R02, PS-021-08.R03 | 8-participant propose, consent, ingest on emulated Moto G | within p95 budgets |
| TEST-PS-021-09.T18 | unit | PS-021-08.R01, PS-021-09.R01 | diagnostics and traceability tool | no identifiers in diagnostics; every PS-021 requirement maps to a passing test |
| TEST-PS-021-09.T19 | integration | PS-021-03.R02, PS-021-01.R02 | participant declines after consent; others not yet committed and already committed | declined at uncommitted vaults; committed vaults hand over to dropout handling |
| TEST-PS-021-09.T20 | integration | PS-021-10.R01, PS-021-10.R02, PS-021-10.R03 | export, import into fresh vault, schema rollback | cycles and consents round-trip with signatures verified; open cycles import as frozen |

## Acceptance criteria

- All tests T01–T20 pass in CI.
- A cycle is committed in a vault only when every participant's valid signed consent on the head hash and every giver's valid unexpired reservation statement were verified in that vault before the deadline on its own clock.
- No code path adds, removes or replaces a participant of an existing cycle, and forks or conflicting promises always freeze rather than merge.

## Dependencies

Module depends on: F02.S03.M02, F02.S02.M03, F02.S02.M05, F02.S01.M02, F02.S01.M03, F02.S01.M04, F02.S04.M02, F08.S02.M02, F07.S01.M01, F12.S03.M04, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
