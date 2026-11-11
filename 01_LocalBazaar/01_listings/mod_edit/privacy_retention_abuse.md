# PS-003-07 — Privacy, retention and abuse: Listing editing

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M02 Listing editing](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/edit` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-003-07.R01** Revision snapshots contain only fields that are already public when published; drafts store no snapshots.
- **PS-003-07.R02** Revisions follow RET-EVIDENCE (2 years after last related activity); when the listing is purged, revisions cited by an Offer, Negotiation or Deal are kept until evidenceUntil (keepEvidence from F01.S01.M04) and pseudonymized on privacy.deletion.completed, and all other revisions are purged with the listing.
- **PS-003-07.R03** The edited event carries field names only so notifications never reveal old or new values.
- **PS-003-07.R04** The module registers ExportSectionPort (section bazaar.listing_revisions), DeletionPort and RetentionPurgePort with F10 (N6) and annotates every ListingRevision field with its F10.S02.M02 class.

## Specification

**Data classification**
- ListingRevision: P1 snapshot of public fields in the owner's vault; field classes annotated per F10.S02.M02.
- bazaar.listing.edited: P1 payload with IDs and field names.

**Retention**
- ListingRevision: RET-EVIDENCE; purged with the listing unless the purge carries keepEvidence, then kept until evidenceUntil (2 years) with editorId pseudonymized after principal deletion.
- Derived edit state: RET-SHORT, deleted with the listing.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Bait-and-switch: seller changes price after buyers commit | material flag, event to offers, and explicit buyer re-confirmation in F01.S04.M01/M02; revision history is evidence |
| T02 | Edit used to smuggle prohibited content past publication checks | rules re-evaluated on every edit of a published listing; relay hosting policy applies again when the new projection is sent |
| T03 | History tampering | revisions are immutable and carry snapshotHash; the signed projection of F01.S01.M03 binds listingRevision and hash |
| T04 | Auction bait-and-switch against bidders | V09 refuses condition, category and price changes while bids exist (N11) |
| T05 | Evidence lost when the listing is purged | keepEvidence keeps cited revisions for the evidence window |

**Abuse controls**
- At most 20 edits per hour per listing and 100 revisions per listing; exceeding returns RATE_LIMITED or BAZAAR_EDIT_REVISION_LIMIT.
- Material changes more than 5 times in 24 hours flag the listing locally and show the owner a warning that buyers are notified each time.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-003-09.T10 | abuse | PS-003-01.R03, PS-003-07.R01, PS-003-07.R03 | inspect stored revisions, logs and event payloads | snapshots hold public fields only and are classed P1 RET-EVIDENCE; no values in event or log |
| TEST-PS-003-09.T17 | integration | PS-003-07.R02 | purge listing L with keepEvidence true and listing M with keepEvidence false, then privacy.deletion.completed | L revisions kept with evidenceUntil 2 years and editorId replaced by the pseudonym; M revisions purged |
| TEST-PS-003-09.T18 | integration | PS-003-07.R04 | export section, deletion plan and retention purge through the F10 ports | section bazaar.listing_revisions present with field classes; deletion plan pseudonymizes retained rows; retention purge removes rows past evidenceUntil |

## Dependencies

Module depends on: F01.S01.M01, F18.S01.M02, F18.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
