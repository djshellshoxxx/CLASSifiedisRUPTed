# PS-024-09 — Contract and acceptance tests: Cycle execution and recovery

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M04 Cycle execution and recovery](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/recovery` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-024-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-024-09.R02** Execution flows are tested across in-memory vaults with a fake relay and per-vault clocks for 2-, 3-, 4- and 6-party cycles.
- **PS-024-09.R03** Property tests show completion is impossible without every receiver attestation and settled compensation, and that cancelled cycles never reopen.

## Specification

See the module test table below (all processes).

**Fixtures:** Vaults Alice, Bob, Carol, Dan, Erin, Frank; committed cycles C2, C3, C4, C6; compensation leg of 80.00 EUR Dan to Alice in C4; photo fixture with GPS EXIF; per-vault clocks from 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-024-09.T01 | integration | PS-024-01.R01, PS-024-03.R01, PS-024-04.R03 | 3-party cycle with all handed_over and received attestations delivered | each vault emits leg.received per leg and completed after the third receipt |
| TEST-PS-024-09.T02 | integration | PS-024-01.R04, PS-024-03.R01 | 2-party cycle; receiver attests without giver attestation | leg received and cycle completes; giver evidence not required |
| TEST-PS-024-09.T03 | unit | PS-024-02.R01, PS-024-02.R02, PS-024-02.R03 | each rule V01..V11 violated in turn | documented error code and nothing stored |
| TEST-PS-024-09.T04 | property | PS-024-03.R01, PS-024-03.R04, PS-024-09.R03 | random interleavings of attestations, issues, drops and duplicates | completed only with all receiver attestations and settled compensation; cancelled and terminal states never reopen |
| TEST-PS-024-09.T05 | integration | PS-024-03.R02, PS-024-04.R03 | Dan drops in 4-party cycle after Alice's handed_over | cycle partially_executed, one RecoveryCase opened, no cancellation, no reroute |
| TEST-PS-024-09.T06 | integration | PS-024-03.R02, PS-024-06.R04 | receiver reports not_received after giver handed_over | issue recorded, partially_executed, both statements kept unmerged, options offered |
| TEST-PS-024-09.T07 | integration | PS-024-03.R03, PS-024-01.R02 | return_item proposed by Alice, accepted by Bob, returned and return_confirmed attested | case resolved with dispositions released for returned legs |
| TEST-PS-024-09.T08 | integration | PS-024-03.R03, PS-024-04.R01 | escalate case to dispute and resolve via commerce.dispute.resolved | outcome dispute_outcome and recovery.resolved emitted once |
| TEST-PS-024-09.T09 | integration | PS-024-03.R03 | no activity for 30 days with injected clock | closed_unresolved with outcome unresolved and UI statement that no remedy exists |
| TEST-PS-024-09.T10 | contract | PS-024-04.R01, PS-024-04.R02, PS-024-09.R02 | all commands and events | statements and payloads validate against classrup.mutiny.handover_attestation/v1, recovery_case/v1, recovery_action/v1 and registry; sync states advance only when acknowledged |
| TEST-PS-024-09.T11 | abuse | PS-024-05.R01, PS-024-05.R02, PS-024-05.R03, PS-024-07.R03 | forged attestation, wrong-role signer, replay on another leg, relay attempts to mark received | quarantined or FORBIDDEN; relay cannot alter any state |
| TEST-PS-024-09.T12 | integration | PS-024-06.R01, PS-024-06.R02, PS-024-06.R03 | replay attest; duplicate received from second device; crash mid-transaction | single attestation; no partial state |
| TEST-PS-024-09.T13 | integration | PS-024-06.R04, PS-024-04.R03 | compensation acknowledged after items received | completion occurs at acknowledgement, not before; offline attestations delivered later |
| TEST-PS-024-09.T14 | abuse | PS-024-07.R01, PS-024-07.R04 | issue reported before giver attestation and within 48 h; backdated claimedAt | MUTINY_ISSUE_NOT_ALLOWED; claim ignored for rules |
| TEST-PS-024-09.T15 | abuse | PS-024-07.R02 | photo with GPS metadata attached | rejected; stripped re-encoded photo accepted |
| TEST-PS-024-09.T16 | integration | PS-024-07.R03, PS-024-03.R04 | late handed_over arrives after cycle cancelled | cycle stays cancelled and standalone recovery case opens |
| TEST-PS-024-09.T17 | load | PS-024-08.R02, PS-024-08.R03 | attest and completion for 8 legs on emulated Moto G | within budgets |
| TEST-PS-024-09.T18 | unit | PS-024-08.R01, PS-024-09.R01 | diagnostics and traceability tool | no identifiers or notes in diagnostics; every PS-024 requirement maps to a passing test |
| TEST-PS-024-09.T19 | e2e | PS-024-01.R03, PS-024-02.R02 | two mobile browsers perform hand-over attestations | statement of what a signature means shown; payment labels as text; axe zero serious issues |
| TEST-PS-024-09.T20 | integration | PS-024-10.R01, PS-024-10.R02, PS-024-10.R03 | export, import, rollback | attestations and cases round-trip with signatures verified; imported open cases are frozen read-only |

## Acceptance criteria

- All tests T01–T20 pass in CI.
- No cycle is completed without a valid receiver attestation for every leg and settled compensation, and no state ever claims that goods were delivered, only that signers asserted it.
- Dropout after handover always yields partially_executed with a RecoveryCase and never a silent reroute.

## Dependencies

Module depends on: F02.S03.M01, F02.S04.M01, F02.S01.M03, F09.S02.M02, F08.S01.M03, F16.S02.M03, F07.S01.M01, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-COM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
