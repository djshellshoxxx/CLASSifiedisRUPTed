# PS-046-07 — Privacy, retention and abuse: Search query

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S01.M02 Search query](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/search/query` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-046-07.R01** Queries and saved searches reveal interests and are P3; the vault never sends saved searches anywhere, and relay queries carry only the text and filters the user chose to run on that relay.
- **PS-046-07.R02** A relay sees query text and the coarse center cell; the UI states this and offers local-only search.
- **PS-046-07.R03** Query volume and query complexity are bounded to protect relays and devices.

## Specification

**Data classification**
- SavedSearch: P3, device only; excluded from statements and logs.
- Relay query: query text, filters, center cell (L2 at most) and IP prefix; relay logs keep no query text beyond 24 h and truncate IPs per OBS-1.

**Retention**
- SavedSearch: until deleted by the user or vault erase (RET-STANDARD); match history trimmed to 200 ids.
- Query snapshots 15 minutes; relay query counters RET-EPHEMERAL (24 h).

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | FTS5 operator injection through query text | every term is quoted and bound as a parameter, operators never interpreted, fuzz test of 10 000 strings |
| T02 | Relay operator profiles users by query text | local-only search option, relay logs minimized, no account identifier is required for anonymous queries, honest disclosure in the UI |
| T03 | Expensive queries exhaust a relay | 200 characters, 12 terms, depth 500, 4 s timeout, relay rate limits by policy |
| T04 | Scraping the relay index | relay policy quotas per token and per IP /24, results limited to public P0 fields, pagination depth 500 |
| T05 | Hostile relay returns blocked authors or spam | device-side block filter and local hide apply to relay results; results are only labelled, never trusted |

**Abuse controls**
- Relay query defaults - 60 per minute and 600 per hour per token or IP /24, configurable by the relay operator; exceeding returns RATE_LIMITED with retryAfterMs.
- Alert flood control - at most 20 instant alerts per saved search per day, excess folded into the daily digest.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-046-09.T02 | property | PS-046-02.R01, PS-046-07.R03 | 10 000 random strings including FTS5 operators and unbalanced quotes | sanitized to quoted terms, never raises an FTS syntax error, never executes operators |
| TEST-PS-046-09.T09 | abuse | PS-046-05.R01, PS-046-05.R02, PS-046-07.R03 | locked vault calls saved search commands; anonymous relay caller exceeds quota | FORBIDDEN or UNAUTHENTICATED for the vault; RATE_LIMITED with retryAfterMs for relay |
| TEST-PS-046-09.T11 | abuse | PS-046-07.R01, PS-046-07.R02 | inspect outbox, relay requests and logs during saved search use | no saved search content present anywhere; relay request has only chosen query and cell |

## Dependencies

Module depends on: F06.S01.M01, F06.S01.M03, F06.S02.M03, F06.S03.M01, F06.S03.M02, F07.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
