# PS-015-02 — Validation rules: Two-party barter

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S01.M01 Two-party barter](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/trade_proposals/two` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-015-02.R01** Inputs are validated strictly and business rules on parties, legs, deadline, limits and duplicates run before anything is stored or signed.
- **PS-015-02.R02** A consent is valid only if it signs the exact current head hash with a registered, non-revoked device key of the party.
- **PS-015-02.R03** Incoming statements are accepted only from the two parties of the proposal; all others are quarantined with a reason code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | counterparty is a valid DID differing from the proposer, has a mailbox hint, and neither is in the other's local block list | MUTINY_PROPOSAL_LEGS_INVALID |
| V02 | exactly 2 legs, one in each direction, each with 1..5 item lines, all items distinct | MUTINY_PROPOSAL_LEGS_INVALID |
| V03 | expiresInMs is between 3600000 and 1209600000 (default 259200000) | MUTINY_PROPOSAL_DEADLINE_INVALID |
| V04 | proposer has ≤ 5 non-terminal proposals and cycles combined and is within the F12.S03.M04 local limit | MUTINY_PROPOSAL_LIMIT |
| V05 | no non-terminal proposal exists for the same pair and item-set hash | MUTINY_PROPOSAL_DUPLICATE |
| V06 | accept presents revisionHash equal to headRevisionHash | MUTINY_PROPOSAL_CONSENT_STALE |
| V07 | latest feasibility report for the head hash is fresh (≤ 10 min) and overall is not infeasible | MUTINY_PROPOSAL_INFEASIBLE |
| V08 | own items reserved all-or-nothing and reservation statement signed before the consent is signed | MUTINY_PROPOSAL_RESERVATION_FAILED |
| V09 | incoming statement signature verifies and signer is proposer or counterparty with the role the statement claims | MUTINY_PROPOSAL_STATEMENT_INVALID |
| V10 | local clock is before expiresAt and before any relay receipt time that is later than expiresAt | EXPIRED |
| V11 | reject is made by the party who is not the head author, withdraw by the head author | MUTINY_PROPOSAL_ROLE |
| V12 | acting on a terminal proposal | CONFLICT_STATE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-015-09.T02 | unit | PS-015-02.R01, PS-015-02.R02 | each rule V01..V12 violated in turn | documented error code returned and nothing stored or signed |
| TEST-PS-015-09.T04 | integration | PS-015-03.R02, PS-015-02.R02 | counter after Bob signed consent on revision 1 | revision 2 voids Bob's consent; proposal returns to draft then open after author signs |
| TEST-PS-015-09.T15 | e2e | PS-015-01.R02, PS-015-02.R03 | two mobile browsers propose and accept with 5.00 EUR compensation | UI shows prepared, relay received, acknowledged by peer truthfully; axe zero serious issues |

## Dependencies

Module depends on: F02.S01.M02, F02.S01.M03, F02.S01.M04, F02.S02.M05, F02.S03.M02, F01.S03.M01, F07.S01.M01, F07.S02.M02, F08.S02.M02, F12.S03.M04, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
