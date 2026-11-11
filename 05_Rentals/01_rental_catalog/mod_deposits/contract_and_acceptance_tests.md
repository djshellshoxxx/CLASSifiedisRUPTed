# PS-040-09 — Contract and acceptance tests: Rental deposits (noncustodial)

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S01.M02 Rental deposits (noncustodial)](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_catalog/deposits` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-040-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-040-09.R02** Money and proof rules are covered by property tests with a reference model for amounts, partial forfeits and release remainders.
- **PS-040-09.R03** Two-vault tests with a hostile in-memory relay cover duplicate, dropped, reordered and contradictory statements.

## Specification

See the module test table below (all processes).

**Fixtures:** Two vaults - owner O and renter R - with confirmed reservation B (declared value EUR 300.00); deposit EUR 100.00 method cash; stub F09 Deal, claim and case ports; stub F08 consent port; hostile in-memory relay; fixed clock 2026-12-05T09:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-040-09.T01 | unit | PS-040-01.R01, PS-040-01.R02, PS-040-01.R03, PS-040-02.R03 | propose, supersede with new terms, agree on old cid | second proposal supersedes; agreement on old cid RENTALS_DEPOSIT_TERMS_STALE; amounts immutable |
| TEST-PS-040-09.T02 | unit | PS-040-02.R02, PS-040-02.R03 | each rule V01–V12 violated in turn with every other check passing | the documented code is returned and nothing stored; bad statements quarantined with that code |
| TEST-PS-040-09.T03 | property | PS-040-03.R01, PS-040-03.R07 | random statement and event sequences including forks | only declared transitions succeed; terminal states never change; frozen leaves only through renegotiation, dispute or expiry |
| TEST-PS-040-09.T04 | integration | PS-040-03.R02, PS-040-04.R03 | payment claimed only, confirming only, expired, then acknowledged | funded only at acknowledged or final; proof labels follow COM-4 |
| TEST-PS-040-09.T05 | property | PS-040-01.R02, PS-040-03.R02, PS-040-09.R02 | random partial forfeits, forfeits claimed below the deposit and accepted in full, releases, and two damage claims | retained plus released equals funded; an accepted forfeit below the funded amount goes to release_pending with funded − amount, never forfeited; at most one forfeit per damage claim; integer minor units |
| TEST-PS-040-09.T06 | integration | PS-040-03.R03 | forfeit claim unanswered past respondBy plus 72 h; owner silent for 7 days after return | escalation_due with a prefilled draft case in the owner vault and no case opened; overdue decision banner, no auto release or forfeit; after 30 days in escalation_due back to funded with decisionOverdue |
| TEST-PS-040-09.T07 | integration | PS-040-04.R01, PS-040-04.R02, PS-040-06.R01, PS-040-09.R03 | full flow with relay that duplicates, drops and reorders | both vaults converge on released with identical cids; duplicates skipped |
| TEST-PS-040-09.T08 | contract | PS-040-04.R01, PS-040-04.R02, PS-040-04.R04 | each command, statement, consent, Deal call and event | payloads and signatures validate against registry schemas and signer roles; funding and release Deals are opened by the owner vault and carry contextRef {rental_deposit, depositId} with contextCid agreementCid and {rental_deposit_release, depositId} with the attestation cid; the renter vault derives the same fundingDealId before the Deal arrives and its ContextTermsPort.verify accepts both Deals |
| TEST-PS-040-09.T09 | abuse | PS-040-05.R01, PS-040-05.R02, PS-040-05.R03 | inbound release attestation signed by the renter; local respond_forfeit by the owner; payment event for a foreign contextRef | the statement is quarantined with RENTALS_STATEMENT_INVALID; the command returns FORBIDDEN; the event is ignored under V08; no state change |
| TEST-PS-040-09.T10 | integration | PS-040-06.R02, PS-040-06.R03 | two contradictory forfeit claims; crash injected after the state change and before the outbox write, and after commerce.deal.open; dispute port failing once after an explicit open | deposit frozen; after restart no partial state (state, Deal, event and outbox all present or all absent); case request retried |
| TEST-PS-040-09.T11 | abuse | PS-040-07.R01, PS-040-07.R02, PS-040-07.R03 | inspect logs, notifications and relay payloads; 51 inbound statements in a day; forfeit for damage without a damage claim | no amounts or evidence outside encrypted envelopes; 51st dropped and counted; forfeit refused with VALIDATION_FAILED |
| TEST-PS-040-09.T12 | integration | PS-040-03.R05, PS-040-04.R03 | reservation cancelled after funding, owner attests on day 40 | deposit moves to release_pending with the full amount and no release Deal; attest_release allowed without return attestation and after day 30; released after the renter acknowledges |
| TEST-PS-040-09.T13 | load | PS-040-08.R01, PS-040-08.R02, PS-040-08.R03 | 2 000 deposits, throttled mobile profile | command p95 ≤ 120 ms, verify p95 ≤ 30 ms, no telemetry request |
| TEST-PS-040-09.T14 | unit | PS-040-09.R01 | traceability tool run | every PS-040 requirement maps to a passing test |
| TEST-PS-040-09.T15 | integration | PS-040-10.R01, PS-040-10.R02, PS-040-10.R03 | export, import into fresh vault, restore | terms and statements round-trip; unverifiable statements kept as history |
| TEST-PS-040-09.T16 | e2e | PS-040-01.R01, PS-040-04.R01 | mobile owner proposes, renter agrees and pays, owner acknowledges, release after return | funded then released in both vaults; non-custody wording shown and signed; axe zero serious issues |
| TEST-PS-040-09.T17 | unit | PS-040-02.R01 | inbound forfeit claim with a bad signature and a stale state; inbound response with a wrong signer and an amount above the funded deposit | RENTALS_STATEMENT_INVALID for both; the later failures are never reported |
| TEST-PS-040-09.T18 | integration | PS-040-03.R04 | for a disputed deposit deliver each F09 outcome - refund_claimed with advisoryRefund EUR 60.00 accepted by both, return_agreed accepted by both, no_fault_close, enforcement_referral, lapsed - plus a refund_claimed outcome with advisoryRefund EUR 60.00 accepted by both in a case the owner opened, and separately commerce.dispute.withdrawn | release_pending with EUR 60.00 and EUR 40.00 retained for both refund_claimed cases; release_pending with the full amount for return_agreed; funded with decisionOverdue for the other three; prior state restored on withdrawal; never forfeited without both acceptances |
| TEST-PS-040-09.T19 | integration | PS-040-03.R06 | renter contests a forfeit; another forfeit goes unanswered | only the renter vault opens a case on contest, only the owner vault offers the draft on silence; the other vault waits in escalated_pending and links the case from commerce.dispute.opened; exactly one case per deposit |
| TEST-PS-040-09.T20 | integration | PS-040-02.R02, PS-040-03.R05 | not_returned forfeit without return attestation at overdue day 13 and day 15; damage resolved on day 40 after return and forfeit on day 50; forfeit for damage after a verified return_waiver; forfeit for damage above the agreedAmount of its resolved claim; not_returned forfeit without the recorded not_returned damage claim id | RENTALS_DEPOSIT_WINDOW on day 13; allowed on day 15; allowed until 14 days after the resolution; waiver case refused with RENTALS_DEPOSIT_WINDOW; the last two refused with VALIDATION_FAILED |
| TEST-PS-040-09.T21 | integration | PS-040-03.R07, PS-040-06.R02 | frozen deposit renegotiated, disputed by the non-forking party, and left alone before and after funding | each exit reaches the documented state; expiry after 72 h before funding and escalation_due after 14 days after funding |
| TEST-PS-040-09.T22 | integration | PS-040-04.R05 | owner withdraws the terms while the renter agrees concurrently | both vaults end withdrawn; the agreement fails with CONFLICT_STATE in both; rentals.deposit.released with not_funded emitted once per vault |
| TEST-PS-040-09.T23 | integration | PS-040-07.R04 | privacy.deletion.completed for the renter; export; retention purge after RET-EVIDENCE | DIDs replaced by the pseudonym with signatures intact; section rentals.deposits exported; purge removes terminal records |
| TEST-PS-040-09.T24 | abuse | PS-040-07.R05 | owner blocks the renter after funding, then the renter's forfeit response and release acknowledgement arrive | both verified and stored, notifications suppressed; the deposit reaches released |

## Acceptance criteria

- All tests T01–T24 pass in CI.
- No state shows a deposit as funded, released or forfeited on a payment claim alone, silence never settles money and no case is ever opened without a party's explicit action.
- No code path in the platform or a relay moves or holds deposit funds.

## Dependencies

Module depends on: F05.S01.M01, F09.S01.M01, F09.S01.M03, F09.S02.M02, F09.S03.M01, F09.S03.M03, F08.S01.M01, F08.S02.M02, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
