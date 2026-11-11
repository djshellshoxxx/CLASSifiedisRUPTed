# PS-015-02 — Validation rules: Two-party barter

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S01.M01 Two-party barter](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/trade_proposals/two` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-015-02.R01** Inputs are validated strictly and business rules on parties, legs, deadline, limits and duplicates run before anything is stored or signed.
- **PS-015-02.R02** A consent is valid only if it signs the exact current head digest and revision number under subjectType mutiny_proposal and statement key consent.mutiny.proposal.accept.v1 with a registered, non-revoked device key of the party, and comms.consent.verify reports it valid.
- **PS-015-02.R03** Incoming statements count only when signed by one of the two parties with the signer role the F11.S01.M01 registry requires; statements from DIDs the recipient blocked are dropped silently (N7) and all others are quarantined with a reason code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | counterparty is not in the principal's own block list (F07.S02.M02 isBlockedEither on the local list); the counterparty's private blocks are never checked here, the recipient vault silently drops proposals from DIDs it blocked (N7) | BLOCKED_PARTY |
| V02 | exactly 2 legs, one in each direction, each with 1..5 item lines, all items distinct | MUTINY_PROPOSAL_LEGS_INVALID |
| V03 | expiresInMs is between 3600000 and 1209600000 (default 259200000); with more than one currency it is ≤ 86400000 and the deadline is not after the earliest pinned quote expiry (N16), otherwise re-quote and fresh consent; expiresInMs + executionWindowMs ≤ 2592000000 (F02.S01.M04 V09) | MUTINY_PROPOSAL_DEADLINE_INVALID |
| V04 | proposer has ≤ 5 non-terminal proposals and cycles combined and is within the F12.S03.M04 local limit | MUTINY_PROPOSAL_LIMIT |
| V05 | no non-terminal proposal exists for the same pair and item-set hash | MUTINY_PROPOSAL_DUPLICATE |
| V06 | accept presents revisionHash equal to headRevisionHash and revisionNo equal to headRevisionNo; a counted consent has subjectType mutiny_proposal, statementKey consent.mutiny.proposal.accept.v1, subjectRevision equal to headRevisionNo and subjectRevisionHash equal to the hex of headRevisionHash | MUTINY_PROPOSAL_CONSENT_STALE |
| V07 | latest feasibility report for the head hash is fresh (≤ 10 min) and overall is not infeasible | MUTINY_PROPOSAL_INFEASIBLE |
| V08 | own items reserved all-or-nothing through F02.S03.M02 with holder {type: cycle, id: proposalId} and the classrup.bazaar.reservation/v1 statement issued before the consent is signed | MUTINY_PROPOSAL_RESERVATION_FAILED |
| V09 | an incoming classrup.mutiny.proposal_response/v1 withdraw verifies Ed25519 against a non-revoked key of the head author, the role registered in F11.S01.M01; revisions, consents and reservations are verified by their ingest owners and only their accepted records count | MUTINY_PROPOSAL_STATEMENT_INVALID |
| V10 | local now < expiresAt and every relayReceiptAt of a counted statement ≤ expiresAt; a relay time can only shorten the window, a later relay receipt makes the statement late and the proposal expires with reason clock_disagreement | EXPIRED |
| V11 | reject is made by the party who is not the head author, withdraw by the head author | MUTINY_PROPOSAL_ROLE |
| V12 | acting on a terminal proposal | CONFLICT_STATE |
| V13 | counterparty is a valid did:key differing from the proposer and has a verified mailbox hint from its signed projection | MUTINY_PROPOSAL_LEGS_INVALID |
| V14 | inside the accepting transaction comms.consent.verify returns valid for both parties on the head digest; revoked or stale consents are void and conflicted freezes the proposal | MUTINY_PROPOSAL_CONSENT_STALE |
| V15 | an accepted imbalance counts only as an acceptedImbalances entry of the head snapshot naming the principal, signed by the principal's consent on that digest; an unsigned acceptance at accept time is refused and the principal counters instead | MUTINY_PROPOSAL_CONSENT_STALE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-015-09.T02 | unit | PS-015-02.R01, PS-015-02.R02 | each rule V01..V15 violated in turn | documented error code returned and nothing stored or signed |
| TEST-PS-015-09.T04 | integration | PS-015-03.R02, PS-015-02.R02 | counter after Bob signed consent on revision 1 | revision 2 voids Bob's consent; proposal returns to draft then open after author signs |
| TEST-PS-015-09.T09 | abuse | PS-015-05.R01, PS-015-05.R02, PS-015-05.R03, PS-015-02.R03 | other principal calls commands; withdrawal signed by non-party or by the non-author; statement from relay not by party; withdrawal from a DID the recipient blocked | FORBIDDEN or quarantine; blocked sender dropped silently; relay cannot read plaintext |
| TEST-PS-015-09.T19 | integration | PS-015-03.R01, PS-015-02.R02, PS-015-04.R04 | Bob revokes his consent through F08 before Alice's vault receives his reservation | consent void with consent_revoked; comms.consent.verify inside the accepting transaction returns revoked; Alice's vault never reaches accepted |
| TEST-PS-015-09.T22 | unit | PS-015-02.R02, PS-015-02.R03 | V01 with the principal's own block, and a proposal sent to a recipient who blocked the proposer | BLOCKED_PARTY for the own block; recipient vault drops the proposal silently and emits nothing |
| TEST-PS-015-09.T25 | integration | PS-015-03.R02, PS-015-02.R02 | Bob tries to accept an imbalance not in the head snapshot, then counters with acceptedImbalances naming himself | first refused; Alice's vault verifies Bob's consent on the new digest as his signed acceptance and feasibility C05 passes |

## Dependencies

Module depends on: F02.S01.M02, F02.S01.M03, F02.S01.M04, F02.S02.M05, F02.S03.M02, F01.S03.M01, F07.S01.M01, F07.S02.M02, F08.S02.M02, F12.S03.M04, F16.S02.M03, F15.S01.M01, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
