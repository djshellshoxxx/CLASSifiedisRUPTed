# PS-032-09 — Contract and acceptance tests: Service quotes and booking

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M01 Service quotes and booking](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/quotes` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-032-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-032-09.R02** Contract tests validate all statement schemas, signatures and event payloads against the schema registry.
- **PS-032-09.R03** Cross-vault flows are covered by two-vault integration tests with an in-memory relay that can drop, duplicate, delay and reorder envelopes.

## Specification

See the module test table below (all processes).

**Fixtures:** Two vaults - client C and provider P - with an in-memory relay that signs receipts; offering O (fixed EUR), calendar in Europe/Berlin; stub comms.consent ports; fixed clock 2026-11-04T10:00:00Z with per-vault clock skew control; keys generated from fixed seeds.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-032-09.T01 | unit | PS-032-01.R02 | issue a quote whose milestones sum to total and one that is off by 1 minor unit | first stored; second SERVICES_MILESTONE_SUM_MISMATCH |
| TEST-PS-032-09.T02 | unit | PS-032-01.R03, PS-032-02.R01, PS-032-02.R02, PS-032-02.R03 | each rule V01–V14 violated in turn | documented code returned and nothing stored, bad statements quarantined, blocked senders dropped |
| TEST-PS-032-09.T03 | property | PS-032-03.R01 | random statement sequences per entity | only declared transitions succeed; terminal states never change |
| TEST-PS-032-09.T04 | integration | PS-032-03.R02, PS-032-03.R03, PS-032-06.R03 | confirm with slot commit failing and with the hold flagged needsReconfirmation | booking stays awaiting_confirmation, no signature, no committed slot; no Deal is created at any point |
| TEST-PS-032-09.T05 | integration | PS-032-04.R02, PS-032-06.R01, PS-032-09.R03 | full flow with relay that duplicates and reorders envelopes | both vaults reach confirmed with identical bookingId, milestone ids and cids; duplicates skipped |
| TEST-PS-032-09.T06 | contract | PS-032-04.R01, PS-032-04.R03, PS-032-09.R01, PS-032-09.R02 | each command, statement and event | payloads and signatures validate against registry schemas |
| TEST-PS-032-09.T07 | abuse | PS-032-05.R01, PS-032-05.R02, PS-032-05.R03, PS-032-07.R01 | acceptance signed by a third key; confirmation signed by the client; relay tries to alter ciphertext | all quarantined with SERVICES_STATEMENT_INVALID; no state change; relay cannot read descriptions |
| TEST-PS-032-09.T08 | integration | PS-032-06.R02 | two clients accept two quotes for one slot; forked provider devices sign two confirmations | other acceptance refused slot_taken; forked confirmations move the booking to conflicted |
| TEST-PS-032-09.T09 | integration | PS-032-03.R01 | acceptance arrives 6 minutes after validUntil by provider clock | refused EXPIRED; quote shown expired; no booking confirmed |
| TEST-PS-032-09.T10 | property | PS-032-07.R04 | cancellation times around the free-cancellation boundary with backdated claims, including a claim 30 h before start received 1 h before start | fee follows the policy at the evidence time, claimed time used only within 5 minutes, HALF_EVEN and never above total times lateFeeBps; both vaults store the same lateFeeClaim from the statement and the receiving vault flags the disagreement |
| TEST-PS-032-09.T11 | abuse | PS-032-07.R03 | 21 inbound requests in a day from one sender | 21st dropped and counted; sender remains quarantined for the day |
| TEST-PS-032-09.T12 | load | PS-032-08.R01, PS-032-08.R02, PS-032-08.R03 | 2 000 bookings, 100 mixed commands on throttled mobile profile | command p95 ≤ 150 ms, verify p95 ≤ 30 ms, no telemetry request |
| TEST-PS-032-09.T13 | integration | PS-032-06.R01 | go offline, accept, sync later | UI shows prepared then transport_acknowledged; confirmed only after provider confirmation received |
| TEST-PS-032-09.T14 | integration | PS-032-10.R01, PS-032-10.R02, PS-032-10.R03 | export, import into fresh vault, restore | records round-trip identical; in-flight statements re-enter outbox as prepared |
| TEST-PS-032-09.T15 | e2e | PS-032-01.R01, PS-032-03.R02 | mobile client requests, provider quotes and confirms in a second browser context | both show confirmed; axe zero serious issues |
| TEST-PS-032-09.T16 | integration | PS-032-07.R02 | full flow with a description and an attachment, then inspect the diagnostics log and every notification payload | no description or attachment text or name, only references and template keys |
| TEST-PS-032-09.T17 | property | PS-032-01.R02 | random hourly rates and estimatedMinutes | total equals rate times estimatedMinutes divided by 60 rounded HALF_EVEN through F09.S03.M03 and is computed once |
| TEST-PS-032-09.T18 | integration | PS-032-04.R01 | crash injected between statement signing and the sync outbox write for every command | neither the state change nor the outbox entry persists |
| TEST-PS-032-09.T19 | integration | PS-032-03.R04 | two vaults; provider confirmation delayed by 8 h past the client timeout, and a second run with skewed clocks | client signs a confirmation_timeout cancellation at 24 h; provider refuses confirm after receipt plus 24 h minus 5 min; a crossing confirmation moves the provider booking to conflicted with the slot committed and the client booking shows both statements; nothing quarantined |
| TEST-PS-032-09.T20 | integration | PS-032-03.R05 | dispute opened on confirmed and on in_progress bookings, then each F09 resolution (no_fault_close, refund_claimed, return_agreed, enforcement_referral, lapsed), a resolution carrying a cancelled disposition, and a withdrawal | booking returns to its pre-dispute status; the cancelled disposition only prompts a mutual cancellation; no obligation or fee changes; completed and cancelled bookings get only the overlay |
| TEST-PS-032-09.T21 | integration | PS-032-03.R06 | propose mutual cancellation of an in_progress booking, counter-sign it, and a run where verify reports conflicted | cancelled only when verify is valid for both; conflicted consent moves the booking to conflicted |
| TEST-PS-032-09.T22 | integration | PS-032-03.R03 | quote valid 72 h accepted at hour 71 and confirmed at hour 80 | hold extended on acceptance receipt; booking confirmed with the slot committed |
| TEST-PS-032-09.T23 | abuse | PS-032-05.R02 | provider-signed booking_cancellation with reason client_request; client-signed quote_decline with reason provider_request | both quarantined with SERVICES_STATEMENT_INVALID; no fee assigned |
| TEST-PS-032-09.T24 | abuse | PS-032-07.R03 | 60 requests from 60 fresh DIDs in one day, and a second open request from one client for the same offering | 10 queued as first contact without notifications, the rest dropped and counted; the duplicate refused on ingest |
| TEST-PS-032-09.T25 | contract | PS-032-04.R04 | every produced event against the F13.S01.M03 routing table and the F03.S01.M02 consumer | clientId and providerId present where routed; services.booking.cancelled carries quoteId and slotHoldId |
| TEST-PS-032-09.T26 | integration | PS-032-04.R03 | services.offering.withdrawn with an open request and an issued quote; services.availability.changed for the hold of an issued quote | request cancelled offering_withdrawn, quote withdrawn by a signed quote_decline, hold released, confirmed bookings unchanged; affected quote flagged needsReconfirmation |
| TEST-PS-032-09.T27 | integration | PS-032-07.R05 | block added then statements from the blocked DID; privacy.deletion.completed for the counterparty; export | statements dropped with no reply; counterparty pseudonymized; export section services.bookings present |
| TEST-PS-032-09.T28 | abuse | PS-032-07.R06 | request description containing a street address; L4 share sent after booking | warning shown before sending; share TTL ≤ 24 h, purged at TTL and absent from the evidence pack |
| TEST-PS-032-09.T29 | abuse | PS-032-01.R03 | booking_confirmation whose plan changes one milestone amount | quarantined with SERVICES_STATEMENT_INVALID; booking stays awaiting_confirmation |
| TEST-PS-032-09.T30 | contract | PS-032-04.R05 | provider confirms a booking and the client vault ingests the confirmation; both services.booking.confirmed events checked against the F07.S03.M01 consumer schema | each carries contextId = bookingId, contextType booking, contextCid = confirmationCid and parties with exactly one client and one provider DID; both vaults emit identical values |

## Acceptance criteria

- All tests T01–T30 pass in CI.
- No booking is ever shown as confirmed without the provider's verified signed confirmation held in the vault.
- Duplicated, reordered or replayed statements never change state twice, and a booking never stays disputed after its case is resolved or withdrawn.

## Dependencies

Module depends on: F03.S01.M01, F03.S01.M02, F08.S01.M01, F08.S01.M03, F08.S02.M02, F07.S01.M01, F07.S02.M02, F11.S01.M03, F09.S03.M01, F09.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
