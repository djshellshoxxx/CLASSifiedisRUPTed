# PS-045-05 — Authorization and capabilities: Search index

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S01.M01 Search index](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/search/index` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-045-05.R01** Vault policy - only the unlocked local principal may run rebuild or read statistics on the vault index; indexing itself runs as the system actor of the local event dispatcher.
- **PS-045-05.R02** Relay policy - rebuild and statistics on a relay require the relay operator role of that relay; no relay role affects any vault.
- **PS-045-05.R03** Search reads of documents are authorized in F06.S01.M02 and F06.S02.M03 and expose only public fields.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| discovery.search_document.rebuild | principal, operator | vault - unlocked local principal; relay - operator role of that relay and no rebuild running |
| discovery.search_document.read_stats | principal, operator | vault - unlocked local principal; relay - operator role of that relay |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-045-09.T09 | abuse | PS-045-05.R01, PS-045-05.R02 | non-operator calls rebuild on a relay; locked vault calls rebuild | FORBIDDEN in both cases |
| TEST-PS-045-09.T13 | integration | PS-045-05.R03, PS-045-07.R01 | query layer asks for a document from a removed row | no title or body is ever returned |

## Dependencies

Module depends on: F06.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-FED-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
