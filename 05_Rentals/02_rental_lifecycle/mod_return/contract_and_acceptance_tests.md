# PS-043-09 — Contract and acceptance tests: Rental return

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M02 Rental return](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/return` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-043-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-043-09.R02** Late-fee arithmetic and the 72 hour rule are covered by property tests with a reference model including DST zones.
- **PS-043-09.R03** Two-vault tests with a hostile in-memory relay cover duplicate, dropped and reordered statements and silent owners.

## Specification

See the module test table below (all processes).

**Fixtures:** Two vaults - owner O and renter R - with attested handoff, reservation ending 2026-12-07T09:00:00Z, grace 60 minutes, late fee EUR 5.00 per hour capped at EUR 40.00; stub F09 Deal port and F05.S01.M02 deposit query; hostile in-memory relay that signs transport receipts and can hold envelopes; fixed clock 2026-12-07T08:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-043-09.T01 | unit | PS-043-01.R01, PS-043-01.R02, PS-043-02.R02 | returns at +30 min, +130 min after grace, +20 h and across a DST change | lateMinutes 0, 130 with fee 15.00, capped at 40.00; elapsed UTC time used |
| TEST-PS-043-09.T02 | unit | PS-043-02.R03 | each rule V01–V12 violated in turn with every other check passing | the documented code is returned and nothing stored; bad statements quarantined with that code |
| TEST-PS-043-09.T03 | property | PS-043-02.R02, PS-043-03.R02, PS-043-09.R02 | random return times, evidence times, rates, caps and adjustments against reference model | fee equals model, never above cap, adjustments only decrease; effective time within the 72 h rule |
| TEST-PS-043-09.T04 | property | PS-043-03.R01 | random statement and event sequences | only declared transitions succeed; closed never changes; attested never follows from silence |
| TEST-PS-043-09.T05 | integration | PS-043-03.R03, PS-043-06.R01 | owner silent for 72 hours after relay receipt; owner records receipt only; owner attests exact cid | renter_reported_unconfirmed labelled with the relay and no rentals.return.attested; owner_only; both respectively; events once per vault |
| TEST-PS-043-09.T06 | integration | PS-043-06.R02 | sweep runs twice across the grace boundary and across restart in both vaults | one overdue event per vault; identical silence deadline and damage window in both vaults; closure emitted once |
| TEST-PS-043-09.T07 | integration | PS-043-04.R03, PS-043-01.R02, PS-043-03.R07 | closure with an open damage claim, a funded deposit whose decision becomes overdue, the damage window, the window plus 72 h, an owner waiver, and a deposit that expired unfunded | closed only when attested and (window plus 72 h over or waived) and no open claim and the deposit absent, terminal or decision overdue; reason deposit_unsettled when overdue; not_funded counts as settled; the waiver only re-evaluates closure and emits nothing itself |
| TEST-PS-043-09.T08 | integration | PS-043-04.R01, PS-043-04.R02, PS-043-09.R03 | full flow with relay that duplicates, drops and reorders | both vaults converge on attested and closed with identical cids; duplicates skipped |
| TEST-PS-043-09.T09 | contract | PS-043-04.R01, PS-043-04.R03, PS-043-04.R04 | each command, statement and event | payloads and signatures validate against registry schemas and signer roles; rentals.rental.closed carries contextId, parties and completionCid when bilateral; the late-fee Deal carries contextRef {rental_late_fee, returnId} |
| TEST-PS-043-09.T10 | abuse | PS-043-05.R01, PS-043-05.R02, PS-043-05.R03 | inbound attestation signed by the renter; local adjust_late_fee by the renter; statement by a third-party key; owner raises a fee | each inbound statement quarantined with RENTALS_STATEMENT_INVALID; the local command returns FORBIDDEN; the raise returns RENTALS_FEE_ADJUST_INVALID; no state change |
| TEST-PS-043-09.T11 | abuse | PS-043-07.R01, PS-043-07.R02, PS-043-07.R03 | backdated claim 5 days before relay receipt; owner offline 5 days then records receipt; 101 inbound statements in a day; inspect logs | effective time is the relay receipt; fee not raised by the late receipt; 101st dropped; no amounts or notes in logs |
| TEST-PS-043-09.T12 | load | PS-043-08.R01, PS-043-08.R02, PS-043-08.R03 | 5 000 returns, throttled mobile profile | sign p95 ≤ 120 ms, sweep ≤ 100 ms, no telemetry request |
| TEST-PS-043-09.T13 | unit | PS-043-09.R01 | traceability tool run | every PS-043 requirement maps to a passing test |
| TEST-PS-043-09.T14 | integration | PS-043-10.R01, PS-043-10.R02, PS-043-10.R03 | export, import into fresh vault, restore | returns and statements round-trip; overdue flag preserved |
| TEST-PS-043-09.T15 | e2e | PS-043-01.R01, PS-043-04.R01 | mobile renter returns 2 h late, owner attests in second browser | late fee preview matches, both show attested; axe zero serious issues |
| TEST-PS-043-09.T16 | unit | PS-043-02.R01 | inbound attestation with a bad signature and a stale report cid; inbound receipt with a wrong signer and an oversized checklist | RENTALS_STATEMENT_INVALID for both; the later failures are never reported |
| TEST-PS-043-09.T17 | integration | PS-043-03.R04 | the renter's report stays prepared for 4 days | return stays awaiting_owner labelled not yet delivered; no silence clock, no attestation and no rentals.return.attested in either vault |
| TEST-PS-043-09.T18 | integration | PS-043-03.R05 | item never returned - not_returned damage claim accepted; owner declaration at day 29 and day 31; a not_returned claim withdrawn; a not_returned claim resolved return_agreed; a renter report contested not_received followed by a declaration at day 31; a declaration while an uncontested renter report is held | closed with reason not_returned and no completionCid; PRECONDITION_FAILED on day 29, allowed on day 31; the withdrawn and return_agreed claims leave the return overdue; the contested case closes not_returned; the last returns PRECONDITION_FAILED |
| TEST-PS-043-09.T19 | integration | PS-043-03.R06 | both parties sign the completion; the owner never co-signs a return attested by both; the renter never co-signs an owner_only return; an owner_only return co-signed by the renter | closed with completionCid, completionKind rental_completion, contextId and parties; after 7 days closed with completionCid = reportCid and completionKind return_attestation; after 7 days oneSided without completionCid; bilateral completion in owner_only mode |
| TEST-PS-043-09.T20 | integration | PS-043-02.R04 | two vaults with delayed delivery of the report, the attestation and a damage claim signed on day 6.9 | identical silence deadline, effective return time and damage window in both vaults; closure waits until damageWindowEndsAt plus 72 h |
| TEST-PS-043-09.T21 | unit | PS-043-01.R03 | modify a signed report or attestation, then sign a new report | signed bytes cannot change; any change is a new cid; the attestation binds only the exact earlier cid |
| TEST-PS-043-09.T22 | chaos | PS-043-06.R03 | crash injected after the state change, after commerce.deal.open and before the outbox write during attest | after restart state, Deal, event and outbox entry are all present or all absent |
| TEST-PS-043-09.T23 | integration | PS-043-07.R04 | relay blob of a return photo expired before the owner fetched it; renter deletes the thread message after the owner stored the photos; photo with GPS metadata | attest refused with RENTALS_EVIDENCE_MISSING until re-sent; stored copies stay and verify after deletion; the GPS photo quarantined with RENTALS_PHOTO_METADATA |
| TEST-PS-043-09.T24 | integration | PS-043-07.R05 | privacy.deletion.completed for the renter; export; retention purge after RET-EVIDENCE | DIDs replaced by the pseudonym and signatures verify; section rentals.returns exported; purge removes terminal records |
| TEST-PS-043-09.T25 | abuse | PS-043-07.R06 | owner blocks the renter after handoff, then the renter's return report arrives | verified and stored; silence clock runs from relay receipt; notification suppressed; a later not_returned declaration is refused with PRECONDITION_FAILED |
| TEST-PS-043-09.T26 | integration | PS-043-03.R01, PS-043-03.R03 | owner contests with verdict not_received; owner contests with verdict differs | contested with the not_returned path open and no attestation; attested with owner_differs and conflictingReportCid set |
| TEST-PS-043-09.T27 | integration | PS-043-03.R01, PS-043-06.R01 | forked owner devices sign two different attestations, then the parties co-sign a renegotiation naming the one that stands; a second frozen return voided by renegotiation; a third left frozen for 30 days | first returns to attested with rentals.return.attested emitted once per vault; second returns to awaiting_owner with the silence clock restarted; third closes with reason unresolved, oneSided and no completionCid |

## Acceptance criteria

- All tests T01–T27 pass in CI.
- The late fee equals the reference model in every case, never exceeds the cap and can only be lowered by the owner.
- A rental closes with a completionCid only when both parties signed it, owner silence never produces an attestation, and an item never returned still reaches closed.

## Dependencies

Module depends on: F05.S02.M01, F05.S01.M01, F05.S01.M02, F09.S01.M01, F08.S01.M01, F08.S01.M03, F15.S02.M03, F10.S02.M03, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
