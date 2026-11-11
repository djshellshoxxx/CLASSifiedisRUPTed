# PS-089-08 — Observability and performance: Federation blocklists

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M02 Federation blocklists](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/blocklists` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-089-08.R01** Rule counts and match counts are exported on relays and kept in local diagnostics in the vault; the PWA sends no telemetry.
- **PS-089-08.R02** Evaluate adds at most 0.5 ms p95 to ingest.
- **PS-089-08.R03** An alert fires when a relay's matched-reject ratio exceeds 50 percent over 15 minutes, signalling a misconfigured rule.

## Specification

**Metrics**
- classrup_federation_block_rules{status}
- classrup_federation_block_matches_total{ruleType, action}
- classrup_federation_block_bypass_total{type}
- classrup_federation_block_import_total{outcome=ok|too_large|invalid}

**Logs**
- info federation.block_rule.changed {ruleId, ruleType, action, change, correlationId} — value omitted for author rules.

**Budgets**
- evaluate p95 ≤ 0.5 ms with 100000 rules loaded.
- Import and validation of 10000 entries ≤ 2 s.
- Rule writes p95 ≤ 300 ms.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-089-09.T13 | load | PS-089-08.R01, PS-089-08.R02, PS-089-08.R03 | evaluate 100000 envelopes against 100000 rules; import 10000 entries | p95 ≤ 0.5 ms, import ≤ 2 s, alert at 50 percent reject ratio |

## Dependencies

Module depends on: F11.S01.M01, F11.S01.M03, F07.S02.M02, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
