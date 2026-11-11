# PS-032-07 — Privacy, retention and abuse: Service quotes and booking

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M01 Service quotes and booking](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/quotes` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-032-07.R01** Requests, quotes and bookings are P2 and travel only as end-to-end encrypted envelopes to the two participants; relays see ciphertext and routing metadata only.
- **PS-032-07.R02** Descriptions and attachments never enter public projections, logs or notifications; notifications carry a reference and a template key only.
- **PS-032-07.R03** Spam requests, Sybil floods from fresh DIDs and phishing text are limited by receiving-vault caps across all senders, first-contact queuing, local quotas, receiver-side filtering and relay hosting policy; no global enforcement is claimed.
- **PS-032-07.R04** Late-fee claims are computed from delivery evidence both parties can check (the earliest relay-signed receipt time from a relay the canceller selected, else the receiving vault receipt time), the claimed signing time counts only within the 5 minute skew tolerance, and the signed cancellation carries one fee number the counterparty accepts or disputes through F03.S02.M03 (scope cancellation_fee).
- **PS-032-07.R05** The module registers ExportSectionPort (section services.bookings), DeletionPort and RetentionPurgePort with F10 (N6), classifies fields with F10.S02.M02, drops statements from blocked DIDs at ingestion (N7) and pseudonymizes the counterparty on privacy.deletion.completed.
- **PS-032-07.R06** An on-site address is never stored in these records - it is shared only as an L4 location share (F06.S02.M02) through the encrypted F08 thread with a TTL of at most 24 h, stored P3 in the provider vault, purged at TTL and excluded from evidence packs; L3 is the default disclosure before booking and the request sheet warns when a description looks like a street address.

## Specification

**Data classification**
- QuoteRequest, ServiceQuote, Booking: P2 (client and provider vaults), fields classified with F10.S02.M02.
- On-site address: L4 share (F06.S02.M02) over the F08 encrypted thread, TTL ≤ 24 h, P3 in the provider vault, purged at TTL, excluded from evidence packs; L3 area by default before booking; never in these records.
- Descriptions: P2 free text kept RET-EVIDENCE; a local address-pattern check warns before sending.

**Retention**
- Terminal requests, quotes and bookings: RET-EVIDENCE (2 years after last related activity), purged through the RetentionPurgePort.
- Quarantined statements: RET-SHORT (30 days) with the failure code, then purged.
- On privacy.deletion.completed: the counterparty DID is replaced with the deletion pseudonym; signatures are kept and flagged unverifiable-after-pseudonymization.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Forged acceptance or confirmation | Ed25519 signature over JCS bytes, signer must equal the request author or offering provider key, cid binding to the exact quote, acceptance consent verified through comms.consent.verify |
| T02 | Request flooding of a provider, including Sybil floods from fresh DIDs | receiving-vault caps of 50 inbound requests per day overall, 10 per day from DIDs with no prior interaction and 20 per sender, first-contact requests queued without per-item notifications, one open request per (clientId, offeringId) enforced on ingest, relay mailbox quotas, local block |
| T03 | Backdated cancellation to dodge a fee | effective time is the earlier of the provider vault receipt time and the earliest relay-signed receipt time from a relay the client selected; the claimed time counts only within 5 minutes of that evidence; the statement carries one fee number; disagreements go to F03.S02.M03 scope cancellation_fee |
| T04 | Provider double-sells one slot to two clients | overlap check and hold inside the provider vault; the other acceptance is refused with a signed slot_taken cancellation; clients see awaiting confirmation until the provider signs |
| T05 | Phishing links in descriptions | descriptions are plain text, links are not rendered as links, report or locally hide actions |
| T06 | A party signs a statement framed as the other role, for example a provider-signed client_request cancellation that assigns a late fee to the client | role derived from the signer key; reasons restricted per signer (V12); mismatches quarantined with SERVICES_STATEMENT_INVALID |
| T07 | Vaults diverge silently after the confirmation timeout | the timing-out vault signs and sends a confirmation_timeout cancellation, the provider refuses to confirm after receipt plus 24 h minus 5 min, crossings freeze the booking as conflicted |

**Abuse controls**
- Local per-sender quotas, a vault-wide inbound cap across all senders and quarantine for malformed or unauthorized statements.
- First-contact queue lets the provider accept or drop queued requests in bulk; nothing in it notifies per item.
- Relay hosting policy may rate limit mailbox writes; this module surfaces refusals in the sync state.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-032-09.T07 | abuse | PS-032-05.R01, PS-032-05.R02, PS-032-05.R03, PS-032-07.R01 | acceptance signed by a third key; confirmation signed by the client; relay tries to alter ciphertext | all quarantined with SERVICES_STATEMENT_INVALID; no state change; relay cannot read descriptions |
| TEST-PS-032-09.T10 | property | PS-032-07.R04 | cancellation times around the free-cancellation boundary with backdated claims, including a claim 30 h before start received 1 h before start | fee follows the policy at the evidence time, claimed time used only within 5 minutes, HALF_EVEN and never above total times lateFeeBps; both vaults store the same lateFeeClaim from the statement and the receiving vault flags the disagreement |
| TEST-PS-032-09.T11 | abuse | PS-032-07.R03 | 21 inbound requests in a day from one sender | 21st dropped and counted; sender remains quarantined for the day |
| TEST-PS-032-09.T16 | integration | PS-032-07.R02 | full flow with a description and an attachment, then inspect the diagnostics log and every notification payload | no description or attachment text or name, only references and template keys |
| TEST-PS-032-09.T24 | abuse | PS-032-07.R03 | 60 requests from 60 fresh DIDs in one day, and a second open request from one client for the same offering | 10 queued as first contact without notifications, the rest dropped and counted; the duplicate refused on ingest |
| TEST-PS-032-09.T27 | integration | PS-032-07.R05 | block added then statements from the blocked DID; privacy.deletion.completed for the counterparty; export | statements dropped with no reply; counterparty pseudonymized; export section services.bookings present |
| TEST-PS-032-09.T28 | abuse | PS-032-07.R06 | request description containing a street address; L4 share sent after booking | warning shown before sending; share TTL ≤ 24 h, purged at TTL and absent from the evidence pack |

## Dependencies

Module depends on: F03.S01.M01, F03.S01.M02, F08.S01.M01, F08.S01.M03, F08.S02.M02, F07.S01.M01, F07.S02.M02, F11.S01.M03, F09.S03.M01, F09.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
