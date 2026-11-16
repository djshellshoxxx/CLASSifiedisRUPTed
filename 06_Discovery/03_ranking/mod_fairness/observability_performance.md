# PS-050-08 — Observability and performance: Ranking fairness

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S03.M02 Ranking fairness](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/ranking/fairness` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-050-08.R01** Re-ranking cost is measured inside query latency on relays and in vault diagnostics.
- **PS-050-08.R02** rerank over 200 candidates takes at most 5 ms p95 on a Moto G-class device.
- **PS-050-08.R03** Constraint outcomes are counted for monitoring fairness effects.

## Specification

**Metrics**
- classrup_discovery_fairness_author_capped_total
- classrup_discovery_fairness_new_author_slots_filled_total
- classrup_discovery_fairness_promoted_demoted_total

**Logs**
- debug fairness.applied {capped, newSlots, promotedDemoted} - counts only.

**Budgets**
- rerank(200 candidates, page 20) p95 <= 5 ms on a Moto G-class device and <= 2 ms on the relay reference host.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-050-09.T11 | load | PS-050-08.R01, PS-050-08.R02, PS-050-08.R03 | rerank 200 candidates 10 000 times on emulated device | p95 <= 5 ms |

## Dependencies

Module depends on: F06.S03.M01, F06.S02.M01, CTR-ID-001, CTR-ERR-001, CTR-SCH-001, CTR-UX-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
