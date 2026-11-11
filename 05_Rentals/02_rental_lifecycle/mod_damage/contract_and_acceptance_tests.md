# PS-041-09 — Contract and acceptance tests: Rental damage claims

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M03 Rental damage claims](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/damage` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-041-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-041-09.R02** The comparison and the amount rules are covered by property tests with a reference model over random checklists.
- **PS-041-09.R03** Two-vault tests with a hostile relay cover duplicate, dropped and reordered statements and silent counterparties.

## Specification

See the module test table below (all processes).

**Fixtures:** Two vaults - owner O and renter R - with attested handoff (tent-pole ok) and bilaterally attested return (tent-pole damaged), reservation ended 2026-12-07T09:00:00Z, declared value EUR 300.00 in the signed request and the deposit terms, deposit EUR 100.00 funded; stub F09 case and Deal ports; hostile relay with expiring blobs; fixed clock 2026-12-08T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-041-09.T01 | unit | PS-041-01.R01, PS-041-01.R02, PS-041-02.R03 | claim with 2 items summing to the total, and one whose total is off by 1 minor unit | first stored with claim cid; second returns VALIDATION_FAILED |
| TEST-PS-041-09.T02 | unit | PS-041-02.R03 | each rule V01–V12 violated in turn with every other check passing | the documented code is returned and nothing stored; bad statements quarantined with that code |
| TEST-PS-041-09.T03 | property | PS-041-02.R02, PS-041-03.R01, PS-041-09.R02 | random handoff and return checklists with each provenance | worsened set and provenance equal the reference model; claims without worsened items refused; basis mismatch refused on receipt |
| TEST-PS-041-09.T04 | integration | PS-041-03.R02, PS-041-03.R03 | renter silent past respondBy plus 72 h; owner silent on a counter past counterAnswerBy plus 72 h | escalation_due with a prefilled draft case for the owner and for the renter respectively; no case opened; never accepted; events once |
| TEST-PS-041-09.T05 | property | PS-041-03.R01, PS-041-03.R06 | random statement and event sequences including forks | only declared transitions succeed; terminal states never change; frozen leaves only through renegotiation, withdrawal or escalation_due |
| TEST-PS-041-09.T06 | integration | PS-041-04.R01, PS-041-04.R03 | accept path with a funded deposit that retains EUR 25.00 of an agreed EUR 45.00; accept path without a deposit; accept path where the deposit is released in full without a forfeit for this claim | forfeit prefilled with the claim id; excess Deal {rental_damage, claimId} with purpose damage opened by the owner vault for EUR 20.00, EUR 45.00 and EUR 45.00 respectively; the same damage is never recovered twice; resolved emitted once |
| TEST-PS-041-09.T07 | integration | PS-041-04.R02, PS-041-06.R01, PS-041-09.R03 | full flow with relay that duplicates, drops and reorders | both vaults converge on accepted with identical cids; duplicates skipped |
| TEST-PS-041-09.T08 | contract | PS-041-04.R01, PS-041-04.R03, PS-041-04.R04 | each command, statement, Deal call and event | payloads and signatures validate against registry schemas and signer roles; dispute and Deal calls carry contextRef {rental_damage, claimId} |
| TEST-PS-041-09.T09 | abuse | PS-041-05.R01, PS-041-05.R02, PS-041-05.R03 | inbound response signed by the owner; local claim by the renter; claim after the window | the response is quarantined with RENTALS_STATEMENT_INVALID; the local claim returns FORBIDDEN; the late claim returns RENTALS_DAMAGE_WINDOW; no state change |
| TEST-PS-041-09.T10 | integration | PS-041-06.R02, PS-041-06.R03 | two contradictory responses; case port failing once after the opener's explicit escalate; crash injected between the case request and the state change | claim frozen; case request retried; after restart never escalated without a request in flight and no partial state |
| TEST-PS-041-09.T11 | abuse | PS-041-07.R01, PS-041-07.R02, PS-041-07.R03 | inspect logs, notifications, relay payloads; 51 inbound statements in a day; duplicate claim; claim stating a declared value different from the deposit terms | no amounts or evidence outside encrypted envelopes; 51st dropped; RENTALS_DAMAGE_DUPLICATE; VALIDATION_FAILED |
| TEST-PS-041-09.T12 | integration | PS-041-03.R01, PS-041-01.R02 | not_returned claim at day 13 and day 15 overdue; not_returned claim at day 15 while an uncontested renter return report is held | RENTALS_DAMAGE_WINDOW at day 13; allowed at day 15 with overdue history as basis; RENTALS_DAMAGE_WINDOW while the report is uncontested |
| TEST-PS-041-09.T13 | load | PS-041-08.R01, PS-041-08.R02, PS-041-08.R03 | two 30-item reports and 2 000 claims on throttled mobile profile | p95 ≤ 150 ms, sweep ≤ 100 ms, no telemetry request |
| TEST-PS-041-09.T14 | unit | PS-041-09.R01 | traceability tool run | every PS-041 requirement maps to a passing test |
| TEST-PS-041-09.T15 | integration | PS-041-10.R01, PS-041-10.R02, PS-041-10.R03 | export, import into fresh vault, restore | claims and statements round-trip; basis recomputation flags mismatches |
| TEST-PS-041-09.T16 | e2e | PS-041-01.R01, PS-041-04.R01 | mobile owner files claim, renter counters, owner accepts in two browsers | both show accepted with the same agreed amount; axe zero serious issues |
| TEST-PS-041-09.T17 | unit | PS-041-02.R01 | inbound claim with a bad signature and a window violation; inbound response with a wrong signer and a passed respondBy | RENTALS_STATEMENT_INVALID for both; the later failures are never reported |
| TEST-PS-041-09.T18 | integration | PS-041-02.R04 | claim signed on day 6.9 delivered on day 7.5; response signed before respondBy delivered 2 days later | accepted in both vaults with the same respondBy; the response accepted in both; the return closes only after damageWindowEndsAt plus 72 h |
| TEST-PS-041-09.T19 | integration | PS-041-03.R04 | for an escalated claim deliver each F09 outcome - refund_claimed with advisoryRefund EUR 30.00 accepted by both, return_agreed accepted by both without advisoryRefund, no_fault_close, enforcement_referral, lapsed - plus refund_claimed with advisoryRefund EUR 30.00 accepted by both in a case the renter opened, and separately commerce.dispute.withdrawn | resolved with EUR 30.00 for both refund_claimed cases; resolved with 0 for return_agreed; resolved_unsettled without agreedAmount for the other three; prior state restored on withdrawal |
| TEST-PS-041-09.T20 | integration | PS-041-03.R05 | renter contests; renter silent; owner silent on a counter | exactly one case per claim opened by the designated party; the other vault waits in escalated_pending and links the case from commerce.dispute.opened |
| TEST-PS-041-09.T21 | unit | PS-041-01.R03 | modify a signed claim; counter and withdraw | signed bytes cannot change; the counter and withdrawal are new statements naming the claim cid |
| TEST-PS-041-09.T22 | integration | PS-041-07.R02 | owner waives damage at return, then claims within 7 days from the owner vault and from a modified owner client sending directly to the renter | RENTALS_DAMAGE_WINDOW in the owner vault and the claim quarantined with RENTALS_DAMAGE_WINDOW in the renter vault |
| TEST-PS-041-09.T23 | integration | PS-041-02.R02, PS-041-07.R02 | owner_only return, claim filed, then the renter files a return report | provenance owner_only shown on compare and response screens; recomputation against the renter's report flags the conflict |
| TEST-PS-041-09.T24 | integration | PS-041-07.R04, PS-041-04.R05 | relay blob of an evidence photo expired before the renter fetched it; owner deletes the thread message after the renter stored the photos; no comms.attachment.deleted reaches the renter vault | the download returns NOT_FOUND and the photo is re-requested; respond refused with RENTALS_EVIDENCE_MISSING until re-sent; stored copies stay and verify after deletion |
| TEST-PS-041-09.T25 | integration | PS-041-07.R05 | privacy.deletion.completed for the renter; export; retention purge after RET-EVIDENCE | DIDs replaced by the pseudonym with signatures intact; section rentals.damage exported; purge removes terminal records |
| TEST-PS-041-09.T26 | abuse | PS-041-07.R06 | owner blocks the renter after the return, files a claim, then the renter's contest arrives | contest verified and stored and the renter's escalation accepted; the claim does not reach escalation_due by silence; notifications suppressed |

## Acceptance criteria

- All tests T01–T26 pass in CI.
- No claim is accepted by silence, no case is opened without the designated party's explicit action, and no amount is shown as paid on a payment claim alone.
- Every claim carries a comparison with provenance the receiver can recompute from the two reports, and no damage is recovered both from the deposit and through a payment Deal.

## Dependencies

Module depends on: F05.S02.M01, F05.S02.M02, F05.S01.M01, F05.S01.M02, F09.S01.M01, F09.S01.M03, F09.S02.M02, F08.S01.M01, F08.S01.M03, F15.S02.M03, F10.S02.M03, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
