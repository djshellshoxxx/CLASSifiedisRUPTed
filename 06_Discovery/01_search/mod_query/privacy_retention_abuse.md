# PS-046-07 — Privacy, retention and abuse: Search query

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S01.M02 Search query](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/search/query` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-046-07.R01** Queries and saved searches reveal interests and are P3; the vault never sends saved searches anywhere, relay queries carry only the text and filters the user chose to run on that relay, and pulls carry only L1 cells.
- **PS-046-07.R02** A relay sees query text and the coarse center cell; the UI states this and offers local-only search.
- **PS-046-07.R03** Query volume and query complexity are bounded to protect relays and devices.
- **PS-046-07.R04** SavedSearch is registered with F10 - ExportSectionPort (section discovery.saved_searches), DeletionPort (plan deletes saved searches and match rows at execution, not at request) and RetentionPurgePort - and every field is classified P3 with F10.S02.M02.

## Specification

**Data classification**
- SavedSearch: P3, device only; excluded from statements and logs.
- Relay query: query text, filters, center cell (L2 at most) and IP prefix; relay logs never contain query text and truncate IPs per OBS-1.
- Vault pull: the L1 cells of active saved-search areas and the home L1 cell (at most 32 cells), the relay cursor and nothing else; no query text, filters or saved-search ids; disclosed in Settings > Search data.

**Retention**
- SavedSearch: until deleted by the user or the DeletionPort plan executes (RET-STANDARD); match history trimmed to 200 ids.
- Query snapshots 15 minutes; relay query counters RET-EPHEMERAL (24 h).

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | FTS5 operator injection through query text | every term is quoted and bound as a parameter, operators never interpreted, fuzz test of 10 000 strings |
| T02 | Relay operator profiles users by query text | local-only search option, relay logs never hold query text, no account identifier is required for anonymous queries, honest disclosure in the UI |
| T03 | Expensive queries exhaust a relay | 200 characters, 12 terms, depth 500, 4 s timeout, RateLimitPort class read.search |
| T04 | Scraping the relay index | RateLimitPort per token and per IP prefix (/24 IPv4, /48 IPv6), results limited to public P0 fields, pagination depth 500 |
| T05 | Hostile relay returns blocked authors or spam | device-side filterBlocked and local hide apply to relay results at display time; relay results are only labelled, never trusted |
| T06 | Hostile relay forges a title, price or body under a real seller's DID | every relay item is rendered only from the author-signed projection verified against authorDid (V11); failures are dropped |
| T07 | near or filters.distanceKm used to bypass the proximity anti-trilateration limits | the F06.S02.M03 checks and shared proximity budget apply to every relay request with a center (V05, V08, V10) |
| T08 | Vault pulls reveal saved-search criteria to a relay | pulls send only L1 cells at a fixed interval, never text, filters or ids |
| T09 | Relay ranking quietly over-promotes or floods one author | each relay page is checked with F06.S03.M02 auditPage and labelled 'ranking policy not followed' on failure |

**Abuse controls**
- Relay query defaults - RateLimitPort class read.search of F12.S03.M03 (60 per minute per caller key, prefix limit per F12.S03.M03), configurable by the relay operator; requests with a center additionally consume the F06.S02.M03 proximity budget, which is the single definition of those numbers; exceeding returns RATE_LIMITED with retryAfterMs.
- Alert flood control - at most 20 instant alerts per saved search per day, excess folded into the daily digest.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-046-09.T02 | property | PS-046-02.R01, PS-046-07.R03 | 10 000 random strings including FTS5 operators and unbalanced quotes | sanitized to quoted terms, never raises an FTS syntax error, never executes operators |
| TEST-PS-046-09.T09 | abuse | PS-046-05.R01, PS-046-05.R02, PS-046-07.R03 | locked vault calls saved search commands; anonymous relay caller exceeds the read.search quota | UNAUTHENTICATED for the locked vault; RATE_LIMITED with retryAfterMs for the relay |
| TEST-PS-046-09.T11 | abuse | PS-046-07.R01, PS-046-07.R02 | inspect outbox, relay requests and relay logs during saved search use and queries | no saved search content present anywhere; relay request has only the chosen query and cell; relay logs contain no query text |
| TEST-PS-046-09.T14 | a11y | PS-046-07.R02 | search screen with relay sections and disclosure notice, and saved search list, with axe-core | zero serious or critical violations, results count announced, relay disclosure and local-only option present as text |
| TEST-PS-046-09.T19 | abuse | PS-046-04.R04, PS-046-07.R01 | relay returns an item with a forged title and price for a real authorDid, and an item without a projection | neither item is displayed; relay section droppedUnverified 2; DISCOVERY_RELAY_ITEM_UNVERIFIED recorded locally |
| TEST-PS-046-09.T22 | abuse | PS-046-04.R05, PS-046-07.R01 | capture the pull requests for 3 active saved searches with text and price filters | each request has only cells4 (L1) and a cursor, every 30 minutes, no query text, filters or saved-search ids; Settings > Search data lists the same cells |
| TEST-PS-046-09.T23 | integration | PS-046-07.R04 | export, deletion request then cancel, deletion execution, retention purge run | export has section discovery.saved_searches; saved searches survive the cancelled request and are removed only at execution by the DeletionPort plan; fields classified P3 |

## Dependencies

Module depends on: F06.S01.M01, F06.S01.M03, F06.S02.M01, F06.S02.M03, F06.S03.M01, F06.S03.M02, F07.S02.M02, F11.S01.M02, F11.S01.M03, F12.S01.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-OBS-001, CTR-FLG-001, CTR-FED-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
