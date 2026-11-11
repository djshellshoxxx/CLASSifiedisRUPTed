# PS-100-06 — Failure recovery and idempotency: Risk scoring

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M01 Risk scoring](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/risk` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-100-06.R01** Recompute is idempotent by inputDigest and creates at most one assessment per digest.
- **PS-100-06.R02** The assessment row and the level event commit in one transaction.
- **PS-100-06.R03** Debounced recomputes tolerate duplicate and out-of-order signal events.

## Specification

- **idempotency:** Unique (tenantId, subjectType, subjectRef, inputDigest); repeated recompute returns the stored assessment; local Idempotency-Key replay returns the stored response for 24 h.
- **concurrency:** Concurrent recomputes race on the unique digest index; the loser reads the winner; hysteresis reads the latest committed previous level in the same transaction.
- **retries:** Event consumer retries per EVT-6; callers retry DEPENDENCY_UNAVAILABLE and MODERATION_RISK_ASSESSMENT_STALE with refresh.
- **offline:** The vault computes assessments offline from local signals; relay assessments need the relay.
- **partial failure:** If signal reads fail the recompute aborts and the previous assessment stays valid until validUntil; frictions never auto-escalate on failure; a missed crossing time is caught by the next scheduler run within 24 h.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-100-09.T09 | integration | PS-100-06.R01, PS-100-06.R02, PS-100-06.R03 | same digest recompute twice; signal store failure; crash after assessment before event; out-of-order signal events | single row; previous assessment valid; event delivered once after recovery; same final level |

## Dependencies

Module depends on: F12.S03.M02, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
