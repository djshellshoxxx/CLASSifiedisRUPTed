# PS-070-09 — Contract and acceptance tests: Disputes

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S02.M02 Disputes](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/settlement/disputes` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-070-09.R01** Every requirement is covered by at least one automated test.
- **PS-070-09.R02** Contract tests validate command outputs, statements and event payloads against the schema registry.
- **PS-070-09.R03** Mediation and fork scenarios are covered by deterministic multi-vault integration tests.

## Specification

See the module test table below (all processes).

**Fixtures:** In-memory vaults A (opener), B and C (respondents) and M (mediator) with a test relay double that signs directory entries; a Deal context with an acknowledged cash claim; a 3-party cycle context; DisputeContextPort stubs for every registered type; a JPEG with GPS EXIF tags; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-070-09.T01 | unit | PS-070-01.R01, PS-070-01.R02, PS-070-02.R01 | open a case on a deal | case stored with deadlines and parties from DisputeContextPort, signed statement created, caseId deterministic |
| TEST-PS-070-09.T02 | unit | PS-070-01.R03, PS-070-02.R03 | inspect schema and propose refund_claimed with advisoryRefund and a settled disposition | no executable field exists; advisory refund and disposition stored; no payment API called |
| TEST-PS-070-09.T03 | unit | PS-070-02.R02, PS-070-02.R03 | rules V01 to V15 violated in turn | documented error code and nothing stored |
| TEST-PS-070-09.T04 | property | PS-070-03.R01, PS-070-03.R02 | random command sequences | only declared transitions succeed; terminal states have no exits |
| TEST-PS-070-09.T05 | integration | PS-070-03.R04 | clock advanced 7, 14 and 30 days at the corresponding states | noResponseReceivedHere set, proposal expires back to evidence, case lapses with resolution lapsed |
| TEST-PS-070-09.T06 | integration | PS-070-03.R03, PS-070-06.R03 | two conflicting accepted outcomes delivered to vault B | case frozen with COMMERCE_DISPUTE_FORK, both retained, no auto-resolution |
| TEST-PS-070-09.T07 | contract | PS-070-04.R01, PS-070-04.R02, PS-070-09.R02 | execute each command and ingest in the other vaults | outputs, envelopes and events validate against registry schemas |
| TEST-PS-070-09.T08 | integration | PS-070-04.R03, PS-070-02.R01 | commerce.payment.disputed delivered | draft prefilled, no case opened automatically |
| TEST-PS-070-09.T09 | integration | PS-070-04.R02, PS-070-05.R01, PS-070-07.R02 | every party selects and accepts relay-verified mediator M; A shares two of five evidence items; M proposes no_fault_close | M receives only the two shared items; case resolved without acceptance |
| TEST-PS-070-09.T10 | abuse | PS-070-05.R01, PS-070-05.R02, PS-070-05.R03 | non-party signer, mediator not accepted by every party, relay moderator without selection | quarantined or FORBIDDEN; relay sees only ciphertext |
| TEST-PS-070-09.T11 | integration | PS-070-06.R01, PS-070-06.R02 | replay of command ID; delivery interrupted at each sync state | original result; UI shows only the highest reached sync state |
| TEST-PS-070-09.T12 | abuse | PS-070-07.R03, PS-070-07.R01 | 6 cases in one day; 21 evidence statements in an hour; a 6 MiB attachment | 6th case, 21st statement and oversized item refused or rate limited |
| TEST-PS-070-09.T13 | integration | PS-070-01.R02 | principal deletion completes during an open case | did pseudonymized, signatures flagged, the deleted user's evidence blobs crypto-shredded, counterparty copy untouched |
| TEST-PS-070-09.T14 | load | PS-070-08.R01, PS-070-08.R02, PS-070-08.R03 | 1 000 cases and a 200-statement timeline | commit p95 ≤ 120 ms, render ≤ 200 ms, sweep ≤ 500 ms, no telemetry |
| TEST-PS-070-09.T15 | e2e | PS-070-03.R04, PS-070-09.R03 | opener and respondent complete a return_agreed outcome on two devices | both screens show resolved with the no-money-movement note; axe zero serious issues |
| TEST-PS-070-09.T16 | unit | PS-070-09.R01 | traceability tool run | every PS-070 requirement maps to a passing test |
| TEST-PS-070-09.T17 | integration | PS-070-10.R01, PS-070-10.R02, PS-070-10.R03 | export, import into fresh vault with one forged statement, roll back one release | valid cases round-trip, forged statement quarantined, open cases import with sync state reset |
| TEST-PS-070-09.T18 | integration | PS-070-03.R05, PS-070-01.R05 | 3-party cycle case; A selects mediator M and B accepts; then C accepts | M stays proposed and receives nothing after A and B; becomes active only when acceptedBy equals {A, B, C} |
| TEST-PS-070-09.T19 | abuse | PS-070-05.R04, PS-070-01.R05 | B selects a mediator did with no directory entry, then one with an entry signed by a different relay key, and that mediator proposes no_fault_close | both labelled self_declared; the mediator-only outcome is refused with COMMERCE_DISPUTE_MEDIATOR_UNVERIFIED; the same outcome resolves only after every party accepts |
| TEST-PS-070-09.T20 | abuse | PS-070-07.R05, PS-070-01.R04 | A attaches a JPEG with GPS EXIF tags and shares it with active mediator M | B and M receive a MediaBlob of at most 5 MiB with no EXIF, XMP or GPS data; an attachment whose stripping failed is refused |
| TEST-PS-070-09.T21 | integration | PS-070-06.R04 | A has blocked B; A opens a case against B; B responds and adds evidence | open allowed; B's statements stored with notifications suppressed; timeline says 'responses from a party you blocked are hidden'; noResponseReceivedHere stays false |
| TEST-PS-070-09.T22 | contract | PS-070-04.R04 | assert every produced event against the expectations of F07.S03.M01, F13.S01.M03, F09.S01.M01, F02.S03.M04, F03.S02.M03, F05.S01.M02 and F05.S02.M03 | each event carries contextRef, openerId, respondentIds and parties; resolved and withdrawn carry caseCid |
| TEST-PS-070-09.T23 | contract | PS-070-04.R05, PS-070-01.R03 | resolve one case per consumer context type with and without a disposition | resolved payload carries the advisory disposition when present; for deal and payment_claim the default mapping applies when absent; no consumer command that moves money is invoked |
| TEST-PS-070-09.T24 | unit | PS-070-02.R04, PS-070-01.R06 | open cases for each registered type and for an unregistered type | registered types store parties and contextCid from their resolver; unregistered returns COMMERCE_DISPUTE_CONTEXT_INVALID |
| TEST-PS-070-09.T25 | integration | PS-070-07.R04 | export, deletion and retention purge driven by F10 | section commerce.disputes exported; DeletionPort pseudonymizes and crypto-shreds the deleted user's own evidence; RetentionPurgePort purges after RET-EVIDENCE; every field carries an F10.S02.M02 class |
| TEST-PS-070-09.T26 | abuse | PS-070-07.R06 | 10 000 fresh dids each send one dispute statement | quarantine stays within 500 entries or 5 MiB, oldest evicted first, non-party statements dropped once full; parties' statements still applied |
| TEST-PS-070-09.T27 | integration | PS-070-04.R06 | dispute, evidence and outcome statements delivered through F09.S01.M01 commerce.statement.ingest, plus duplicates and a statement signed by a non-party | dispatched to commerce.dispute.ingest and applied once; duplicates no-op; non-party quarantined with COMMERCE_DISPUTE_STATEMENT_INVALID |

## Acceptance criteria

- All tests T01 to T27 pass in CI.
- No dispute state, event or outcome invokes any payment, refund, freeze or release operation.
- A mediator sees only evidence the parties chose to share and only after every party of the case accepted the mediator.
- Conflicting accepted outcomes always freeze the case.
- A self-declared mediator can never close a case without every party's acceptance.
- Statements in an open case are never dropped because of a block, and no image evidence carries location metadata.

## Dependencies

Module depends on: F09.S01.M01, F09.S02.M01, F09.S03.M01, F09.S03.M03, F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F16.S02.M03, F15.S02.M03, F10.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
