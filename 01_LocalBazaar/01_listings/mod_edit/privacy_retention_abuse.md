# PS-003-07 — Privacy, retention and abuse: Listing editing

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M02 Listing editing](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/edit` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-003-07.R01** Revision snapshots contain only fields that are already public when published; drafts store no snapshots.
- **PS-003-07.R02** Revisions follow RET-EVIDENCE (2 years after last related activity) and are purged with the listing afterwards.
- **PS-003-07.R03** The edited event carries field names only so notifications never reveal old or new values.

## Specification

**Data classification**
- ListingRevision: P1 snapshot of public fields in the owner's vault.
- bazaar.listing.edited: P1 payload with IDs and field names.

**Retention**
- ListingRevision: RET-EVIDENCE; purged when the listing tombstone is created and the evidence window has passed.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Bait-and-switch: seller changes price after buyers commit | material flag, event to offers, and explicit buyer re-confirmation in F01.S04.M01/M02; revision history is evidence |
| T02 | Edit used to smuggle prohibited content past publication checks | rules re-evaluated on every edit of a published listing; relay hosting policy applies again when the new projection is sent |
| T03 | History tampering | revisions are immutable and carry snapshotHash; the signed projection of F01.S01.M03 binds listingRevision and hash |

**Abuse controls**
- At most 20 edits per hour per listing and 100 revisions per listing; exceeding returns RATE_LIMITED or BAZAAR_EDIT_REVISION_LIMIT.
- Material changes more than 5 times in 24 hours flag the listing locally and show the owner a warning that buyers are notified each time.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-003-09.T10 | abuse | PS-003-07.R01, PS-003-07.R02, PS-003-07.R03 | inspect stored revisions, logs and event payloads | snapshots hold public fields only; evidence retention honoured; no values in event or log |
| TEST-PS-003-09.T14 | abuse | PS-003-07.R03, PS-003-02.R03 | 21 edits within an hour on one listing | 21st returns RATE_LIMITED |

## Dependencies

Module depends on: F01.S01.M01, F18.S01.M02, F18.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
