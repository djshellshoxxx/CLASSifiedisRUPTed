# PS-032-09 — Contract and acceptance tests: Service quotes and booking

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M01 Service quotes and booking](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/quotes` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-032-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-032-09.R02** Contract tests validate all statement schemas, signatures and event payloads against the schema registry.
- **PS-032-09.R03** Cross-vault flows are covered by two-vault integration tests with an in-memory relay that can drop, duplicate and reorder envelopes.

## Specification

See the module test table below (all processes).

**Fixtures:** Two vaults - client C and provider P - with an in-memory relay; offering O (fixed EUR), calendar in Europe/Berlin; fixed clock 2026-11-04T10:00:00Z; keys generated from fixed seeds.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-032-09.T01 | unit | PS-032-01.R01, PS-032-01.R02, PS-032-04.R01 | issue a quote whose milestones sum to total and one that is off by 1 minor unit | first stored; second SERVICES_MILESTONE_SUM_MISMATCH |
| TEST-PS-032-09.T02 | unit | PS-032-01.R03, PS-032-02.R01, PS-032-02.R02, PS-032-02.R03 | each rule V01–V09 violated in turn | documented code returned and nothing stored, bad statements quarantined |
| TEST-PS-032-09.T03 | property | PS-032-03.R01 | random statement sequences per entity | only declared transitions succeed; terminal states never change |
| TEST-PS-032-09.T04 | integration | PS-032-03.R02, PS-032-03.R03, PS-032-06.R03 | confirm with slot commit failing, then with Deal creation failing | booking stays awaiting_confirmation, no signature, no committed slot, no Deal |
| TEST-PS-032-09.T05 | integration | PS-032-04.R02, PS-032-06.R01, PS-032-09.R03 | full flow with relay that duplicates and reorders envelopes | both vaults reach confirmed with identical bookingId and cids; duplicates skipped |
| TEST-PS-032-09.T06 | contract | PS-032-04.R01, PS-032-04.R03, PS-032-09.R01, PS-032-09.R02 | each command, statement and event | payloads and signatures validate against registry schemas |
| TEST-PS-032-09.T07 | abuse | PS-032-05.R01, PS-032-05.R02, PS-032-05.R03, PS-032-07.R01 | acceptance signed by a third key; confirmation signed by the client; relay tries to alter ciphertext | all quarantined with SERVICES_STATEMENT_INVALID; no state change; relay cannot read descriptions |
| TEST-PS-032-09.T08 | integration | PS-032-06.R02, PS-032-07.R02 | two clients accept two quotes for one slot; forked provider devices sign two confirmations | second acceptance refused slot_taken; forked confirmations freeze booking and require renegotiation |
| TEST-PS-032-09.T09 | integration | PS-032-01.R02, PS-032-03.R01, PS-032-07.R03 | acceptance arrives 6 minutes after validUntil by provider clock | refused EXPIRED; quote shown expired; no booking confirmed |
| TEST-PS-032-09.T10 | property | PS-032-06.R01, PS-032-07.R03 | cancellation times around the 24 h boundary and with backdated claims | fee follows the policy and the 72 h rule; amounts HALF_EVEN and never exceed total times lateFeeBps |
| TEST-PS-032-09.T11 | abuse | PS-032-07.R03, PS-032-07.R01 | 21 inbound requests in a day from one sender | 21st dropped and counted; sender remains quarantined for the day |
| TEST-PS-032-09.T12 | load | PS-032-08.R01, PS-032-08.R02, PS-032-08.R03 | 2 000 bookings, 100 mixed commands on throttled mobile profile | command p95 ≤ 150 ms, verify p95 ≤ 30 ms, no telemetry request |
| TEST-PS-032-09.T13 | integration | PS-032-06.R01, PS-032-10.R01 | go offline, accept, sync later | UI shows prepared then transport_acknowledged; confirmed only after provider confirmation received |
| TEST-PS-032-09.T14 | integration | PS-032-10.R01, PS-032-10.R02, PS-032-10.R03 | export, import into fresh vault, restore | records round-trip identical; in-flight statements re-enter outbox as prepared |
| TEST-PS-032-09.T15 | e2e | PS-032-01.R01, PS-032-03.R02 | mobile client requests, provider quotes and confirms in a second browser context | both show confirmed; axe zero serious issues |

## Acceptance criteria

- All tests T01–T15 pass in CI.
- No booking is ever shown as confirmed without the provider's verified signed confirmation held in the vault.
- Duplicated, reordered or replayed statements never change state twice.

## Dependencies

Module depends on: F03.S01.M01, F03.S01.M02, F09.S01.M01, F08.S01.M01, F07.S01.M01, F07.S02.M02, F11.S01.M03, F09.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
