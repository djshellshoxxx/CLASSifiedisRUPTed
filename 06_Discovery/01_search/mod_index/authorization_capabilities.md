# PS-045-05 — Authorization and capabilities: Search index

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S01.M01 Search index](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/search/index` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-045-05.R01** Vault policy - only the unlocked local principal may run rebuild or read statistics on the vault index; indexing itself runs as the system actor of the local event dispatcher.
- **PS-045-05.R02** Relay policy - rebuild, statistics, set_promotion and clear_promotion on a relay require the relay operator role of that relay; no relay role affects any vault, and promotion exists only on the relay that sold it.
- **PS-045-05.R03** Search reads of documents are authorized in F06.S01.M02 and F06.S02.M03 and expose only public fields; the relay cell feed is public read under that relay's policy and the F12.S03.M03 read.search rate class.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| discovery.search_document.rebuild | principal, operator | vault - unlocked local principal; relay - operator role of that relay and no rebuild running |
| discovery.search_document.read_stats | principal, operator | vault - unlocked local principal; relay - operator role of that relay |
| discovery.search_document.promote | operator | relay only - operator role of that relay; the claim is final or acknowledged with this relay operator's key (V09); never available in a vault |
| discovery.search_document.read_cell_feed | principal, anonymous | relay only - public read allowed by relay policy and consumed through RateLimitPort class read.search (F12.S03.M03) |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-045-09.T09 | abuse | PS-045-05.R01, PS-045-05.R02 | non-operator calls rebuild or set_promotion on a relay; locked vault calls rebuild | FORBIDDEN on the relay; UNAUTHENTICATED for the locked vault |
| TEST-PS-045-09.T13 | integration | PS-045-05.R03, PS-045-07.R01 | query layer asks for a document from a removed row | no title or body is ever returned |
| TEST-PS-045-09.T29 | integration | PS-045-04.R05, PS-045-05.R03 | list_by_cell with 2 L1 cells, with a 5-character cell, with 9 cells, and over quota | signed envelopes returned; VALIDATION_FAILED twice; RATE_LIMITED from RateLimitPort |

## Dependencies

Module depends on: F06.S02.M01, F01.S01.M03, F11.S01.M01, F11.S01.M02, F11.S01.M03, F09.S01.M01, F12.S03.M03, F15.S04.M03, F18.S01.M02, F10.S01.M02, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-FED-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001, CTR-COM-001. Predecessor: [domain_schema.md](domain_schema.md).
