# PS-045-09 — Contract and acceptance tests: Search index

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S01.M01 Search index](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/search/index` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-045-09.R01** Every requirement is covered by at least one automated test with deterministic clock and ID generator.
- **PS-045-09.R02** Event handlers are verified against recorded event fixtures of the producing modules (F01, F03, F04, F05, F11, F12, F09) and a fake signed-projection reader.
- **PS-045-09.R03** Privacy and signature tests prove that no field outside P0, no unsigned projection and no cell longer than 5 characters can be indexed.

## Specification

See the module test table below (all processes).

**Fixtures:** Tenant T, author A with did:key keypair, signed projections L1..L5 (one with an L1 cell u4pr, one with a 5000-code-point description and condition poor), F01 and F03 event fixtures, relays A and B, fixed clock 2026-11-04T10:00:00Z, fake projection reader, fake claim reader, relay and vault harnesses sharing the same package.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-045-09.T01 | unit | PS-045-01.R01, PS-045-01.R02, PS-045-02.R01 | upsert a valid signed projection with a 5000-code-point description and condition poor | document stored active, FTS row present, body truncated to 2000 code points, text NFC-normalized, provenance fields set |
| TEST-PS-045-09.T02 | unit | PS-045-01.R01, PS-045-02.R02 | projections with geo cells u4pruy (6 chars), u4pr (4 chars) and empty | DISCOVERY_PRECISION_FORBIDDEN and no row for the first; the others stored with geoCell4 u4pr or empty |
| TEST-PS-045-09.T03 | property | PS-045-02.R03 | random Unicode titles with control and bidi characters | stored text has none of them and length limits hold |
| TEST-PS-045-09.T04 | integration | PS-045-03.R01, PS-045-03.R02 | publish, unpublish, republish a listing | active, removed (FTS row gone), active with fresh text and a newer revision |
| TEST-PS-045-09.T05 | integration | PS-045-01.R03, PS-045-03.R03 | removed document older than 30 days | purge sweep deletes it and writes a stub kept 180 days; younger rows kept |
| TEST-PS-045-09.T06 | integration | PS-045-04.R02, PS-045-06.R01 | deliver the same event twice and an older edit afterwards | one document, stale edit ignored |
| TEST-PS-045-09.T07 | contract | PS-045-04.R01, PS-045-04.R03 | rebuild, set_promotion and clear_promotion commands and each applied change | command and discovery.index.updated payloads validate against registry schemas; one event per change; old alias names accepted |
| TEST-PS-045-09.T08 | abuse | PS-045-01.R01, PS-045-02.R01 | tampered projection, wrong author key, unsigned projection, signer without the author role | all rejected with DISCOVERY_PROJECTION_INVALID, nothing indexed |
| TEST-PS-045-09.T09 | abuse | PS-045-05.R01, PS-045-05.R02 | non-operator calls rebuild or set_promotion on a relay; locked vault calls rebuild | FORBIDDEN on the relay; UNAUTHENTICATED for the locked vault |
| TEST-PS-045-09.T10 | integration | PS-045-04.R02, PS-045-07.R02, PS-045-03.R04 | author-signed tombstone then later republish of the same cid | document removed with reason tombstoned, republish refused with DISCOVERY_SOURCE_REMOVED |
| TEST-PS-045-09.T11 | integration | PS-045-06.R02, PS-045-06.R03 | handler fails 8 times; crash during rebuild; verification key unavailable | dead_letter after 8 attempts; live index unchanged; nothing indexed while F11 buffers the record |
| TEST-PS-045-09.T12 | abuse | PS-045-07.R03 | author with 101 active documents on a relay; claimedPublishedAt 3 years ahead | 101st (newest) refused with stub author_cap and DISCOVERY_INDEX_CAP diagnostic; recency anchor equals firstSeenAt |
| TEST-PS-045-09.T13 | integration | PS-045-05.R03, PS-045-07.R01 | query layer asks for a document from a removed row | no title or body is ever returned |
| TEST-PS-045-09.T14 | load | PS-045-08.R02, PS-045-08.R03 | 200 events/s on relay for 5 minutes, 50 events/s in a vault emulation for 5 minutes, relay 100 000 rebuild and vault 5 000 rebuild | freshness p95 <= 5 s in both; relay rebuild <= 10 min; vault rebuild <= 30 s |
| TEST-PS-045-09.T15 | unit | PS-045-09.R01, PS-045-09.R02, PS-045-09.R03 | traceability tool run over PS-045 | every requirement maps to a passing test and privacy suite is green |
| TEST-PS-045-09.T16 | integration | PS-045-10.R01, PS-045-10.R02, PS-045-10.R03 | restore of vault from export then rebuild; relay backup restore then rebuild | index equals expectation derived from retained signed projections |
| TEST-PS-045-09.T17 | integration | PS-045-04.R02, PS-045-01.R04 | vault receives federation.record.accepted for a listing fetched from relay B; relay ingests the same listing through federation.record.ingest | MirrorView loaded by cid, roleFor and signature checked, one document with origin fetched and provenanceRelays [B] in the vault and origin relay_published on the relay |
| TEST-PS-045-09.T18 | integration | PS-045-01.R04, PS-045-04.R03 | service listing published, services.offering.published, services.offering.revised, rentals.offering.published for a rental listing, then services.offering.withdrawn and an author tombstone for the rental offering projection | exactly one document per listing, enriched from the offering projection; both withdrawals remove the listing document with reason withdrawn |
| TEST-PS-045-09.T19 | integration | PS-045-04.R02, PS-045-03.R01 | auction scheduled, opened, extended, then cancelled; a second auction closed | auctionId link resolves the document, endsAt follows the host-signed times, removed with auction_cancelled and auction_closed |
| TEST-PS-045-09.T20 | integration | PS-045-03.R02, PS-045-04.R02 | relay moderation actions warn, remove_from_index with targetRef, remove_from_index without targetRef, then author edit, then moderation.action.reverted, and an action whose expiresAt passes | warn ignored; target removed; all subjectKey documents removed; edit does not reactivate (DISCOVERY_SOURCE_REMOVED); revert and expiry reactivate |
| TEST-PS-045-09.T21 | integration | PS-045-03.R04, PS-045-07.R02 | relay A signs a tombstone for a listing the vault fetched from relays A and B, and for the user's own listing | relay A dropped from provenance, document stays active from B; own listing untouched; no refusal for B copies |
| TEST-PS-045-09.T22 | integration | PS-045-03.R02 | bazaar.inventory.depleted reason held, then bazaar.inventory.released; depleted reason sold, then bazaar.inventory.restocked with available 2 | removed held then active; removed sold_out then active |
| TEST-PS-045-09.T23 | integration | PS-045-04.R04 | set_promotion with a claimed but unacknowledged claim, then with an operator-acknowledged claim, then commerce.payment.reorged; a second promotion reaching promotedUntil; set_promotion in a vault | DISCOVERY_PROMOTION_CLAIM_NOT_FINAL; promotedUntil set; cleared on reorg; cleared by sweep; not available in a vault |
| TEST-PS-045-09.T24 | integration | PS-045-03.R02, PS-045-03.R03 | hosting_policy and tombstoned documents purged after 30 days, then the same signed projection resubmitted | refused from the stub with DISCOVERY_SOURCE_REMOVED until revert or 180 days |
| TEST-PS-045-09.T25 | integration | PS-045-10.R04 | rebuild after 40 days and restore from export with kernel provenance | firstSeenAt and authorFirstSeenAt identical to the live table after rebuild and equal to provenance receivedAt after restore; no author counts as new |
| TEST-PS-045-09.T26 | abuse | PS-045-07.R01 | vault indexes 1 000 events under network capture and outbox inspection | zero network requests and zero outbox entries written by the index |
| TEST-PS-045-09.T27 | integration | PS-045-08.R01 | relay /metrics scrape and vault diagnostics after 100 events | relay exports the listed series; vault counters exist only in the local diagnostics log and no request leaves the device |
| TEST-PS-045-09.T28 | contract | PS-045-04.R02, PS-045-01.R04 | F01 bazaar.listing.published and bazaar.publication.renewed fixtures with total life 120 days, F03 services.offering.published fixture | accepted; document expires at the renewed expiresAt, not at 90 days |
| TEST-PS-045-09.T29 | integration | PS-045-04.R05, PS-045-05.R03 | list_by_cell with 2 L1 cells, with a 5-character cell, with 9 cells, and over quota | signed envelopes returned; VALIDATION_FAILED twice; RATE_LIMITED from RateLimitPort |
| TEST-PS-045-09.T30 | integration | PS-045-01.R05, PS-045-07.R04 | vault at 5 000 documents receives new ones; deletion executes the registered DeletionPort plan; retention purge run | fetched documents with oldest last view evicted, own and imported kept; own documents removed with reason deleted; field classifications present for every column |
| TEST-PS-045-09.T31 | integration | PS-045-01.R01, PS-045-02.R02 | L1 listing (cell u4pr) with F06.S01.M03 distance filters of 5, 10, 25, 50 and 100 km around u4pru | indexed; found at 25, 50 and 100 km; not matched at 5 or 10 km |

## Acceptance criteria

- All tests T01-T31 pass in CI.
- A newly published listing is searchable on a relay within 5 seconds p95 and a tombstoned one is gone within 5 seconds p95.
- No indexed row contains a geohash longer than 5 characters, an unsigned projection or any P1-P4 field (privacy suite).
- A relay decision never removes an own or imported document from a vault (abuse suite).

## Dependencies

Module depends on: F06.S02.M01, F01.S01.M03, F11.S01.M01, F11.S01.M02, F11.S01.M03, F09.S01.M01, F12.S03.M03, F10.S01.M02, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-FED-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001, CTR-COM-001. Predecessor: [domain_schema.md](domain_schema.md).
