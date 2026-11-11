# PS-011-09 — Contract and acceptance tests: Purchase offers

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S04.M01 Purchase offers](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/pricing/offers` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-011-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-011-09.R02** Contract tests check command input/output and event payloads against the schema registry.
- **PS-011-09.R03** The accept race within one vault and the two-device fork are covered by deterministic concurrency tests.

## Specification

See the module test table below (all processes).

**Fixtures:** Seller vault S (and its second device S2) with published sell listing L (EUR 50.00, qty 1, minOffer EUR 35.00), buyer vaults B1 and B2 holding the verified projection of L, a key K that is not the listing author, relay stub with a moderator, clocks 2026-11-04T10:00:00Z with injectable skew.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-011-09.T01 | unit | PS-011-01.R01, PS-011-01.R03, PS-011-02.R01 | make offer with valid input | Offer stored with status made, revision 1, amount and quantity unchanged, offerCid set |
| TEST-PS-011-09.T02 | unit | PS-011-02.R02, PS-011-02.R03 | each rule V01–V15 violated in turn in the vault the rule names | the documented error code is returned or the statement is quarantined or dropped; nothing is stored |
| TEST-PS-011-09.T03 | property | PS-011-03.R01 | random sequences of commands and inbound statements on one offer | only declared transitions succeed; others return CONFLICT_STATE |
| TEST-PS-011-09.T04 | integration | PS-011-03.R02, PS-011-06.R03 | Deal port or consent signing fails during accept | offer stays made, no hold, no Deal, no consent; DEPENDENCY_UNAVAILABLE returned |
| TEST-PS-011-09.T05 | integration | PS-011-03.R03, PS-011-06.R02, PS-011-09.R03 | B1 and B2 offers accepted concurrently in two tabs of S's vault for qty 1 | within one vault one accepted, the other CONFLICT_STATE, then expired superseded with a signed decision to B2 |
| TEST-PS-011-09.T06 | contract | PS-011-04.R01, PS-011-04.R02, PS-011-09.R02 | each command executes | output and emitted event payloads validate against registry schemas |
| TEST-PS-011-09.T07 | integration | PS-011-04.R03 | seller vault: listing unpublished and block added; buyer vault: newer verified projection and a tombstone | seller expires or rejects with documented reasons and signed decisions; buyer sets listingChangedSinceOffer and listingUnavailable from mirror events and consumes no bazaar.listing.* event |
| TEST-PS-011-09.T08 | abuse | PS-011-05.R01, PS-011-05.R02, PS-011-07.R01 | non-owner accepts; third party queries offers; public listing view | FORBIDDEN or NOT_FOUND; no offer data in public payloads |
| TEST-PS-011-09.T09 | abuse | PS-011-05.R03 | relay moderator of R inspects mailboxes and a report with and without voluntarily attached offer evidence | mailbox holds only ciphertext; the moderator sees only what the reporting party attached to the report on R |
| TEST-PS-011-09.T10 | integration | PS-011-06.R01 | same Idempotency-Key replayed with same and different body; same statement cid delivered twice | original response replayed; IDEMPOTENCY_KEY_REUSED; duplicate statement ignored |
| TEST-PS-011-09.T11 | integration | PS-011-07.R02 | buyer principal deleted (privacy.deletion.completed in B1) | B1's retained offers carry the pseudonym instead of buyerId; S's copy keeps the amount |
| TEST-PS-011-09.T12 | abuse | PS-011-07.R03 | 21 offers in one hour by one buyer; 21 offers from fresh keys on L within an hour | 21st returns RATE_LIMITED; the 21st fresh-key statement is dropped without acknowledgement |
| TEST-PS-011-09.T13 | load | PS-011-08.R01, PS-011-08.R02 | 500 offers received and 50 accepts on Moto G profile | make and receive p95 ≤ 100 ms, accept p95 ≤ 200 ms, counters local only, no telemetry requests |
| TEST-PS-011-09.T14 | integration | PS-011-08.R03 | 10 000 overdue offers | sweep completes ≤ 5 s and the local lag gauge returns to 0 |
| TEST-PS-011-09.T15 | unit | PS-011-09.R01 | traceability tool run | every PS-011 requirement maps to a passing test |
| TEST-PS-011-09.T16 | integration | PS-011-10.R01, PS-011-10.R02, PS-011-10.R03 | export from S, import into a fresh vault of the same principal, import by a principal that is neither buyer nor seller, import with a bad signature | offers and statements round-trip identical with no relay lookup; open offers import as expired superseded; foreign principal rejected; bad signature quarantined |
| TEST-PS-011-09.T17 | e2e | PS-011-04.R01 | mobile buyer makes an offer, seller accepts in its vault | both vaults show accepted with the same dealId; screen passes axe with zero serious issues |
| TEST-PS-011-09.T18 | integration | PS-011-01.R02 | inspect field class annotations and run the retention purge before and after the evidence window | Offer classed P2 in two vaults only; terminal offers purged 2 years after last activity; non-terminal offers never purged |
| TEST-PS-011-09.T19 | contract | PS-011-01.R04, PS-011-04.R04 | make, decide and withdraw; inspect stored records and the F11.S01.M01 registry | statements validate as classrup.bazaar.offer/v1, offer_decision/v1 and offer_withdrawal/v1 with registered signer roles; records validate as classrup.bazaar.offer_record/v1 only |
| TEST-PS-011-09.T20 | abuse | PS-011-02.R04 | two buyer keys bisect minOffer with amounts above and below EUR 35.00 | identical acknowledgement, no rejection statement and timeout expiry for every unanswered probe; below-minimum offers hidden from S's list; the probes learn nothing beyond not accepted |
| TEST-PS-011-09.T21 | abuse | PS-011-02.R05 | decision signed by K; withdrawal signed by B2 for B1's offer; decision for offer A replayed onto offer B; acceptance consent for offer A replayed onto offer B | quarantined role_mismatch, role_mismatch, binding_mismatch; comms.consent.verify reports a subject mismatch; offer B stays made |
| TEST-PS-011-09.T22 | integration | PS-011-03.R04 | S counters B1's offer through F01.S04.M02, then B1 tries to withdraw and S tries to accept the root offer | root offer rejected with reason countered in the counter transaction without a decision statement; B1's vault applies countered on the verified first round; withdraw and accept return CONFLICT_STATE |
| TEST-PS-011-09.T23 | integration | PS-011-03.R05 | two vaults with clocks skewed +10 and -10 min; acceptance delivered 3 h after expiresAt, then another delivered 25 h after | first applied inside the grace and both vaults show accepted; second refused; B1 expires and sends a timeout close; S moves accepted to expired, cancels the Deal and the hold is released |
| TEST-PS-011-09.T24 | integration | PS-011-03.R06, PS-011-06.R02 | S and S2 accept B1's and B2's offers offline for the last unit, then sync | both acceptances kept; conflict_detected freezes both holds and both offers; neither Deal proceeds; S keeps B1 and B2 receives a signed decision rejected conflict_resolved with its Deal cancelled |
| TEST-PS-011-09.T25 | integration | PS-011-03.R07 | seller-side reject, listing unpublished, superseded and block; then a seller-side timeout | a signed decision reaches the buyer for each close except the timeout; the block decision reads seller_rejected; both vaults converge on the same terminal status |
| TEST-PS-011-09.T26 | integration | PS-011-04.R05 | accept, then a conflicted consent status in B1 | consent signed with subjectType bazaar_offer, statementKey consent.bazaar.offer.accept.v1 over the offer digest through the registered SubjectCanonicalizerPort; B1 verifies with comms.consent.verify; conflicted moves B1's offer to frozen |
| TEST-PS-011-09.T27 | integration | PS-011-07.R04 | export section, deletion plan and retention purge through the F10 ports | section bazaar.offers present with field classes; deletion plan pseudonymizes retained offers and purges notes of non-evidence offers |
| TEST-PS-011-09.T28 | integration | PS-011-03.R02, PS-011-06.R03 | accept B1's offer, then deliver a crossing withdrawal from B1 | hold has holder {offer, offerId}, ttl 7 d, maxExpiresAt equal to the Deal expiry and linkedDealId; the withdrawal moves the offer to withdrawn and calls commerce.deal.cancel in the same transaction; the hold is released through commerce.deal.cancelled |

## Acceptance criteria

- All tests T01–T28 pass in CI.
- No offer data appears in public, search, relay index or federation payloads (privacy test suite).
- Never two accepted offers for one unit within one vault; cross-device forks are detected and frozen, never resolved by timestamp; an offer below the private minimum is indistinguishable for the buyer from an unanswered one.

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F01.S02.M01, F01.S03.M01, F09.S01.M01, F09.S03.M01, F09.S03.M03, F07.S02.M02, F08.S02.M02, F11.S01.M01, F11.S01.M02, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
