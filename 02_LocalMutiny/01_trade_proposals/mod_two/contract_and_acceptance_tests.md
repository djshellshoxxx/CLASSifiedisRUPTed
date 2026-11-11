# PS-015-09 — Contract and acceptance tests: Two-party barter

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S01.M01 Two-party barter](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/trade_proposals/two` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-015-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-015-09.R02** Contract tests verify the withdrawal statement schema, the F08 consent fields this module relies on (subjectType, statement key, hex digest), the reservation holder and the sync-state progression against fake relays.
- **PS-015-09.R03** The two-vault flow is tested end to end with two in-memory vaults, a fake relay and an injected clock, including forks and clock disagreement.

## Specification

See the module test table below (all processes).

**Fixtures:** Two in-memory vaults Alice and Bob with keys, items (Alice guitar I1, Bob bicycle I2), a fake relay that can drop, delay and duplicate, fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-015-09.T01 | integration | PS-015-01.R01, PS-015-01.R03, PS-015-03.R01 | Alice creates, Bob accepts, statements delivered | both vaults reach accepted after receiving the other's consent and reservation; acceptance event carries both statement ids |
| TEST-PS-015-09.T02 | unit | PS-015-02.R01, PS-015-02.R02 | each rule V01..V15 violated in turn | documented error code returned and nothing stored or signed |
| TEST-PS-015-09.T03 | property | PS-015-03.R01, PS-015-03.R03 | random interleavings of counters, accepts, rejects, drops and duplicates | accepted only with both valid consents on the head hash; terminal states never change |
| TEST-PS-015-09.T04 | integration | PS-015-03.R02, PS-015-02.R02 | counter after Bob signed consent on revision 1 | revision 2 voids Bob's consent; proposal returns to draft then open after author signs |
| TEST-PS-015-09.T05 | integration | PS-015-03.R03, PS-015-06.R03 | both parties counter revision 3 offline | fork detected in both vaults, proposal frozen, reservations released, no consent counted |
| TEST-PS-015-09.T06 | integration | PS-015-03.R04, PS-015-01.R03 | Bob's deadline passes while Alice's has not, and relay receipt time later than deadline | each vault expires on its own clock; a later relay receipt makes the consent late and the proposal expires with clock_disagreement |
| TEST-PS-015-09.T07 | contract | PS-015-04.R01, PS-015-04.R02, PS-015-09.R02, PS-015-09.R03 | all commands | outputs, events and statements validate against registry schemas; syncState moves through prepared, transport_acknowledged, peer_accepted only as acknowledged |
| TEST-PS-015-09.T08 | integration | PS-015-04.R03, PS-015-06.R04 | revision, consent, reservation arrive out of order and duplicated | verdict re-evaluated after each, duplicates skipped, state converges |
| TEST-PS-015-09.T09 | abuse | PS-015-05.R01, PS-015-05.R02, PS-015-05.R03, PS-015-02.R03 | other principal calls commands; withdrawal signed by non-party or by the non-author; statement from relay not by party; withdrawal from a DID the recipient blocked | FORBIDDEN or quarantine; blocked sender dropped silently; relay cannot read plaintext |
| TEST-PS-015-09.T10 | integration | PS-015-06.R01, PS-015-06.R02 | replay commands with same key; crash between reservation and consent signing | stored response replayed; no leaked reservation |
| TEST-PS-015-09.T11 | abuse | PS-015-07.R03 | 11 proposals from one DID in 24 h; blocked sender; 6th open proposal at proposer | quarantine, silent hide, MUTINY_PROPOSAL_LIMIT |
| TEST-PS-015-09.T12 | abuse | PS-015-07.R02 | proposer erases identity, counterparty exports evidence | evidence retained and pseudonymized; signatures still verify |
| TEST-PS-015-09.T13 | load | PS-015-08.R02, PS-015-08.R03 | 200 proposals list and 100 creates on emulated Moto G | p95 within budgets |
| TEST-PS-015-09.T14 | unit | PS-015-08.R01, PS-015-09.R01 | diagnostics and traceability tool | no identifiers in diagnostics; every PS-015 requirement maps to a passing test |
| TEST-PS-015-09.T15 | e2e | PS-015-04.R02, PS-015-06.R04 | two mobile browsers propose and accept with 5.00 EUR compensation | UI shows prepared, relay received, acknowledged by peer truthfully; axe zero serious issues |
| TEST-PS-015-09.T16 | chaos | PS-015-06.R04, PS-015-03.R01 | relay down for 30 min then up | outbox delivers, no state ever claims peer acknowledgement before it arrives |
| TEST-PS-015-09.T17 | integration | PS-015-10.R01, PS-015-10.R02, PS-015-10.R03 | export, import into fresh vault, rollback | proposals round-trip with statements verified; open proposals import frozen |
| TEST-PS-015-09.T18 | integration | PS-015-07.R01, PS-015-01.R02 | relay fixture records every mailbox put during create, accept, counter and withdraw | mailbox contents are ciphertext only and metadata is limited to recipient mailbox id, size and time |
| TEST-PS-015-09.T19 | integration | PS-015-03.R01, PS-015-02.R02, PS-015-04.R04 | Bob revokes his consent through F08 before Alice's vault receives his reservation | consent void with consent_revoked; comms.consent.verify inside the accepting transaction returns revoked; Alice's vault never reaches accepted |
| TEST-PS-015-09.T20 | integration | PS-015-03.R03, PS-015-04.R01 | Alice withdraws; her signed withdrawal reaches Bob's vault | Bob's proposal moves to withdrawn, mutiny.proposal.withdrawn emitted with both party DIDs, Bob's own reservation released in the same transaction |
| TEST-PS-015-09.T21 | integration | PS-015-06.R03, PS-015-04.R03 | Bob counters (own lock superseded); a peer double promise names the proposal | counter does not withdraw the proposal; conflict_detected freezes it and own reservation is released with fork_frozen |
| TEST-PS-015-09.T22 | unit | PS-015-02.R02, PS-015-02.R03 | V01 with the principal's own block, and a proposal sent to a recipient who blocked the proposer | BLOCKED_PARTY for the own block; recipient vault drops the proposal silently and emits nothing |
| TEST-PS-015-09.T23 | integration | PS-015-07.R04, PS-015-07.R02 | F10 export, deletion and retention sweep with a pseudonymized erased counterparty | section mutiny.proposals exported; erased DID replaced by the deletion pseudonym; signatures still verify; quarantined statements purged after 30 days |
| TEST-PS-015-09.T24 | contract | PS-015-04.R04 | F11.S01.M01 registry lookup for each statement schema named here | registered signer role matches; consent uses subjectType mutiny_proposal and key consent.mutiny.proposal.accept.v1 with hex digest equal to the base64url-decoded contentHash |
| TEST-PS-015-09.T25 | integration | PS-015-03.R02, PS-015-02.R02 | Bob tries to accept an imbalance not in the head snapshot, then counters with acceptedImbalances naming himself | first refused; Alice's vault verifies Bob's consent on the new digest as his signed acceptance and feasibility C05 passes |

## Acceptance criteria

- All tests T01–T25 pass in CI.
- A party is never shown as bound to a revision unless a valid signature on that exact hash was verified in the viewing vault.
- Forks and clock disagreement always end in frozen or expired, never in acceptance.

## Dependencies

Module depends on: F02.S01.M02, F02.S01.M03, F02.S01.M04, F02.S02.M05, F02.S03.M02, F01.S03.M01, F07.S01.M01, F07.S02.M02, F08.S02.M02, F12.S03.M04, F16.S02.M03, F15.S01.M01, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
