# PS-089-05 — Authorization and capabilities: Federation blocklists

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M02 Federation blocklists](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/blocklists` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-089-05.R01** In a vault only the unlocked local principal manages rules; on a relay only that relay's operator does, with an audit entry.
- **PS-089-05.R02** Evaluate is an internal capability for the verified receive and delivery pipelines and is not exposed to external requests.
- **PS-089-05.R03** Rules are never readable by other users or other relays unless the owner publishes a list on purpose.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| federation.block_rule.add | local principal, operator | vault policy: unlocked vault owner; relay policy: operator of this relay with audit entry |
| federation.block_rule.import | local principal, operator | same as add |
| federation.block_rule.review | local principal, operator | same as add; every approval names the rule id |
| federation.block_rule.update | local principal, operator | same as add; rule belongs to the tenant |
| federation.block_rule.publish | local principal | vault owner only; relays do not publish operator rules by default |
| federation.block_rule.read | local principal, operator | own vault or own relay only |
| federation.block_rule.evaluate | system | internal call from the verified pipelines |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-089-09.T08 | abuse | PS-089-05.R01, PS-089-05.R02, PS-089-05.R03 | other vault reads rules; external evaluate call; non-operator edits relay rules | NOT_FOUND or FORBIDDEN |
| TEST-PS-089-09.T10 | integration | PS-089-06.R03, PS-089-05.R03 | rule added while a batch is in flight | batch uses start snapshot; next batch applies the rule |

## Dependencies

Module depends on: F11.S01.M03, F07.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
