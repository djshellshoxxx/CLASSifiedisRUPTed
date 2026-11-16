# PS-098-08 — Observability and performance: Account limits

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M04 Account limits](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/limits` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-098-08.R01** Check outcomes and tier distribution are measured per CTR-OBS-001 without keys.
- **PS-098-08.R02** Check meets p95 ≤ 5 ms in-process on a relay.
- **PS-098-08.R03** Override counts and denials are observable for abuse review.

## Specification

**Metrics**
- classrup_moderation_limit_checks_total{limit,outcome=allowed|denied}
- classrup_moderation_limit_keys{tier} (gauge)
- classrup_moderation_limit_overrides_total

**Logs**
- relay info limit.changed {accountLimitId, limitKey, cause, correlationId} — no keys.

**Budgets**
- check p95 ≤ 5 ms; override p95 ≤ 300 ms; list_mine p95 ≤ 100 ms.
- Daily tier sweep of 100 000 keys completes in ≤ 60 s.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-098-09.T12 | load | PS-098-08.R01, PS-098-08.R02, PS-098-08.R03 | 2 000 checks per second for 5 minutes; sweep 100 000 keys | p95 ≤ 5 ms; sweep ≤ 60 s |

## Dependencies

Module depends on: F12.S03.M01, F12.S03.M03, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
