# PS-097-08 — Observability and performance: Spam detection

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M02 Spam detection](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/spam` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-097-08.R01** Evaluation outcomes and timing are measured per CTR-OBS-001 on relays and kept as local diagnostics in the vault.
- **PS-097-08.R02** Evaluation meets p95 ≤ 20 ms for 20000 code points on a relay and ≤ 50 ms on a Moto G-class device.
- **PS-097-08.R03** Degraded mode and index size are observable.

## Specification

**Metrics**
- classrup_moderation_spam_evaluations_total{outcome=clean|detected|degraded}
- classrup_moderation_spam_score_bucket (histogram 0..100)
- classrup_moderation_spam_index_entries (gauge)

**Logs**
- relay info spam.detected {targetCid, score, heuristics, correlationId} — no text, no raw keys.

**Budgets**
- evaluate p95 ≤ 20 ms (relay) and ≤ 50 ms (Moto G profile) for 20000 code points.
- Index rebuild of 100 000 entries completes in ≤ 5 minutes.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-097-09.T11 | load | PS-097-08.R01, PS-097-08.R02, PS-097-08.R03 | 200 evaluations per second for 5 minutes at 20000 code points; rebuild 100 000 entries | p95 ≤ 20 ms relay, rebuild ≤ 5 minutes, metrics exported |

## Dependencies

Module depends on: F12.S03.M02, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
