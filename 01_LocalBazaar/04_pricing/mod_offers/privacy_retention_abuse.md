# PS-011-07 — Privacy, retention and abuse: Purchase offers

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S04.M01 Purchase offers](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/pricing/offers` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-011-07.R01** Offer amounts and notes never appear in public listing views, search, federation or notification payloads.
- **PS-011-07.R02** Offer evidence is retained for RET-EVIDENCE and pseudonymized on principal deletion (privacy.deletion.completed) in the deleting party's vault; the counterparty keeps its own copy.
- **PS-011-07.R03** Offer spam and lowballing harassment are limited by caps, rate limits and seller-side filters, including the private minimum, which gives the buyer no observable signal.
- **PS-011-07.R04** The module registers ExportSectionPort (section bazaar.offers), DeletionPort and RetentionPurgePort with F10 (N6), annotates every Offer field with its F10.S02.M02 class, and consumes privacy.deletion.completed to pseudonymize retained offers.

## Specification

**Data classification**
- Offer: P2 (buyer, seller), only in their two vaults; field classes annotated per F10.S02.M02.
- note: P2 free text; scanned locally by F12.S02.M02 spam heuristics; never federated.

**Retention**
- Terminal offers: RET-EVIDENCE (2 years after last related activity), then purged.
- On principal deletion: buyerId/sellerId replaced with the per-deletion pseudonym in the deleting vault; amounts kept for the counterparty's records.
- Quarantined statements: RET-SHORT 30 days.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Lowball offer flooding to harass a seller | per-buyer rate limit 20 offers/hour, per-listing 50 open cap, at most 20 offers per listing per hour from unseen keys, private minimum below which offers are stored rejected and hidden with no buyer-visible difference |
| T02 | Offer note used for phishing links | link detection via F12.S02.M02; links rendered as plain text; report action on each offer |
| T03 | Relay learns offer contents or who offered | envelopes end-to-end encrypted to the seller's key; relay sees mailbox ID, size and time only (PRV-5) |
| T04 | Replay of an acceptance or decision onto another offer | the acceptance consent binds subjectRevisionHash = offerCid (ID-3 cid of ConsentSubjectPort.canonicalBytes) and decisions bind offerCid; cid dedup; idempotency key and expectedRevision for local commands |
| T05 | Forged acceptance or decision | signer must be the author of the verified listing projection (comms.consent.verify, V10); quarantine role_mismatch |
| T06 | Bisecting the seller's private minOffer with probe offers | below-minimum offers get the same acknowledgement, no statement and timeout expiry, and receive the same listing_unavailable and superseded decisions as open offers before expiresAt |
| T07 | Fresh did:keys to evade per-key limits | per-listing caps independent of keys, unseen-key cap per listing, and no information gained from probes |
| T08 | Double sale of the last unit from two seller devices | detected through conflicting reservations and frozen for the owner (ADR-0016 §5); the UI never claims the item is exclusively reserved across devices |

**Abuse controls**
- Signals bazaar.offer.made velocity and reject ratio to F12.S03.M02 fraud signals locally.
- Report offer action creates an F12.S01.M01 report on the relay the reporter chooses, attaching only the evidence the reporter selects.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-011-09.T08 | abuse | PS-011-05.R01, PS-011-05.R02, PS-011-07.R01 | non-owner accepts; third party queries offers; public listing view | FORBIDDEN or NOT_FOUND; no offer data in public payloads |
| TEST-PS-011-09.T11 | integration | PS-011-07.R02 | buyer principal deleted (privacy.deletion.completed in B1) | B1's retained offers carry the pseudonym instead of buyerId; S's copy keeps the amount |
| TEST-PS-011-09.T12 | abuse | PS-011-07.R03 | 21 offers in one hour by one buyer; 21 offers from fresh keys on L within an hour | 21st returns RATE_LIMITED; the 21st fresh-key statement is dropped without acknowledgement |
| TEST-PS-011-09.T27 | integration | PS-011-07.R04 | export section, deletion plan and retention purge through the F10 ports | section bazaar.offers present with field classes; deletion plan pseudonymizes retained offers and purges notes of non-evidence offers |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F01.S02.M01, F01.S03.M01, F09.S01.M01, F09.S03.M01, F09.S03.M03, F07.S02.M02, F08.S02.M02, F11.S01.M01, F11.S01.M02, F11.S02.M03, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
