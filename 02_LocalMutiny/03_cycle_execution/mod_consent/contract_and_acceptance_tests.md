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

**Fixtures:** Vaults Alice, Bob, Carol, Dan and Erin..Hal; cycles C2 (proposal origin), C3, C4, C8; keys and a revoked key for Dan; F08 statement key registry with consent.mutiny.cycle.commit.v1 and consent.mutiny.proposal.accept.v1; fake relay with controllable delay that records every mailbox put; per-vault clocks starting 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-021-09.T01 | integration | PS-021-01.R01, PS-021-03.R01, PS-021-04.R03 | 3-party happy path across three vaults | each vault commits after verifying 3 consents and 3 reservations; committed event carries executionDeadline and parties |
| TEST-PS-021-09.T02 | integration | PS-021-01.R01, PS-021-03.R01, PS-021-03.R05 | 2-party accepted proposal opens cycle | Cycle id equals proposal id; both mutiny_proposal consents re-verified on the same contentHash (V07 exception, V17) and both vaults commit |
| TEST-PS-021-09.T03 | unit | PS-021-02.R01, PS-021-02.R03 | each rule V01..V17 violated in turn | documented error code returned, nothing signed |
| TEST-PS-021-09.T04 | property | PS-021-03.R01, PS-021-03.R02, PS-021-09.R03 | random interleavings, drops and duplicates of consents, revocations, locks and revisions | committed only with all valid consents on the head number and hash and all reservations; terminal states immutable |
| TEST-PS-021-09.T05 | integration | PS-021-03.R02, PS-021-04.R02, PS-021-01.R03 | coordinator revises after two consents | all consents void, reservations superseded, only the coordinator can revise, participant change refused |
| TEST-PS-021-09.T06 | integration | PS-021-01.R04, PS-021-03.R04 | 4-party with Dan's consent arriving after deadline on Alice's clock | no commit at Alice's vault, cycle expires, reservations released, disagreement counted expired |
| TEST-PS-021-09.T07 | integration | PS-021-02.R02, PS-021-05.R02 | consent signed by revoked key, wrong subject, wrong subjectType, wrong statement key, wrong number, wrong hash, wrong signer | not accepted by F08 or not counted here with MUTINY_CONSENT_STATEMENT_INVALID or STALE |
| TEST-PS-021-09.T08 | integration | PS-021-03.R03, PS-021-06.R03, PS-021-07.R06 | equivocation: coordinator sends revision 2 with digest H2a to Bob and H2b to Carol; Carol's correctly signed consent on revision 2 with H2b reaches Bob's vault whose head is H2a | V14: both hashes stored, mutiny.revision.report_fork called, mutiny.revision.forked emitted, cycle frozen, no consent counted |
| TEST-PS-021-09.T09 | integration | PS-021-03.R03, PS-021-06.R03 | conflicting reservation for one item in two cycles seen by one vault | mutiny.lock.conflict_detected, both cycles frozen, renegotiation requires new cycle |
| TEST-PS-021-09.T10 | contract | PS-021-04.R01, PS-021-04.R04, PS-021-09.R02, PS-021-09.R04 | all commands and evaluate | outputs and events validate against classrup.mutiny.cycle/v1, cycle_consent/v1 and the registry; no cycle envelope is ingested or sent; sync states advance only when acknowledged |
| TEST-PS-021-09.T11 | abuse | PS-021-05.R01, PS-021-05.R02, PS-021-05.R03 | other principal consents; forged statements; relay tries to inject committed; decline from a non-participant | FORBIDDEN or not accepted by the owners; verdict unaffected |
| TEST-PS-021-09.T12 | integration | PS-021-06.R01, PS-021-06.R02, PS-021-06.R04 | replay commands; crash mid-transaction; out-of-order and duplicate delivery | one consent per participant; no partial record; verdict converges |
| TEST-PS-021-09.T13 | chaos | PS-021-06.R04, PS-021-06.R03 | relay down 30 min during consent window | statements delivered afterwards, UI never shows peer_accepted before acknowledgement |
| TEST-PS-021-09.T14 | abuse | PS-021-07.R03 | 11 proposals from one DID in 24 h; 6th open cycle at one proposer; 4 incoming cycles from coordinators with no history from different senders | quarantine, MUTINY_CYCLE_LIMIT, fourth quarantined silently |
| TEST-PS-021-09.T15 | integration | PS-021-07.R02, PS-021-07.R05 | participant erases identity; others export evidence; F10 export and retention sweep | section mutiny.cycles exported; records retained and pseudonymized; signatures still verify; quarantined incoming cycles purged after 30 days |
| TEST-PS-021-09.T16 | e2e | PS-021-07.R04, PS-021-01.R04 | mobile 3-party consent flow | disclosure that pseudonymity is not anonymity shown; consent statement text before Sign; trust panel shown; axe zero serious issues |
| TEST-PS-021-09.T17 | load | PS-021-08.R02, PS-021-08.R03 | 8-participant propose, consent, evaluate on emulated Moto G | within p95 budgets |
| TEST-PS-021-09.T18 | unit | PS-021-08.R01, PS-021-09.R01 | diagnostics and traceability tool | no identifiers in diagnostics; every PS-021 requirement maps to a passing test |
| TEST-PS-021-09.T19 | integration | PS-021-03.R02, PS-021-01.R02 | participant declines (F08 kind decline) after consent; others not yet committed and already committed | declined at uncommitted vaults with own reservation released; committed vaults hand over to dropout handling |
| TEST-PS-021-09.T20 | integration | PS-021-10.R01, PS-021-10.R02, PS-021-10.R03 | export, import into fresh vault, schema rollback | cycles and consents round-trip with signatures verified; open cycles import as frozen |
| TEST-PS-021-09.T21 | integration | PS-021-03.R02, PS-021-02.R03, PS-021-01.R02 | 4-party: Bob revokes his consent through F08 before Dan's last consent arrives at Alice's vault | Bob's consent void with consent_revoked; comms.consent.verify inside the evaluating transaction returns revoked; Alice's vault never commits |
| TEST-PS-021-09.T22 | integration | PS-021-07.R01, PS-021-01.R03 | relay fixture records every mailbox put during propose, consent and decline | mailbox contents are ciphertext only and metadata is limited to recipient mailbox id, size and time |
| TEST-PS-021-09.T23 | contract | PS-021-04.R05, PS-021-02.R02 | F11.S01.M01 registry lookup and comms.consent.sign payload | registered signer roles match; consent uses subjectType mutiny_cycle, key consent.mutiny.cycle.commit.v1, subjectRevision equal to the head number and hex digest equal to the base64url-decoded contentHash; declines are kind decline |
| TEST-PS-021-09.T24 | integration | PS-021-03.R05, PS-021-03.R02 | opening from an accepted proposal whose imported consent no longer verifies; opening whose consent deadline passes on the local clock | opening -> frozen with import_verification_failed and own reservation released; opening -> cancelled |
| TEST-PS-021-09.T25 | unit | PS-021-02.R04, PS-021-04.R06 | principal with 2 other open cycles consents to a 4-party cycle; with 1 other open cycle | MUTINY_PARTICIPANT_OVERLOADED only in the principal's own vault and no count in any statement or event; second consent allowed; declined event carries participantIds |
| TEST-PS-021-09.T26 | abuse | PS-021-07.R06, PS-021-02.R04 | 2-Sybil ring: two fresh did:key identities sharing a device key invite a real member into a 3-party cycle | trust panel shows first seen 0 days and 0 completed trades, key-linked warning, consent requires confirmation, simultaneous handover recommended; quarantined when the unknown-coordinator cap is reached |
| TEST-PS-021-09.T27 | integration | PS-021-02.R03, PS-021-02.R02 | Carol's consent sits above tolerance without an acceptedImbalances entry, then the coordinator revises with acceptedImbalances naming Carol and Carol consents | first not committable (C05 fails); after the revision every vault verifies Carol's consent on the new digest as her signed acceptance and commits |

## Acceptance criteria

- All tests T01–T27 pass in CI.
- A cycle is committed in a vault only when every participant's valid signed consent on the head number and hash and every giver's valid unexpired reservation statement were verified in that vault before the deadline on its own clock.
- No code path adds, removes or replaces a participant of an existing cycle, and forks, equivocation or conflicting promises always freeze rather than merge.

## Dependencies

Module depends on: F02.S03.M02, F02.S02.M03, F02.S02.M05, F02.S01.M02, F02.S01.M03, F02.S01.M04, F02.S04.M02, F08.S02.M02, F07.S01.M01, F07.S02.M02, F07.S03.M01, F12.S03.M04, F16.S02.M03, F15.S01.M01, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
