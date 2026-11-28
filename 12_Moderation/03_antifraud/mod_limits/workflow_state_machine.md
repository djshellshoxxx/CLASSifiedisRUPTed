# PS-098-03 — Workflow state machine: Account limits

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M04 Account limits](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/limits` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-098-03.R01** Tier derives from relay-clock age since this relay's own first observation of the key and completed dealings counted from voluntarily submitted two-party completion statements, and promotion is evaluated by the daily sweep and by each counted submission.
- **PS-098-03.R02** A risk level change recomputes the multiplier immediately, and recovery to low restores the base value immediately.
- **PS-098-03.R03** Overrides expire automatically at overrideExpiresAt and the recompute emits a limit.changed event.
- **PS-098-03.R04** An active restrict_feature action whose restricted capabilities map to a limit key sets that limit to 0 until the action expires or is reverted, which clears it and emits limit.changed with cause action_expired or action_reverted.

## Specification

**Note:** Limits are recomputed values without lifecycle states; tier, risk, restriction and override changes recompute effectiveValue and emit events.

### Timeouts and scheduled transitions

- Daily tier sweep at 03:15 UTC re-tiers keys; override and action-restriction expiry check every 60 s.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-098-09.T02 | property | PS-098-01.R03, PS-098-03.R02 | random tiers, multipliers, overrides and action restrictions | effective value follows the documented formula; 0 while a restriction is active; never below 1 otherwise unless base is 0 or the override sets 0 |
| TEST-PS-098-09.T04 | integration | PS-098-03.R01, PS-098-03.R03 | B submits completions until 3 are counted on day 8 then the daily sweep runs; an override expires | tier promoted once both conditions hold; limit.changed emitted for the promotion and on expiry |
| TEST-PS-098-09.T05 | integration | PS-098-03.R02, PS-098-04.R03 | risk.elevated medium, then high, then risk.lowered medium, then risk.lowered low | 0.75×, 0.5×, 0.75× and base, each immediately on its event; one limit.changed per distinct value |
| TEST-PS-098-09.T16 | integration | PS-098-03.R04, PS-098-04.R04 | restrict_feature with restrictedCapabilities [federation.record.ingest, auctions.bid.place, bazaar.offer.receive] for 7 days, overturned after 2 days; another such action reaches expiry | index_writes and bids 0 while active, new recipients unchanged, bazaar.offer.receive ignored; restored with cause action_reverted; second restored with cause action_expired |

## Dependencies

Module depends on: F12.S03.M03, F07.S02.M01, F16.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
