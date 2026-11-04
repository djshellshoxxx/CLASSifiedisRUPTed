# PS-046-02 — Validation rules: Search query

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S01.M02 Search query](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/search/query` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-046-02.R01** Query text and cursors are validated before any database access, with strict limits that bound work per query.
- **PS-046-02.R02** Saved search input is validated like a query plus ownership, count and area rules.
- **PS-046-02.R03** Every violation maps to one stable error code with a localized message key.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | queryText is at most 200 code points, at most 12 terms, each term 1..64 code points after NFC and control-character removal | DISCOVERY_QUERY_INVALID |
| V02 | limit is 1..50 (default 20) and requested depth is at most 500 results | VALIDATION_FAILED |
| V03 | cursor is well-formed, at most 512 bytes, matches the query hash, and on a relay carries a valid HMAC and is younger than 15 minutes | EXPIRED |
| V04 | filters pass F06.S01.M03 validation | DISCOVERY_FILTER_INVALID |
| V05 | centerCell5 has 5 characters and radiusKm is in 5, 10, 25, 50, 100 | DISCOVERY_RADIUS_TOO_SMALL |
| V06 | the vault holds fewer than 25 non-deleted saved searches | DISCOVERY_SAVED_SEARCH_LIMIT |
| V07 | name is 1..60 code points and alertMode is a known value | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-046-09.T01 | unit | PS-046-01.R01, PS-046-02.R01 | create saved search with valid input | record stored with status active, revision 1, matchedDocIds empty |
| TEST-PS-046-09.T02 | property | PS-046-02.R01, PS-046-07.R03 | 10 000 random strings including FTS5 operators and unbalanced quotes | sanitized to quoted terms, never raises an FTS syntax error, never executes operators |
| TEST-PS-046-09.T03 | unit | PS-046-01.R02, PS-046-02.R02 | limits: 201-char query, 13 terms, 26th saved search, limit 51 | DISCOVERY_QUERY_INVALID, DISCOVERY_SAVED_SEARCH_LIMIT or VALIDATION_FAILED respectively |
| TEST-PS-046-09.T04 | unit | PS-046-02.R03, PS-046-03.R01 | cursor tampered, aged 16 minutes, or from another query | EXPIRED or VALIDATION_FAILED with no data returned |

## Dependencies

Module depends on: F06.S01.M01, F06.S01.M03, F06.S02.M03, F06.S03.M01, F06.S03.M02, F07.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
