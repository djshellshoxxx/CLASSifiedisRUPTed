# PS-099-03 — Workflow state machine: Rate limiting

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M03 Rate limiting](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/rate` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-099-03.R01** Bucket state evolves only by the GCRA or token bucket arithmetic, and a bucket idle for its full refill time is equivalent to a new bucket.
- **PS-099-03.R02** Penalties from spam throttles expire after at most 1 hour and never accumulate beyond factor 0.25.
- **PS-099-03.R03** Policy changes take effect for new consume calls within 5 seconds without resetting buckets.

## Specification

**Note:** Buckets and policies have no lifecycle states; a bucket is either present with arithmetic state or expired and recreated at full capacity.

### Timeouts and scheduled transitions

- Idle bucket eviction every 60 s removes buckets whose state equals full capacity; hard retention 24 h.
- Counter snapshots are persisted every 5 s.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-099-09.T02 | property | PS-099-01.R01, PS-099-03.R01 | random arrival sequences against reference GCRA and token bucket models | decisions identical; tokens within [0, capacity]; tat monotonic |
| TEST-PS-099-09.T05 | integration | PS-099-03.R02, PS-099-04.R03 | spam.detected with throttle ttl 2 hours; denial storm of 1 000 calls | factor 0.25 for 1 hour only; one rate.exceeded event per key per minute |
| TEST-PS-099-09.T08 | integration | PS-099-03.R01, PS-099-03.R03 | policy change at runtime; idle eviction | takes effect ≤ 5 s without resetting buckets; full-capacity buckets evicted |

## Dependencies

Module depends on: F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
