# PS-001-03 — Workflow state machine: Listing archive and expiry

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M04 Listing archive and expiry](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/archive` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-001-03.R01** ArchiveRecord follows the declared machine; the pseudo-state live means the listing has no record yet.
- **PS-001-03.R02** Every transition runs together with the matching Listing.apply_status call and, where a publication is active, with bazaar.publication.end, in one transaction.
- **PS-001-03.R03** Restored listings return as unpublished and must go through publication checks again; restore never republishes automatically.
- **PS-001-03.R04** The expiry sweep never expires a listing with active Deal-linked or cycle holds: it requests bazaar.publication.renew (requestedBy expiry_deferral) while the 120-day cap of F01.S01.M03 allows, and otherwise defers the local expiry and records the deferral until the holds end.
- **PS-001-03.R05** An expired listing can be closed directly by the owner, and an expired listing that is published again closes its record as superseded.

## Specification

### ArchiveRecord lifecycle

Initial **live**; terminal **restored**, **superseded**, **purged**.

| Transition | Trigger | Guard / effect |
|---|---|---|
| live -> live | expiry sweep at expiresAt with active Deal-linked or cycle holds and renewals left under the 120-day cap | bazaar.publication.renew requestedBy expiry_deferral; autoExtensions counted in the next record |
| live -> deferred | expiry sweep at expiresAt with active Deal-linked or cycle holds and the renewal cap reached | Listing stays published locally; others see the signed expiresAt; deferredSince recorded |
| live -> expired | expiry sweep when expiresAt <= now (V08) and no Deal-linked or cycle hold | bazaar.publication.end {reason expired} in the same transaction issues the tombstone; Listing published -> expired; emits bazaar.listing.expired with tombstoneCid |
| live -> closed | bazaar.listing.close by owner or sold-out sweep | holds handled per V04; end publication first; Listing unpublished -> closed; emits bazaar.listing.closed |
| live -> archived | bazaar.listing.archive by owner | holds handled per V04; end publication if active; Listing -> archived; emits bazaar.listing.archived |
| deferred -> expired | sweep finds no active Deal-linked or cycle hold | bazaar.publication.end {reason expired} in the same transaction issues the tombstone; Listing published -> expired; emits bazaar.listing.expired with tombstoneCid |
| deferred -> closed | bazaar.listing.close by owner | holds handled per V04; end publication; Listing -> closed; emits bazaar.listing.closed |
| expired -> closed | bazaar.listing.close by owner | holds handled per V04; Listing expired -> closed; emits bazaar.listing.closed |
| expired -> superseded | consumes bazaar.listing.published for the listing (published again by F01.S01.M03) | record closed; the listing is live again and a later end creates a new record |
| expired -> archived | owner archive or 30 days after endedAt | emits bazaar.listing.archived |
| closed -> archived | owner archive or 30 days after endedAt | emits bazaar.listing.archived |
| archived -> restored | bazaar.listing.restore within 90 days | Listing archived -> unpublished; emits bazaar.listing.restored |
| archived -> purged | purge sweep when purgeAt <= now, or owner deletion | Listing archived -> deleted with keepEvidence; evidence-referenced records keep their evidence fields until evidenceUntil |

```mermaid
stateDiagram-v2
  [*] --> live
  live --> live: expiry sweep at expiresAt with active Deal-linked or cycle holds and renewals left under the 120-day cap
  live --> deferred: expiry sweep at expiresAt with active Deal-linked or cycle holds and the renewal cap reached
  live --> expired: expiry sweep when expiresAt <= now (V08) and no Deal-linked or cycle hold
  live --> closed: bazaar.listing.close by owner or sold-out sweep
  live --> archived: bazaar.listing.archive by owner
  deferred --> expired: sweep finds no active Deal-linked or cycle hold
  deferred --> closed: bazaar.listing.close by owner
  expired --> closed: bazaar.listing.close by owner
  expired --> superseded: consumes bazaar.listing.published for the listing (published again by F01.S01.M03)
  expired --> archived: owner archive or 30 days after endedAt
  closed --> archived: owner archive or 30 days after endedAt
  archived --> restored: bazaar.listing.restore within 90 days
  archived --> purged: purge sweep when purgeAt <= now, or owner deletion
  restored --> [*]
  superseded --> [*]
  purged --> [*]
```

### Timeouts and scheduled transitions

- Expiry sweep every 5 minutes and at app start; deferred records are re-checked on every run.
- Auto-archive sweep daily for expired and closed records older than 30 days.
- Purge sweep daily for archived records past purgeAt; evidence fields of referenced records are purged at evidenceUntil.
- Sold-out sweep daily: published listings whose stock has been zero for 7 days are closed with reason sold_out.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-001-09.T04 | property | PS-001-03.R01, PS-001-03.R02, PS-001-03.R05 | random command and clock sequences including close from expired and publishing again after expiry | only declared transitions; expired -> closed and expired -> superseded allowed; at most one open record per listing |
| TEST-PS-001-09.T05 | integration | PS-001-03.R02, PS-001-03.R03, PS-001-06.R02 | close A with active publication | publication ended and tombstone queued in the same transaction; restore of C gives unpublished, never published |
| TEST-PS-001-09.T17 | integration | PS-001-03.R04 | E reaches expiresAt on day 10 with the 14-day cycle hold; then the renewal cap is reached | publication renewed with requestedBy expiry_deferral and no bazaar.listing.expired; at the cap the record becomes deferred and expires only after the hold ends |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F01.S03.M01, F01.S04.M01, F01.S04.M02, F09.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
