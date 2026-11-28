# PS-035-07 — Privacy, retention and abuse: Auction setup and reserve

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M01 Auction setup and reserve](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/reserve` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-035-07.R01** The reserve is committed by salted hash publicly and known only to the seller and the host; bidders learn whether it has been met, and when a proxy maximum lifts the visible price exactly to the reserve (F04.S01.M02 reserve rule PX4) the price reveals the reserve value, which the setup screen states; the seller can verify the host's commitment at close.
- **PS-035-07.R02** Public projections carry listing reference, start price, increments, times, host identity and reserveMet, but not bidder identities, aliases tied to keys, or max bids.
- **PS-035-07.R03** The host sees the reserve and bids in plaintext and can misbehave; this trust is stated before the seller schedules and before each bidder's first bid.
- **PS-035-07.R04** The module registers ExportSectionPort (section auctions.auctions), DeletionPort and RetentionPurgePort with F10 (N6), annotates every Auction field with its F10.S02.M02 class (reservePrice and reserveSalt P3 in the vault and P2 with the host as the only listed participant), consumes privacy.deletion.completed to pseudonymize retained evidence, and calls privacy.consent.check for federation_publish before the public projection is sent and for notify_push before setting pushOptIn.

## Specification

**Data classification**
- Auction (seller vault): reservePrice and reserveSalt P3; the rest of the seller copy P2; public projection P0.
- Auction (host copy): reservePrice and reserveSalt P2 with the host as the only listed participant, received only inside an envelope E2E-encrypted to hostKeyId (PRV-5) and kept under the host's published retention; everything else is the P0 projection plus operational fields.
- Terms, host_acceptance, auction_opened, auction_cancel and host_cancel statements: P0 signed envelopes without the reserve.

**Retention**
- Closed or cancelled auctions: RET-EVIDENCE (2 years after last related activity) in the seller vault; the host keeps records for its published retention, default 90 days; discarded drafts are deleted at once.
- On account deletion: sellerId in retained evidence is replaced with a per-deletion pseudonym; the reserve, its salt and drafts are deleted.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Host manipulates reserve or start price | terms are signed by the seller and countersigned by the host; the reserve commitment hash is checked against the revealed value by the seller at close |
| T02 | Seller changes listing after bids | terms pin listingCid; F01.S01.M02 refuses material edits while the auction has bids through auctions.auction.edit_lock (N11); non-material edits are recorded in listingCidHistory, shown on the auction page, and reach F04.S02.M03 through the bazaar.listing.edited event, never through a direct call |
| T03 | Seller picks a colluding host | the host is named on the page and each bidder must accept that host at bid time; hosts publish policy; this does not remove the trust requirement and the UI says so |
| T04 | Seller floods a host with auctions | host quota of 20 live auctions per seller, F12.S03.M04 limits and relay hosting policy |
| T05 | Reserve leak through error messages or events | errors never echo the reserve and events carry only the commitment and reserveMet |
| T06 | Host accepts late or runs an auction the seller believes cancelled | acceptBy is signed in the terms and the host must refuse after it; the vault sends auction_cancel at acceptBy and stays cancel_pending until the host answers; host_silent after the latest possible end plus 72 h |
| T07 | Host changes the soft-close constants mid-auction | softCloseRulesVersion is signed in the terms and echoed in host_acceptance; vaults reject extensions under any other version (F04.S02.M02) |

**Abuse controls**
- Host hosting policy may refuse sellers; refusal arrives as a host_cancel with reason host_refused and the host's stated reason.
- Listing edits after bids reach the host's fraud review (F04.S02.M03) as the bazaar.listing.edited event when the edited projection reaches the host; material edits are already refused in the seller vault.
- accept_hosting passes the kernel bus RateLimitPort.consume (F12.S03.M03) and the F12.S03.M04 limits check in-process (N18).

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-035-09.T10 | integration | PS-035-07.R01, PS-035-07.R02, PS-035-01.R02 | inspect host log, public projection, events, errors, bidder view and the F10.S02.M02 classification map | reserve absent everywhere except seller view and host; reservePrice and reserveSalt annotated P3 in the vault and P2 with the host as only participant; the reserve envelope is encrypted to hostKeyId |
| TEST-PS-035-09.T16 | e2e | PS-035-07.R03 | seller opens the host picker and schedule screen; bidder opens the bid sheet for the first time | trust panel states that the host sees the reserve and bids in plaintext and decides order and time, shown before schedule and before the first bid |
| TEST-PS-035-09.T22 | integration | PS-035-07.R04 | export, account deletion, consents withdrawn | section auctions.auctions present; evidence pseudonymized; schedule refused with PRECONDITION_FAILED without federation_publish consent; pushOptIn false without notify_push consent |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F09.S03.M01, F11.S01.M01, F11.S01.M03, F07.S01.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F12.S03.M03, F12.S03.M04, F13.S02.M01, F15.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
