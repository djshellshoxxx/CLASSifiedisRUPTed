# PS-032-07 — Privacy, retention and abuse: Service quotes and booking

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M01 Service quotes and booking](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/quotes` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-032-07.R01** Requests, quotes and bookings are P2 and travel only as end-to-end encrypted envelopes to the two participants; relays see ciphertext and routing metadata only.
- **PS-032-07.R02** Descriptions and attachments never enter public projections, logs or notifications; notifications carry a reference and a template key only.
- **PS-032-07.R03** Spam requests and phishing text are limited by local quotas, receiver-side filtering and relay hosting policy; no global enforcement is claimed.

## Specification

**Data classification**
- QuoteRequest, ServiceQuote, Booking: P2 (client and provider vaults).
- Client exact address, if any, is shared in the encrypted thread by explicit user action (L3 at most by default); never in these records.

**Retention**
- Terminal requests, quotes and bookings: RET-EVIDENCE (2 years after last related activity).
- Quarantined statements: RET-SHORT (30 days) with the failure code, then purged.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Forged acceptance or confirmation | Ed25519 signature over JCS bytes, signer must equal the request author or offering provider key, cid binding to the exact quote |
| T02 | Request flooding of a provider | per-sender quota 20 inbound requests per day in the receiving vault, 5 open requests per client, relay mailbox quotas, local block |
| T03 | Backdated cancellation to dodge a fee | effective time is the claimed time only when within 72 h before the receipt time, otherwise the receipt time; relay-signed receipt time is evidence of that relay clock only; disputes go to F03.S02.M03 |
| T04 | Provider double-sells one slot to two clients | overlap check and hold inside the provider vault; second acceptance is refused with a signed slot_taken cancellation; clients see awaiting confirmation until the provider signs |
| T05 | Phishing links in descriptions | descriptions are plain text, links are not rendered as links, report or locally hide actions |

**Abuse controls**
- Local per-sender quotas and quarantine for malformed or unauthorized statements.
- Relay hosting policy may rate limit mailbox writes; this module surfaces refusals in the sync state.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-032-09.T07 | abuse | PS-032-05.R01, PS-032-05.R02, PS-032-05.R03, PS-032-07.R01 | acceptance signed by a third key; confirmation signed by the client; relay tries to alter ciphertext | all quarantined with SERVICES_STATEMENT_INVALID; no state change; relay cannot read descriptions |
| TEST-PS-032-09.T08 | integration | PS-032-06.R02, PS-032-07.R02 | two clients accept two quotes for one slot; forked provider devices sign two confirmations | second acceptance refused slot_taken; forked confirmations freeze booking and require renegotiation |
| TEST-PS-032-09.T09 | integration | PS-032-01.R02, PS-032-03.R01, PS-032-07.R03 | acceptance arrives 6 minutes after validUntil by provider clock | refused EXPIRED; quote shown expired; no booking confirmed |
| TEST-PS-032-09.T10 | property | PS-032-06.R01, PS-032-07.R03 | cancellation times around the 24 h boundary and with backdated claims | fee follows the policy and the 72 h rule; amounts HALF_EVEN and never exceed total times lateFeeBps |
| TEST-PS-032-09.T11 | abuse | PS-032-07.R03, PS-032-07.R01 | 21 inbound requests in a day from one sender | 21st dropped and counted; sender remains quarantined for the day |

## Dependencies

Module depends on: F03.S01.M01, F03.S01.M02, F09.S01.M01, F08.S01.M01, F07.S01.M01, F07.S02.M02, F11.S01.M03, F09.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
