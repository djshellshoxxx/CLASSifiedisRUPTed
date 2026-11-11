# PS-045-02 — Validation rules: Search index

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S01.M01 Search index](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/search/index` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-045-02.R01** Every upsert is validated against the SearchDocument schema, the author signature and the signer role before it touches the FTS table; failures leave the previous document unchanged.
- **PS-045-02.R02** Location precision, tombstone state, sticky removal state and revision monotonicity are checked on every event so a bad or hostile source cannot widen what is publicly findable or undo a removal it is not entitled to undo.
- **PS-045-02.R03** Text is normalized (NFC, control and bidi characters removed, length limits applied) so index content is stable across browsers and Node; an over-long body is truncated for indexing, never a reason to refuse a valid listing.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | title is 1..120 code points after NFC normalization and control or bidi character removal; body is truncated to its first 2000 code points for indexing and never rejected for length | VALIDATION_FAILED |
| V02 | geoCell passes F06.S02.M01 assertPublicCell - empty, or 4 or 5 characters of the geohash base32 alphabet; 6 or more characters are refused (N8) | DISCOVERY_PRECISION_FORBIDDEN |
| V03 | the projection type is classrup.bazaar.listing/v1, classrup.services.offering/v1 or classrup.rentals.offering/v1, it is not expired or tombstoned, its Ed25519 signature verifies against authorDid over JCS bytes (F11.S01.M03 verifyEnvelope), and its signer holds the author role for the type (F11.S01.M01 roleFor) | DISCOVERY_PROJECTION_INVALID |
| V04 | incoming source revision is greater than the stored sourceRevision, otherwise the event is acknowledged and ignored | DISCOVERY_SOURCE_STALE |
| V05 | priceMinor is an integer within 0..1 000 000 000 000 and currency is present when priceMinor is present | VALIDATION_FAILED |
| V06 | rebuild is requested by the vault principal or a relay operator and no other rebuild is running | DISCOVERY_REBUILD_IN_PROGRESS |
| V07 | the vault holds fewer than 5 000 documents, otherwise fetched documents are evicted by oldest last_viewed_at in discovery_doc_view then oldest firstSeenAt (own and imported never); a relay holds fewer than 100 active documents per author (the F01.S01.M03 default of 100 projections per key), otherwise the newest projection is refused and recorded as a stub with removedReason author_cap | DISCOVERY_INDEX_CAP |
| V08 | a removed document or stub is reactivated only when its removedReason allows it (see the state machine): tombstoned, deleted and author_cap within their window, and hosting_policy before reversal or expiry, refuse a newer revision | DISCOVERY_SOURCE_REMOVED |
| V09 | set_promotion runs on a relay, the document is active, until is in the future and at most 14 days ahead, and the linked claim, read through F09.S01.M01 commerce.payment.list_for_deal, is final (crypto, COM-5) or acknowledged with this relay operator's key | DISCOVERY_PROMOTION_CLAIM_NOT_FINAL |
| V10 | list_by_cell has 1..8 cells of exactly 4 characters, limit 1..100, and a cursor that is well-formed and HMAC-valid on this relay | VALIDATION_FAILED |
| V11 | an offering or rental projection used for enrichment names a listingId whose document has the same authorDid and listingKind service or rental | DISCOVERY_PROJECTION_INVALID |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-045-09.T01 | unit | PS-045-01.R01, PS-045-01.R02, PS-045-02.R01 | upsert a valid signed projection with a 5000-code-point description and condition poor | document stored active, FTS row present, body truncated to 2000 code points, text NFC-normalized, provenance fields set |
| TEST-PS-045-09.T02 | unit | PS-045-01.R01, PS-045-02.R02 | projections with geo cells u4pruy (6 chars), u4pr (4 chars) and empty | DISCOVERY_PRECISION_FORBIDDEN and no row for the first; the others stored with geoCell4 u4pr or empty |
| TEST-PS-045-09.T03 | property | PS-045-02.R03 | random Unicode titles with control and bidi characters | stored text has none of them and length limits hold |
| TEST-PS-045-09.T08 | abuse | PS-045-01.R01, PS-045-02.R01 | tampered projection, wrong author key, unsigned projection, signer without the author role | all rejected with DISCOVERY_PROJECTION_INVALID, nothing indexed |
| TEST-PS-045-09.T31 | integration | PS-045-01.R01, PS-045-02.R02 | L1 listing (cell u4pr) with F06.S01.M03 distance filters of 5, 10, 25, 50 and 100 km around u4pru | indexed; found at 25, 50 and 100 km; not matched at 5 or 10 km |

## Dependencies

Module depends on: F06.S02.M01, F01.S01.M03, F11.S01.M01, F11.S01.M02, F11.S01.M03, F09.S01.M01, F12.S03.M03, F10.S01.M02, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-FED-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001, CTR-COM-001. Predecessor: [domain_schema.md](domain_schema.md).
