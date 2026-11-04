# PS-083-08 — Observability and performance: Portable record packaging

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M01 Portable record packaging](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/portable` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-083-08.R01** Mapping outcomes are counted per rejection code without recording field values.
- **PS-083-08.R02** Building one draft takes under 1 ms p95 for a typical 4 KiB listing.
- **PS-083-08.R03** Allowlist coverage is reported as a build artifact on every CI run.

## Specification

**Metrics**
- classrup_federation_draft_total{outcome=ok|not_opted_in|forbidden_field|invalid}
- classrup_federation_inbound_payload_total{outcome=ok|invalid|too_large}

**Logs**
- info federation.draft.refused {type, code, correlationId} — never field values or record contents.

**Budgets**
- buildDraft p95 ≤ 1 ms for records ≤ 4 KiB; ≤ 10 ms for 65536 byte payloads.
- Allowlist coverage check completes in ≤ 5 s in CI.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-083-09.T13 | load | PS-083-08.R02, PS-083-08.R01 | 10 000 draft builds of 4 KiB records | p95 ≤ 1 ms, counters exported |
| TEST-PS-083-09.T14 | unit | PS-083-08.R03, PS-083-09.R01 | coverage and traceability tools run | allowlist report produced; every PS-083 requirement maps to a passing test |

## Dependencies

Module depends on: F10.S02.M02, CTR-FED-001, CTR-PRV-001, CTR-ERR-001, CTR-SCH-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
