# PS-031-09 — Contract and acceptance tests: Service milestones

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M02 Service milestones](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/milestones` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-031-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-031-09.R02** Contract tests validate statements, events and the commerce.deal.open call against the schema registry and the F09 contract.
- **PS-031-09.R03** Two-vault integration tests with a hostile in-memory relay cover duplicate, dropped and reordered statements.

## Specification

See the module test table below (all processes).

**Fixtures:** Two vaults - client C and provider P - confirmed booking B whose accepted quote plan has three milestones of EUR 100.00, 150.00, 250.00 (seq 2 parallel); hostile in-memory relay; stub F09 ports with schema checks; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-031-09.T01 | integration | PS-031-01.R01, PS-031-01.R02, PS-031-01.R04, PS-031-04.R03 | booking.confirmed event delivered twice with a 3-milestone plan | exactly 3 milestones per vault with ids uuid(sha256(bookingId:seq)), plan taken from the client-signed quote; sum equals total |
| TEST-PS-031-09.T02 | unit | PS-031-01.R03, PS-031-02.R02, PS-031-02.R03 | each rule V01–V10 violated in turn | documented code returned and nothing stored, bad statements quarantined |
| TEST-PS-031-09.T03 | property | PS-031-03.R01 | random statement and event sequences on one milestone | only declared transitions succeed; settled and cancelled never change |
| TEST-PS-031-09.T04 | integration | PS-031-03.R02 | approval naming an older submission cid, then the latest | first SERVICES_SUBMISSION_STALE; second approved |
| TEST-PS-031-09.T05 | integration | PS-031-03.R03, PS-031-03.R06, PS-031-04.R03 | payment claimed, confirming, confirmed, reorged, confirming, finalized; then claimed, failed; then claimed, expired; then acknowledged | proof labels follow COM-4; after the reorg proof is reorged and the milestone stays approved; settled only at acknowledged or final; booking completes only after both completion statements |
| TEST-PS-031-09.T06 | contract | PS-031-04.R01, PS-031-04.R02, PS-031-09.R02 | each command, statement and event, and the commerce.deal.open call | payloads, signatures and the Deal request (contextRef service_milestone, contextCid approvalCid, parties, obligation) validate against the registry and F09 schemas |
| TEST-PS-031-09.T07 | abuse | PS-031-05.R01, PS-031-05.R02, PS-031-05.R03 | approval signed by provider key; submission signed by client; payment event with the dealId of another context | all quarantined or ignored; no state change |
| TEST-PS-031-09.T08 | integration | PS-031-06.R01, PS-031-06.R02, PS-031-09.R03 | relay duplicates, drops and reorders; two forked provider devices sign different submissions | duplicates skipped; fork freezes the milestone for renegotiation |
| TEST-PS-031-09.T09 | integration | PS-031-06.R03, PS-031-03.R04 | commerce.deal.open fails during approval | approval not signed; milestone stays submitted; no dealId |
| TEST-PS-031-09.T10 | abuse | PS-031-07.R02, PS-031-07.R03 | alter a file after submission; 101 inbound statements from one counterparty | hash differs shown and approval disabled; 101st dropped and counted |
| TEST-PS-031-09.T11 | load | PS-031-08.R01, PS-031-08.R02, PS-031-08.R03 | hash a 5 MiB attachment and stream a 100 MiB external file, run 100 mixed commands on throttled mobile profile | attachment hashing ≤ 150 ms in worker, no UI slice over 50 ms, command p95 ≤ 150 ms, no telemetry request |
| TEST-PS-031-09.T12 | unit | PS-031-09.R01 | traceability tool run | every PS-031 requirement maps to a passing test |
| TEST-PS-031-09.T13 | integration | PS-031-10.R01, PS-031-10.R02, PS-031-10.R03 | export, import into fresh vault, restore | milestones and statements round-trip; unverifiable statements kept as read-only history |
| TEST-PS-031-09.T14 | e2e | PS-031-01.R01, PS-031-04.R01 | mobile provider submits, client approves and records payment claim, provider acknowledges, both sign completion | milestone settled in both vaults; booking completed; axe zero serious issues |
| TEST-PS-031-09.T15 | integration | PS-031-07.R01 | inspect the diagnostics log and every notification payload during submit, approve, settle and completion | no file names, notes or amounts; only references and template keys |
| TEST-PS-031-09.T16 | unit | PS-031-02.R01 | inbound envelope with both an invalid schema and a bad signature | the schema error is returned and stored, not the signature error; statement quarantined |
| TEST-PS-031-09.T17 | integration | PS-031-03.R05 | dispute opened for a submitted and an approved milestone, then each F09 resolution and a withdrawal; then commerce.deal.cancelled mutual | each milestone returns to its pre-dispute status; refund_claimed leaves the Deal unchanged; approved becomes cancelled only on the mutual Deal cancellation |
| TEST-PS-031-09.T18 | contract | PS-031-04.R04 | services.booking.completed and milestone events against the F07.S03.M01 and F13.S01.M03 consumers | N3 fields present; completed emitted only after both completion statements; clientId and providerId present |
| TEST-PS-031-09.T19 | abuse | PS-031-07.R04, PS-031-02.R02 | submission with a 6 MiB image, a PDF as attachment, and a PDF as external_hash | first two VALIDATION_FAILED; external hash accepted and verified locally |
| TEST-PS-031-09.T20 | abuse | PS-031-01.R04 | booking.confirmed whose plan changes one amount relative to the client-signed quote | no milestone created from the altered plan; mismatch logged and the upstream confirmation quarantined |
| TEST-PS-031-09.T21 | integration | PS-031-07.R05 | statements from a blocked DID; privacy.deletion.completed for the counterparty; export | dropped silently; counterparty pseudonymized; export section services.milestones present |

## Acceptance criteria

- All tests T01–T21 pass in CI.
- A milestone is never shown settled on a claim alone, never shows a stronger proof than the claim reached, and the proof level is always displayed.
- Duplicated, reordered or replayed statements never advance a milestone twice, and a booking completes only with both completion signatures.

## Dependencies

Module depends on: F03.S02.M01, F09.S01.M01, F09.S01.M03, F08.S01.M03, F07.S01.M01, F07.S02.M02, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
