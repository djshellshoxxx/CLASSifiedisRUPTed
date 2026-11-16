# PS-148-05 — Authorization and capabilities: Transparency reports

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S02.M02 Transparency reports](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/community/transparency` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-148-05.R01** Vault policy: compiling, recording and discarding require the operator key; publishing requires a different registered operator key; applying a received report is open to the vault owner for trusted publishers.
- **PS-148-05.R02** Relay policy (CAP-9): the relay serves published reports to anonymous readers and accepts uploads only from its operator keys; a relay role has no power over other relays.
- **PS-148-05.R03** Counter data is operator-private and is not readable by members or by other relays.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| governance.transparency.record | owner | local principal holds the operator key; period not frozen |
| governance.transparency.compile | owner | local principal holds the operator key; period ended |
| governance.transparency.review | owner | local key is a registered operator key different from the compiler key; report status computed |
| governance.transparency.apply | owner | vault unlocked; statement signature valid and publisher trusted |
| governance.transparency.read_public | relay-anonymous | public signed reports; relay policy rate limit 60 requests per minute per IP prefix |
| governance.transparency.relay_publish | relay-operator | relay policy: request signed by a registered operator device key; report <= 64 KiB |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-148-09.T05 | integration | PS-148-03.R02, PS-148-05.R02 | same key publishes; reviewer different key publishes | GOVERNANCE_TRANSPARENCY_SELF_REVIEW for the same key; success for O2 |
| TEST-PS-148-09.T08 | abuse | PS-148-05.R01, PS-148-05.R03 | member reads counters; non-operator computes; relay upload with unknown key | FORBIDDEN or NOT_FOUND; relay refuses upload |

## Dependencies

Module depends on: F18.S02.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
