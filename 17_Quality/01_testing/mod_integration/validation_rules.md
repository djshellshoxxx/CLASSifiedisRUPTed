# PS-135-02 — Validation rules: Integration testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M03 Integration testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/integration` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-135-02.R01** Each flow suite must assert the final state, the ordered list of emitted event types and that no unexpected event types appear.
- **PS-135-02.R02** The harness rejects a flow that makes a real network call, writes outside the temp directory or uses a real clock with QUALITY_IT_ISOLATION.
- **PS-135-02.R03** Contract validation fails with a typed code when a command, event or error does not match its registered schema or CTR-ERR-001 shape.
- **PS-135-02.R04** Trust-fault suites are mandatory and this module owns their single oracle: relay_down (local records intact, the OutboxEntry stays prepared until a verified receipt, the flow completes after direct exchange or relay restart); fork_conflict (fork detected, coordination frozen, no last-writer-wins); revocation_lag (receipt-time cases of the revocation edge case, F11.S01.M02 and F16.S02.M02); relay_tamper (FED_SIGNATURE_INVALID, quarantined with provenance, no state change); signer_role_mismatch (quarantined with reason signer_role_invalid, no state change); relay_replay (one effect by cid; other context or after expiresAt rejected); relay_withhold_equivocate (gap detected, chainGap after 24 h, dropped tombstone applied once fetched from the author). In every suite no sync state or label exceeds the state reached.
- **PS-135-02.R05** Statement contract checks run per F11.S01.M01 registry entry: required signer role, payload schema classrup.<slug>.<entity>/vN, cid per FED-7, ext at most 4 KiB with unknown payload keys outside ext rejected (SCH-2), and a negative case signed by the wrong role that must be quarantined.
- **PS-135-02.R06** Flow reports and UI-facing statuses never use verified or paid as a state; payment steps use only CTR-COM-001 COM-3 states and catalog payment events, and a report that contains either word as a state fails the lint.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | Each of the 12 reference flows exists, runs and asserts final state, events and drained outbox | QUALITY_IT_FLOW_MISSING |
| V02 | Flow makes no outbound network call, uses only the injected clock and writes only to its temp dir | QUALITY_IT_ISOLATION |
| V03 | Every emitted event type is registered in the catalog and its payload validates against its schema | QUALITY_IT_EVENT_UNREGISTERED |
| V04 | Every command output and error response validates against the registry and CTR-ERR-001 | QUALITY_IT_CONTRACT_MISMATCH |
| V05 | Outbox and inbox are empty at the end of each flow | QUALITY_IT_OUTBOX_NOT_DRAINED |
| V06 | Each flow runs in relay mode and, unless the flow mode table (04.R04) marks the flow or step relay-only, in direct mode with identical final states per vault | QUALITY_IT_MODE_DIVERGENCE |
| V07 | Trust-fault suites relay_down, fork_conflict, revocation_lag, relay_tamper, signer_role_mismatch, relay_replay and relay_withhold_equivocate exist and pass with the oracle of 02.R04 | QUALITY_IT_FAULT_SUITE_MISSING |
| V08 | Every statement type sent in any flow is registered in the statement registry with its required signer role, its payload validates against classrup.<slug>.<entity>/vN, its cid matches FED-7 and ext is at most 4 KiB | QUALITY_IT_STATEMENT_UNREGISTERED |
| V09 | No flow report or UI-facing status uses verified or paid as a state and no sync state is reported above the state reached | QUALITY_IT_OVERCLAIM |
| V10 | No relay ever receives a classrup-export/v1 bundle or P2+ plaintext; after every flow relay storage holds only signed P0 projections, ciphertext envelopes, receipts and relay-local data | QUALITY_IT_RELAY_PRIVATE_DATA |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-135-09.T03 | integration | PS-135-02.R01, PS-135-04.R02, PS-135-04.R04 | list flows from the harness | exactly the 12 documented flow names exist, each mapped to its FLOW-nn ID and mode exactly as the flow mode table, and each asserts state, ordered events and no unexpected events |
| TEST-PS-135-09.T04 | integration | PS-135-02.R02 | flow attempts fetch to a public URL and Date.now | QUALITY_IT_ISOLATION raised, exit 3 |
| TEST-PS-135-09.T05 | contract | PS-135-02.R03, PS-135-09.R03 | validate every registered command, event and error | all validate; a mutated schema produces QUALITY_IT_CONTRACT_MISMATCH |
| TEST-PS-135-09.T17 | integration | PS-135-03.R02, PS-135-02.R06 | payments_claims - cash claim acknowledged by the payee; crypto claim under the BTC 6-confirmation policy with reorg depth 2 at 3 of 6; a vault with no verifier configured | events follow commerce.payment.claimed, confirming, confirmed, reorged, confirming, finalized; after the reorg the claim returns to pending_confirmation; the deal does not complete at 5 of 6; it completes only when both vaults' verifiers report final and the payee-signed payment_ack with verification.source chain is received; the unverified vault shows claimed (unverified); no step is named verified or paid; platform never holds funds |
| TEST-PS-135-09.T18 | integration | PS-135-02.R01 | fraud_moderation and messages_private flows | moderation action recorded with audit entry; message payloads absent from public views |
| TEST-PS-135-09.T20 | integration | PS-135-02.R04, PS-135-06.R04 | relay_down - stop relay between prepared and transport_acknowledged | local records intact; OutboxEntry stays prepared (Saved on this device); completes via direct exchange; after every step no vault label exceeds the reached state (no Reached relay before a verified receipt, no Confirmed by peer before peer_accepted) |
| TEST-PS-135-09.T21 | integration | PS-135-02.R04 | fork_conflict - two signed conflicting classrup.bazaar.reservation/v1 statements delivered in both orders | fork detected and coordination frozen in both vaults; no resolve option picks a winner; no last-writer-wins |
| TEST-PS-135-09.T22 | integration | PS-135-02.R04 | revocation_lag with FakeClock - (a) statement received before the revocation arrives and before revocationEffectiveFrom; (b) received after the revocation arrives with a backdated createdAt; (c) received inside [effectiveFrom, arrival]; (d) revocation whose effectiveFrom is 31 days back | (a) stays accepted and valid; (b) refused with FEDERATION_SIGNER_ROLE_INVALID and listed in quarantine with reason signer_key_revoked; (c) re-marked signed during claimed compromise and its dependent coordination frozen; (d) VALIDATION_FAILED; the reported lag is arrival minus effectiveFrom and at most 30 days |
| TEST-PS-135-09.T23 | abuse | PS-135-02.R04 | relay_tamper - relay flips one byte of an envelope | FED_SIGNATURE_INVALID, statement quarantined with provenance, no state change |
| TEST-PS-135-09.T24 | contract | PS-135-02.R05 | one generated row per statement registry entry, plus per entry a case signed by the wrong role, a payload with an unknown key outside ext and an ext of 5 KiB; then a flow sending an unregistered type | every registered type validates (signer role, payload schema, FED-7 cid, ext at most 4 KiB); wrong-role cases quarantined; unknown key gives VALIDATION_FAILED; oversize ext rejected; the unregistered type fails with QUALITY_IT_STATEMENT_UNREGISTERED |
| TEST-PS-135-09.T25 | abuse | PS-135-05.R01, PS-135-02.R04 | signer_role_mismatch - a correctly signed classrup.bazaar.offer_decision/v1 acceptance made by a key that is not the listing author is delivered to the buyer vault | quarantined with reason signer_role_invalid; no Deal, no hold and no state change |
| TEST-PS-135-09.T26 | abuse | PS-135-02.R04 | relay_replay - re-deliver an old accepted offer envelope 3 times, replay it into another listing context, and deliver it after its expiresAt | one effect (dedupe by cid); the other-context replay is rejected; after expiry it is rejected with EXPIRED; no state change |
| TEST-PS-135-09.T27 | abuse | PS-135-02.R04, PS-135-06.R04 | relay_withhold_equivocate - the relay serves vaults Bob and Carol different index views of one author chain, withholds seq 4 and drops an author tombstone | the gap is detected and released with chainGap after 24 h of FakeClock; the tombstone is applied once fetched from the author; no vault shows more than its reached sync state |
| TEST-PS-135-09.T28 | abuse | PS-135-02.R06, PS-135-06.R04 | overclaim lint - a flow report fixture using verified and paid as state names, and a vault label planted as Confirmed by peer while the entry is transport_acknowledged | each fails with QUALITY_IT_OVERCLAIM |

## Dependencies

Module depends on: CTR-TST-001, CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-IDM-001, CTR-COM-001, CTR-FED-001, CTR-ID-001, CTR-PRV-001, CTR-CAP-001, CTR-IOX-001, F17.S01.M01, F15.S02.M02, F15.S02.M03, F15.S01.M01, F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S02.M01, F11.S02.M03, F09.S01.M01, F09.S01.M03, F16.S02.M02, F07.S02.M01, F10.S01.M03, F06.S02.M01. Predecessor: [domain_schema.md](domain_schema.md).
