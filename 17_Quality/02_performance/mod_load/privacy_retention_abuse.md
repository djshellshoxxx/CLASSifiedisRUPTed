# PS-139-07 — Privacy, retention and abuse: Load testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M01 Load testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/load` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-139-07.R01** Load data are synthetic P0; the report contains no listing text or IDs of real users.
- **PS-139-07.R02** Relay logs captured during load are scanned for P2–P4 canaries.
- **PS-139-07.R03** Reports are retained 90 days as CI artifacts to allow trend comparisons.

## Specification

**Data classification**
- Synthetic seeded listings and edges (P0/P1).
- Reports: latency numbers, environment descriptors, no payloads.

**Retention**
- Reports 90 days as CI artifacts; local reports git-ignored.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Load test pointed at a production relay | host allow list in code and CI egress rules; run refuses with QUALITY_LOAD_HOST_FORBIDDEN |
| T02 | Budgets quietly relaxed to pass | budgets read from CTR-OBS-001 constants file; changes need a contract change reviewed by the architecture owner |
| T03 | Report leaks sensitive data | report schema whitelists fields; relay logs scanned for canaries |

**Abuse controls**
- Per-run tokens are minted for the test tenant and revoked at the end.
- The soak profile is allowed only in the nightly workflow with a 90 min timeout.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-139-09.T12 | abuse | PS-139-07.R01, PS-139-07.R02, PS-139-07.R03 | scan report and relay logs for canaries and retention config | no canary; reports kept 90 days |

## Dependencies

Module depends on: CTR-OBS-001, CTR-TST-001, CTR-IDM-001, CTR-ERR-001, F17.S01.M01, F15.S02.M01, F15.S02.M03. Predecessor: [domain_schema.md](domain_schema.md).
