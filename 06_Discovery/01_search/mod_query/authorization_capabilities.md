# PS-046-05 — Authorization and capabilities: Search query

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S01.M02 Search query](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/search/query` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-046-05.R01** Vault policy - saved search commands and queries are available only to the unlocked local principal for their own records; a locked vault returns UNAUTHENTICATED (CAP-10).
- **PS-046-05.R02** Relay policy - the relay query endpoint is public read; whether anonymous callers are allowed and at what rate is the relay operator's policy, expressed as F12.S03.M03 RatePolicy rows (class read.search) plus the shared proximity budget of F06.S02.M03 for requests with a center, and token-bearing callers get a higher quota.
- **PS-046-05.R03** Block and hide filtering happens on the device after results are received; the relay is never told whom the user blocked or what the user hid.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| discovery.saved_search.write_own | principal | vault - unlocked local principal owns the record |
| discovery.saved_search.read_own | principal | vault - unlocked local principal owns the record |
| discovery.search_document.read_public | principal, anonymous | vault - unlocked principal; relay - public read allowed by relay policy, under RateLimitPort class read.search and, with a center, the F06.S02.M03 proximity budget |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-046-09.T08 | integration | PS-046-05.R03 | relay returns a blocked author's listing and a locally hidden listing | both filtered on the device with filterBlocked and the local hide port before display; relay request carries no block or hide data |
| TEST-PS-046-09.T09 | abuse | PS-046-05.R01, PS-046-05.R02, PS-046-07.R03 | locked vault calls saved search commands; anonymous relay caller exceeds the read.search quota | UNAUTHENTICATED for the locked vault; RATE_LIMITED with retryAfterMs for the relay |

## Dependencies

Module depends on: F06.S01.M01, F06.S01.M03, F06.S02.M01, F06.S02.M03, F06.S03.M01, F06.S03.M02, F07.S02.M02, F11.S01.M02, F11.S01.M03, F12.S01.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-OBS-001, CTR-FLG-001, CTR-FED-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
