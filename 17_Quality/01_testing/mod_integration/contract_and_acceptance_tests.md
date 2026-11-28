# PS-135-09 — Contract and acceptance tests: Integration testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M03 Integration testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/integration` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-135-09.R01** Every requirement of this module is covered by at least one automated test using the mapping in section 09.
- **PS-135-09.R02** Each of the 12 flows has at least one dedicated test row and the flow list is asserted against the reference list in this spec.
- **PS-135-09.R03** Contract tests are generated from the schema registry so a new registered command or event is covered automatically.

## Specification

See the module test table below (all processes).

**Fixtures:** Vaults for Alice, Bob, Carol, Dave, Erin (one memory vault each, seeded Ed25519 keys) plus a fresh vault Alice' on a second simulated device, optional in-process relays R1 and R2 (R2 peers with R1), DirectTransport, FakeClock 2026-11-04T10:00:00Z, FakeChainVerifierPort script under the BTC finality policy of 6 confirmations (1 to 3 confirmations, reorg depth 2, then 1 to 6 again), one vault with no verifier configured, P3-marked canaries (L4 point 52.51630,13.37770 and L3 cell u33dbf), a malicious relay wrapper (tamper, replay, withhold, equivocate, drop tombstone), EUR and BTC test amounts.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-135-09.T01 | integration | PS-135-01.R01, PS-135-03.R03 | boot harness and tear down 20 times | each database is isolated and removed; outbox drained assertion runs |
| TEST-PS-135-09.T02 | integration | PS-135-01.R02, PS-135-01.R03, PS-135-07.R01 | run flows and inspect reports | no row writes by fixtures in flow files; report holds only step names, types, IDs |
| TEST-PS-135-09.T03 | integration | PS-135-02.R01, PS-135-04.R02, PS-135-04.R04 | list flows from the harness | exactly the 12 documented flow names exist, each mapped to its FLOW-nn ID and mode exactly as the flow mode table, and each asserts state, ordered events and no unexpected events |
| TEST-PS-135-09.T04 | integration | PS-135-02.R02 | flow attempts fetch to a public URL and Date.now | QUALITY_IT_ISOLATION raised, exit 3 |
| TEST-PS-135-09.T05 | contract | PS-135-02.R03, PS-135-09.R03 | validate every registered command, event and error | all validate; a mutated schema produces QUALITY_IT_CONTRACT_MISMATCH |
| TEST-PS-135-09.T06 | integration | PS-135-03.R01, PS-135-03.R02, PS-135-04.R01 | run barter_two, cycle_three, cycle_four, cycle_n, barter_mixed to completion and to expiry | terminal states reached or expired exactly once |
| TEST-PS-135-09.T07 | integration | PS-135-04.R03, PS-135-06.R03 | run with scripted consumer crash and redelivery | single net effect and outbox drained |
| TEST-PS-135-09.T08 | integration | PS-135-05.R02 | each flow performs a wrong-actor vault command step | FORBIDDEN or NOT_FOUND per ERR-4 |
| TEST-PS-135-09.T09 | abuse | PS-135-05.R03, PS-135-07.R02, PS-135-07.R03 | import fake port from production code; capture relay logs during every flow and scan them for the P3 canary | import rejected; canary absent from captured relay logs, exports and P0 payloads |
| TEST-PS-135-09.T10 | integration | PS-135-06.R01 | replay first mutating command in each flow | identical response and zero new events |
| TEST-PS-135-09.T11 | integration | PS-135-06.R02 | two concurrent offer acceptances with the deterministic scheduler | same interleaving every run; exactly one accepted |
| TEST-PS-135-09.T12 | integration | PS-135-08.R01, PS-135-08.R02 | run full suite with timing report | each flow at most 5 s, whole suite at most 120 s, report lists durations |
| TEST-PS-135-09.T13 | integration | PS-135-08.R03 | boot relay harness 50 times | startup at most 2 s each |
| TEST-PS-135-09.T14 | integration | PS-135-09.R01, PS-135-09.R02, PS-135-04.R04 | assert the flow list and the flow mode table equal the reference in this spec and every spec requirement maps to a test | no missing flow, no mode mismatch and no uncovered requirement |
| TEST-PS-135-09.T15 | integration | PS-135-10.R01, PS-135-10.R02 | federation_io - (a) federation step: vault Alice publishes P0/L2 envelopes to R1, R1 federates signed batches of at most 100 to R2, then a duplicate cid, an author tombstone and a forged envelope are sent; (b) portability step: export classrup-export/v1 from memory vault Alice and import into the fresh vault Alice' | (a) R2 holds read-only mirrors with provenance, the duplicate is deduped by cid, the tombstone is applied within 24 h of FakeClock, the forged envelope is rejected with FED_SIGNATURE_INVALID; (b) IOX-2 dry-run report before commit, identical records skipped, conflicting IDs rejected, records and signatures intact in Alice'; no relay ever received the IOX-1 bundle; report contains no user data |
| TEST-PS-135-09.T16 | integration | PS-135-10.R03 | revert harness commit in a branch | production tests unaffected |
| TEST-PS-135-09.T17 | integration | PS-135-03.R02, PS-135-02.R06 | payments_claims - cash claim acknowledged by the payee; crypto claim under the BTC 6-confirmation policy with reorg depth 2 at 3 of 6; a vault with no verifier configured | events follow commerce.payment.claimed, confirming, confirmed, reorged, confirming, finalized; after the reorg the claim returns to pending_confirmation; the deal does not complete at 5 of 6; it completes only when both vaults' verifiers report final and the payee-signed payment_ack with verification.source chain is received; the unverified vault shows claimed (unverified); no step is named verified or paid; platform never holds funds |
| TEST-PS-135-09.T18 | integration | PS-135-02.R01 | fraud_moderation and messages_private flows | moderation action recorded with audit entry; message payloads absent from public views |
| TEST-PS-135-09.T19 | integration | PS-135-04.R04 | run all flows with --mode relay and --mode direct | same final vault state in both modes except the flows and steps the flow mode table marks relay-only; QUALITY_IT_MODE_DIVERGENCE otherwise |
| TEST-PS-135-09.T20 | integration | PS-135-02.R04, PS-135-06.R04 | relay_down - stop relay between prepared and transport_acknowledged | local records intact; OutboxEntry stays prepared (Saved on this device); completes via direct exchange; after every step no vault label exceeds the reached state (no Reached relay before a verified receipt, no Confirmed by peer before peer_accepted) |
| TEST-PS-135-09.T21 | integration | PS-135-02.R04 | fork_conflict - two signed conflicting classrup.bazaar.reservation/v1 statements delivered in both orders | fork detected and coordination frozen in both vaults; no resolve option picks a winner; no last-writer-wins |
| TEST-PS-135-09.T22 | integration | PS-135-02.R04 | revocation_lag with FakeClock - (a) statement received before the revocation arrives and before revocationEffectiveFrom; (b) received after the revocation arrives with a backdated createdAt; (c) received inside [effectiveFrom, arrival]; (d) revocation whose effectiveFrom is 31 days back | (a) stays accepted and valid; (b) refused with FEDERATION_SIGNER_ROLE_INVALID and listed in quarantine with reason signer_key_revoked; (c) re-marked signed during claimed compromise and its dependent coordination frozen; (d) VALIDATION_FAILED; the reported lag is arrival minus effectiveFrom and at most 30 days |
| TEST-PS-135-09.T23 | abuse | PS-135-02.R04 | relay_tamper - relay flips one byte of an envelope | FED_SIGNATURE_INVALID, statement quarantined with provenance, no state change |
| TEST-PS-135-09.T24 | contract | PS-135-02.R05 | one generated row per statement registry entry, plus per entry a case signed by the wrong role, a payload with an unknown key outside ext and an ext of 5 KiB; then a flow sending an unregistered type | every registered type validates (signer role, payload schema, FED-7 cid, ext at most 4 KiB); wrong-role cases quarantined; unknown key gives VALIDATION_FAILED; oversize ext rejected; the unregistered type fails with QUALITY_IT_STATEMENT_UNREGISTERED |
| TEST-PS-135-09.T25 | abuse | PS-135-05.R01, PS-135-02.R04 | signer_role_mismatch - a correctly signed classrup.bazaar.offer_decision/v1 acceptance made by a key that is not the listing author is delivered to the buyer vault | quarantined with reason signer_role_invalid; no Deal, no hold and no state change |
| TEST-PS-135-09.T26 | abuse | PS-135-02.R04 | relay_replay - re-deliver an old accepted offer envelope 3 times, replay it into another listing context, and deliver it after its expiresAt | one effect (dedupe by cid); the other-context replay is rejected; after expiry it is rejected with EXPIRED; no state change |
| TEST-PS-135-09.T27 | abuse | PS-135-02.R04, PS-135-06.R04 | relay_withhold_equivocate - the relay serves vaults Bob and Carol different index views of one author chain, withholds seq 4 and drops an author tombstone | the gap is detected and released with chainGap after 24 h of FakeClock; the tombstone is applied once fetched from the author; no vault shows more than its reached sync state |
| TEST-PS-135-09.T28 | abuse | PS-135-02.R06, PS-135-06.R04 | overclaim lint - a flow report fixture using verified and paid as state names, and a vault label planted as Confirmed by peer while the entry is transport_acknowledged | each fails with QUALITY_IT_OVERCLAIM |
| TEST-PS-135-09.T29 | abuse | PS-135-07.R01, PS-135-07.R02 | canary leak - P3-marked L4 meetup point and L3 cell seeded in vaults during sale_local and cycle_three | public views, search documents, federation envelopes, relay storage and logs hold only cells of at most 5 characters; the canaries are absent |
| TEST-PS-135-09.T30 | integration | PS-135-10.R02 | run every flow in both modes and scan relay storage and every request body the relays received | no classrup-export/v1 bundle and no P2+ plaintext reached any relay; a planted upload fails with QUALITY_IT_RELAY_PRIVATE_DATA |

## Acceptance criteria

- All 12 reference flows pass with outbox drained and zero unexpected events.
- Contract tests validate every registered command, event and error against the schema registry.
- The crypto claim flow demonstrates a simulated reorg returning the claim to pending_confirmation, and the deal completes only after final per both vaults' verifiers and the payee-signed payment_ack.
- Every trust-fault suite passes with its single oracle, every sent statement type passes the registry contract, and no relay ever receives an export bundle or P2+ plaintext.
- The full integration suite finishes within 120 s on 2 vCPU.

## Dependencies

Module depends on: CTR-TST-001, CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-IDM-001, CTR-COM-001, CTR-FED-001, CTR-ID-001, CTR-PRV-001, CTR-CAP-001, CTR-IOX-001, F17.S01.M01, F15.S02.M02, F15.S02.M03, F15.S01.M01, F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S02.M01, F11.S02.M03, F09.S01.M01, F09.S01.M03, F16.S02.M02, F07.S02.M01, F10.S01.M03, F06.S02.M01. Predecessor: [domain_schema.md](domain_schema.md).
