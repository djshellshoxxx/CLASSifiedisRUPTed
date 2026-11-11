# PS-003-09 — Contract and acceptance tests: Listing editing

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M02 Listing editing](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/edit` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-003-09.R01** Every requirement is covered by at least one automated test.
- **PS-003-09.R02** Contract tests validate command output and bazaar.listing.edited payloads against the schema registry.
- **PS-003-09.R03** Material-change detection has property tests over random patches.

## Specification

See the module test table below (all processes).

**Fixtures:** Vault with published listing L (revision 4, EUR sell terms 50.00, condition good), auction listing A with an edit-lock port stub of F04.S01.M01 (unlocked, locked with bidCount 1, failing), a host relay H with a hosted auction on A and its host edit-lock port, policy pack with one blocked keyword, clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-003-09.T01 | unit | PS-003-01.R01, PS-003-01.R02 | edit title of published L then edit draft D | revision row exists for L with snapshotHash; none for D, whose Listing.revision still increments |
| TEST-PS-003-09.T02 | property | PS-003-02.R01 | random patches | material equals intersection of changedFields with price, condition, categoryId; ownerId and kind patches rejected |
| TEST-PS-003-09.T03 | unit | PS-003-02.R02, PS-003-02.R03 | each rule V01-V09 violated | documented error code returned; listing unchanged |
| TEST-PS-003-09.T04 | property | PS-003-03.R01, PS-003-03.R03 | random edits on listings in every status | Listing.status never changes; edits on expired, closed or archived give CONFLICT_STATE |
| TEST-PS-003-09.T05 | contract | PS-003-04.R01, PS-003-04.R03, PS-003-09.R02 | edit and record execute | outputs and event payloads validate; payload contains no field values |
| TEST-PS-003-09.T06 | integration | PS-003-04.R02, PS-003-05.R02 | call record from a non-sibling caller and from sell terms | FORBIDDEN for the first; revision and event for the second in one transaction |
| TEST-PS-003-09.T07 | abuse | PS-003-05.R01, PS-003-05.R03 | edit or read history as a different principal in a shared device profile | NOT_FOUND or FORBIDDEN; nothing changes |
| TEST-PS-003-09.T08 | integration | PS-003-06.R01, PS-003-06.R02, PS-003-06.R03 | replay edit; abort transaction after outbox write; edit offline | one revision per key; atomic outcome; unsentChanges true and no peer-accepted claim |
| TEST-PS-003-09.T09 | integration | PS-003-06.R02 | two tabs edit with the same expectedRevision | one succeeds, other CONFLICT_REVISION with currentRevision |
| TEST-PS-003-09.T10 | abuse | PS-003-01.R03, PS-003-07.R01, PS-003-07.R03 | inspect stored revisions, logs and event payloads | snapshots hold public fields only and are classed P1 RET-EVIDENCE; no values in event or log |
| TEST-PS-003-09.T11 | load | PS-003-08.R01, PS-003-08.R02, PS-003-08.R03 | 100 edits on a 2 000-rule pack on Moto G profile | edit p95 <= 80 ms, list p95 <= 100 ms, metrics present, no network calls |
| TEST-PS-003-09.T12 | unit | PS-003-09.R01, PS-003-09.R03 | traceability tool run and property seed replay | every PS-003 requirement maps to a passing test; failures print their seed |
| TEST-PS-003-09.T13 | integration | PS-003-10.R01, PS-003-10.R02, PS-003-10.R03 | export, import to fresh vault, import row with gap in revisionNo | rows round-trip identical; gap import kept read-only with warning |
| TEST-PS-003-09.T14 | abuse | PS-003-02.R03 | 21 edits within an hour on one listing | 21st returns RATE_LIMITED |
| TEST-PS-003-09.T15 | integration | PS-003-03.R02 | edit published L to revision 5, then deliver bazaar.listing.published with listingRevision 5, then edit again | unsentChanges true, then false, then true; renewed event with the latest revision also clears it |
| TEST-PS-003-09.T16 | integration | PS-003-02.R04 | edit-lock stub for A answers locked (bidCount 1), then patch condition, record a price and patch the title; stub then answers unlocked; then the stub fails | condition and price give BAZAAR_EDIT_AUCTION_HAS_BIDS with params bidCount, lastKnownAt, auctionId and the title edit succeeds; unlocked lets the condition edit pass; the failing port gives DEPENDENCY_UNAVAILABLE for material edits only |
| TEST-PS-003-09.T17 | integration | PS-003-07.R02 | purge listing L with keepEvidence true and listing M with keepEvidence false, then privacy.deletion.completed | L revisions kept with evidenceUntil 2 years and editorId replaced by the pseudonym; M revisions purged |
| TEST-PS-003-09.T18 | integration | PS-003-07.R04 | export section, deletion plan and retention purge through the F10 ports | section bazaar.listing_revisions present with field classes; deletion plan pseudonymizes retained rows; retention purge removes rows past evidenceUntil |
| TEST-PS-003-09.T19 | unit | PS-003-01.R04 | drop the derived edit state and the host baseline and rebuild them | rebuilt state equals the original lastProjectedRevision and the baseline equals the last stored projection; neither holds auction bid counts and both are absent from the export |
| TEST-PS-003-09.T20 | integration | PS-003-04.R04 | host relay H accepts a new projection of A (title changed, revision 6), then one with condition changed (revision 7), then a changed projection of a listing that no hosted auction references | bazaar.listing.edited host-side with source host_projection, material false and changedFields [title], then material true with [condition] and projectionCid; nothing for the unreferenced listing; baselines updated |
| TEST-PS-003-09.T21 | contract | PS-003-04.R05 | F04.S01.M01 conformance stub registers auctions.auction.edit_lock as ListingEditLockPort; inspect the depends_on graph | the edit transaction calls editLock with {listingId} and maps the output fields; F01.S01.M02 does not list F04 in depends_on and the graph stays acyclic |
| TEST-PS-003-09.T22 | unit | PS-003-02.R01, PS-003-02.R02 | patch media with alt text, decorative and 11 entries | media patch accepted and snapshot holds the MediaRef entries; 11 entries VALIDATION_FAILED; media change is not material |

## Acceptance criteria

- All tests T01-T22 pass in CI.
- A material change always produces bazaar.listing.edited with material true and never carries field values.
- No edit path changes Listing.status or bypasses expectedRevision, and no material edit succeeds while the auction edit lock reports locked or cannot answer.

## Dependencies

Module depends on: F01.S01.M01, F18.S01.M02, F18.S01.M03, F11.S01.M02, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
