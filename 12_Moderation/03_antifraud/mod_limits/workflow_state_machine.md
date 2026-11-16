# PS-098-03 — Workflow state machine: Account limits

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M04 Account limits](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/limits` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-098-03.R01** Tier derives from relay-clock age and completed dealings, and promotion is evaluated by the daily sweep and by deal completion events.
- **PS-098-03.R02** A risk level change recomputes the multiplier immediately, and recovery to low restores the base value immediately.
- **PS-098-03.R03** Overrides expire automatically at overrideExpiresAt and the recompute emits a limit.changed event.

## Specification

**Note:** Limits are recomputed values without lifecycle states; tier and risk changes recompute effectiveValue and emit events.

### Timeouts and scheduled transitions

- Daily tier sweep at 03:15 UTC re-tiers keys; override expiry check every 60 s.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-098-09.T02 | property | PS-098-01.R03, PS-098-03.R02 | random tiers, multipliers and overrides | effective value follows the documented formula; never below 1 unless base is 0 or override sets 0 |
| TEST-PS-098-09.T04 | integration | PS-098-03.R01, PS-098-03.R03, PS-098-04.R03 | deal.completed events and 7-day sweep; override expiry | tier promoted once both conditions hold; limit.changed emitted on expiry |
| TEST-PS-098-09.T05 | integration | PS-098-03.R02, PS-098-04.R03 | risk.elevated medium then high then recovery | effective value 0.75×, 0.5×, then base; one event per distinct value |

## Dependencies

Module depends on: F12.S03.M01, F12.S03.M03, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
