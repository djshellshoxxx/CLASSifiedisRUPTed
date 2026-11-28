# PS-046-02 — Validation rules: Search query

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S01.M02 Search query](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/search/query` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-046-02.R01** Query text and cursors are validated before any database access, with strict limits that bound work per query.
- **PS-046-02.R02** Saved search input is validated like a query plus ownership, count and area rules.
- **PS-046-02.R03** Every violation maps to one stable error code with a localized message key.
- **PS-046-02.R04** Any relay request with a center (near or filters.distanceKm) is checked and budgeted by F06.S02.M03 exactly as discovery.proximity.search, so it cannot bypass the center-precision, radius and distinct-center limits.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | queryText is at most 200 code points, at most 12 terms, each term 1..64 code points after NFC and control-character removal | DISCOVERY_QUERY_INVALID |
| V02 | limit is 1..50 (default 20) and the requested depth (position of the last item of the page) is at most 500 results | VALIDATION_FAILED |
| V03 | cursor is well-formed, at most 1024 bytes, matches the query hash, and on a relay carries a valid HMAC and is younger than 15 minutes | EXPIRED |
| V04 | filters pass F06.S01.M03 validation | DISCOVERY_FILTER_INVALID |
| V05 | radiusKm (near or filters.distanceKm) is at least 5 km, and at least 25 km for anonymous relay callers (F06.S02.M03 V02) | DISCOVERY_RADIUS_TOO_SMALL |
| V06 | the vault holds fewer than 25 non-deleted saved searches | DISCOVERY_SAVED_SEARCH_LIMIT |
| V07 | name is 1..60 code points and alertMode is a known value | VALIDATION_FAILED |
| V08 | the center cell is no finer than the caller class allows (F06.S02.M03 V01) - 4 or 5 characters for the vault, members and token callers, exactly 4 for anonymous relay callers | DISCOVERY_CENTER_TOO_PRECISE |
| V09 | radiusKm is one of the allowed radii 5, 10, 25, 50, 100 | DISCOVERY_RADIUS_NOT_ALLOWED |
| V10 | on a relay, a request with a center consumes the shared proximity budget of F06.S02.M03 through RateLimitPort (F12.S03.M03), including distinct-center counting, before the index is touched; a request without a center consumes class read.search | RATE_LIMITED |
| V11 | each relay item carries projectionCid and sourceRevision and its signed projection (returned with the item or fetched by cid) verifies against authorDid over JCS bytes (F11.S01.M03); otherwise the item is dropped and counted | DISCOVERY_RELAY_ITEM_UNVERIFIED |
| V12 | saved search centerCell passes F06.S02.M01 assertPublicCell | DISCOVERY_PRECISION_FORBIDDEN |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-046-09.T01 | unit | PS-046-01.R01, PS-046-02.R01 | create saved search with valid input | record stored with status active, revision 1, matchedDocIds empty, watermarkAt equal to createdAt |
| TEST-PS-046-09.T02 | property | PS-046-02.R01, PS-046-07.R03 | 10 000 random strings including FTS5 operators and unbalanced quotes | sanitized to quoted terms, never raises an FTS syntax error, never executes operators |
| TEST-PS-046-09.T03 | unit | PS-046-01.R02, PS-046-02.R02 | limits: 201-char query, 13 terms, 26th saved search, limit 51, page depth 501 | DISCOVERY_QUERY_INVALID, DISCOVERY_QUERY_INVALID, DISCOVERY_SAVED_SEARCH_LIMIT, VALIDATION_FAILED, VALIDATION_FAILED |
| TEST-PS-046-09.T04 | unit | PS-046-02.R03 | cursor tampered, aged 16 minutes, or from another query | EXPIRED each time with no data returned |
| TEST-PS-046-09.T20 | abuse | PS-046-02.R04 | anonymous relay caller sends near with a 5-character center; token caller uses search.query near with a third new center within an hour after two discovery.proximity.search centers | DISCOVERY_CENTER_TOO_PRECISE; third center RATE_LIMITED with reason center_changes from the shared budget |

## Dependencies

Module depends on: F06.S01.M01, F06.S01.M03, F06.S02.M01, F06.S02.M03, F06.S03.M01, F06.S03.M02, F07.S02.M02, F11.S01.M02, F11.S01.M03, F12.S01.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-OBS-001, CTR-FLG-001, CTR-FED-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
