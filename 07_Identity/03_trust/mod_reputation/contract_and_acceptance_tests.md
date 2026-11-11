# PS-058-09 — Contract and acceptance tests: Reputation

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S03.M01 Reputation](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/trust/reputation` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-058-09.R01** Every requirement is covered by at least one automated test with fixed key pairs and an injected clock.
- **PS-058-09.R02** Golden vectors pin the dampening formula, the input selection and the Bayesian average.
- **PS-058-09.R03** Privacy and abuse tests simulate sybil rings and fabricated completions.
- **PS-058-09.R04** Abuse tests cover a withheld completion signature, burial by 500 sybil reviews, relay-signed tombstones and review unlinkability within one cycle.
- **PS-058-09.R05** Accessibility and UI copy tests check the review sheet and reputation card, including the dampening honesty text, outcome labels and the source note.

## Specification

See the module test table below (all processes).

**Fixtures:** Principal P, counterparties Q and R, cycle of four DIDs A,B,C,D with legs A to B, B to C, C to D, D to A, opening, completion and recovery event fixtures published by F09.S01.M01, F02.S03.M04, F03.S02.M02, F05.S02.M02 and F09.S02.M02 with their completion statements (deal_completion, booking_completion, rental_completion, return_report, return_attestation, handover attestations) in a record store stub, signed tickets, sybil ring of 5 new DIDs, golden review set of 100 reviews with known weights, relay R1 tombstone signer, fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-058-09.T01 | integration | PS-058-01.R02, PS-058-04.R02 | opening events then completion events for a deal, a cycle, a booking and a rental | pending windows with tickets exchanged for eligible pairs, then open windows with the documented pairs and closesAt = opensAt plus 30 days |
| TEST-PS-058-09.T02 | unit | PS-058-01.R01, PS-058-02.R01 | post a valid review | statement signed by an active device key, stored posted, immutable fields unchanged, outcome label set, cid computed |
| TEST-PS-058-09.T03 | unit | PS-058-02.R01, PS-058-02.R02 | bad signature, missing ticket, ticket naming another holder, non-adjacent cycle pair, duplicate for the pair, 40 days late, rating 6 | the documented error or quarantine reason each time |
| TEST-PS-058-09.T04 | property | PS-058-03.R01, PS-058-03.R02, PS-058-03.R03 | random sequences of receive, hide, unhide, withdraw, relay tombstones, window outcomes and expiry | only declared transitions succeed; withdrawn is final; quarantined can re-verify; relay actions change no review |
| TEST-PS-058-09.T05 | unit | PS-058-01.R03, PS-058-09.R02 | golden review set with no-show claims | reviewCount raw, selection, effectiveWeight and bayesianAvg equal golden values within 1e-9; no-show claims leave the average unchanged; recompute twice gives identical results |
| TEST-PS-058-09.T06 | abuse | PS-058-07.R02, PS-058-09.R03 | ring of 5 new DIDs posting 30 five-star reviews about one subject | effective weight is under 15 percent of raw, dampeningNotice is island or many_new_authors, raw count and source count still displayed |
| TEST-PS-058-09.T07 | abuse | PS-058-09.R03, PS-058-02.R02 | collusion pair posts 6 reviews on fabricated contexts with tickets from their own keys | repeat and reciprocity weights reduce them; a second review for the same pairRef is refused as a duplicate |
| TEST-PS-058-09.T08 | contract | PS-058-04.R01, PS-058-04.R03 | commands, queries and events run | outputs, statements, tickets and payloads validate against registry schemas; tombstone verifies; events in the same transaction |
| TEST-PS-058-09.T09 | abuse | PS-058-05.R01, PS-058-05.R03 | locked vault posts; non-author withdraws; relay edits a stored review | FORBIDDEN; NOT_FOUND or FORBIDDEN; edit breaks the signature and is rejected |
| TEST-PS-058-09.T10 | chaos | PS-058-06.R01, PS-058-06.R02, PS-058-06.R03 | duplicate delivery of reviews and tickets, crash during recompute, offline post then reconnect | one review and one ticket, summary rebuilt, outbox states honest, unverified reviews never counted |
| TEST-PS-058-09.T11 | abuse | PS-058-02.R03, PS-058-05.R02, PS-058-07.R01 | 31 reviews in 24 hours by one author; 201 received per hour from one source; a subject_only review read without the subject key; a comment containing a phone number | RATE_LIMITED for the 31st and excess quarantined; the subject_only review is unreadable; the composer warns about the contact data before signing |
| TEST-PS-058-09.T12 | load | PS-058-08.R01, PS-058-08.R02, PS-058-08.R03 | verify 1 000 reviews and recompute a 500 review subject on emulated Moto G | verify p95 <= 15 ms, recompute p95 <= 20 ms; counters carry no DIDs |
| TEST-PS-058-09.T13 | a11y | PS-058-09.R05 | review sheet and reputation card with axe-core and keyboard only | zero serious or critical issues; star group labelled; notices announced |
| TEST-PS-058-09.T14 | unit | PS-058-09.R01 | traceability run over PS-058 | every requirement maps to a passing test |
| TEST-PS-058-09.T15 | integration | PS-058-10.R01, PS-058-10.R02, PS-058-10.R03 | export, import to a fresh vault, tombstone after import, and recompute with the previous algorithmVersion | reviews and windows re-verified and round-trip; summary rebuilt; withdrawn review removed from the summary; previous version reproduces the old results |
| TEST-PS-058-09.T16 | abuse | PS-058-03.R02, PS-058-09.R04 | a tombstone targeting Q's public review signed by origin relay R1, then one signed by Q's device key | after the relay tombstone the review stays posted and only R1 leaves provenance and sourceCount; Q's tombstone withdraws it |
| TEST-PS-058-09.T17 | integration | PS-058-03.R02, PS-058-05.R03 | relay R1 stops serving a review copy and answers with a signed not-served statement | vault review stays posted, notServedBy records R1, sourceCount drops by one, the review is never excluded |
| TEST-PS-058-09.T18 | abuse | PS-058-01.R04, PS-058-09.R04 | two public reviews from one 4-party cycle (A about B, C about D) and one subject_only review | the public ones share no identifier (different pairRef, no contextId or completionCid); the subject_only one carries the full ids encrypted to its subject |
| TEST-PS-058-09.T19 | abuse | PS-058-09.R04, PS-058-02.R02 | the subject withholds its completion ticket and the deal is cancelled | the author still posts with the opening ticket, outcome cancelled shown as a label, weight factor 0.5; without the opening ticket only subject_only is offered |
| TEST-PS-058-09.T20 | abuse | PS-058-07.R05, PS-058-09.R04 | 40 genuine reviews, then 500 sybil reviews about the same subject from new DIDs | every genuine review with weight at least 0.5 stays selected; at most 3 per sybil author; the average moves by less than 0.3 |
| TEST-PS-058-09.T21 | integration | PS-058-04.R02, PS-058-02.R04 | commerce.deal.completed without completionCid, mutiny.cycle.completed without legs, later corrected events | windows quarantined with missingFields and no pairs; after the corrected events they open |
| TEST-PS-058-09.T22 | integration | PS-058-04.R02 | commerce.dispute.resolved with resolution lapsed for a completed deal, carrying caseCid and parties | outcome becomes disputed, disputeFlag set and shown; a subject_only review names the dispute caseCid |
| TEST-PS-058-09.T23 | integration | PS-058-04.R04 | comms.meetup.no_show about Q delivered twice, then comms.meetup.no_show_contradicted for it, and a second no_show arriving with contradicted true | one claim recorded per report, noShowClaims 2, contradictedNoShowClaims 2, bayesianAvg unchanged; each claim is shown with the reporter and the contradicting check-in statement |
| TEST-PS-058-09.T24 | unit | PS-058-02.R04 | a review with a backdated createdAt signed by a device key the latest verified document already marks revoked; the revocation learned later for one review first seen after its clamped effective time and one first seen before it | the first quarantined with signer_revoked at receipt; on learning, the later-seen one quarantined and the earlier-seen one stays posted with a revoked-signer marker |
| TEST-PS-058-09.T25 | integration | PS-058-07.R04 | F10 export, deletion and retention sweep with stub registries; public review to a relay without federation_publish consent | sections exported; reviews and windows pseudonymized, not deleted; the relay is skipped and shown |
| TEST-PS-058-09.T26 | contract | PS-058-04.R02 | outcome and opening event fixtures of F09.S01.M01, F02.S03.M04, F03.S02.M02, F05.S02.M02 and F09.S02.M02 | each fixture parses and opens the documented window; a fixture missing an N3 field quarantines |
| TEST-PS-058-09.T27 | e2e | PS-058-07.R03, PS-058-09.R05 | UI copy check of the reputation card and review sheet in every locale bundle | dampening honesty text, 'based on N reviews from M sources seen by this device', outcome labels and the public-review privacy note are present |
| TEST-PS-058-09.T28 | integration | PS-058-04.R02, PS-058-02.R04 | rentals.rental.closed with reason completed and completionKind rental_completion, with reason deposit_unsettled and completionKind return_attestation, with oneSided true, with reason not_returned, and with only the owner's rental_completion stored | windows open with outcome completed for the first two after both statements verify; no window for one-sided or not_returned closures; the last quarantined until federation.record.accepted delivers the renter's statement, then opens |
| TEST-PS-058-09.T29 | integration | PS-058-04.R02, PS-058-02.R04 | commerce.deal.completed with deal_completion statements by both parties, services.booking.completed with only the provider's booking_completion stored, and a completion event whose completionCid matches no stored statement | the deal window opens; the booking window is quarantined listing the client's statement and opens when it arrives; the unmatched one stays quarantined and no 'confirmed by both' label is shown |
| TEST-PS-058-09.T30 | integration | PS-058-04.R02, PS-058-01.R02 | mutiny.cycle.completed with receiptCids for all legs; mutiny.recovery.resolved with outcome unresolved, with dispute_outcome and with agreed for another cycle | the completed cycle opens leg-connected windows with the receipts as proof; unresolved and dispute_outcome give outcome disputed with disputeFlag and the evidenceCids recorded; agreed gives outcome cancelled; non-adjacent pairs get no window |
| TEST-PS-058-09.T31 | contract | PS-058-04.R01 | post, ticket signing and withdraw with a StatementPublisherPort spy | reviews and tickets go through StatementPublisherPort.publish and withdrawals through issueTombstone; cid and signatures follow F11.S01.M03; no other signing path |

## Acceptance criteria

- All tests T01-T31 pass in CI.
- Golden dampening and selection vectors are stable, a sybil ring cannot raise the effective weight of its reviews above 15 percent of raw, and 500 sybil reviews cannot push genuine reviews out of the summary.
- The UI always shows raw counts, outcome labels, source count and the dampening notice, and never claims verified identity of persons.
- No relay action or relay-signed tombstone withdraws or hides a review in a vault, and two public reviews from one cycle share no identifier.

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S01.M01, F11.S01.M02, F09.S01.M01, F09.S02.M02, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-COM-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
