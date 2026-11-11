# PS-099-03 — Workflow state machine: Rate limiting

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M03 Rate limiting](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/rate` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-099-03.R01** Bucket state evolves only by the GCRA, token bucket or window counter arithmetic, and a bucket idle for its full window is equivalent to a new bucket.
- **PS-099-03.R02** Penalties from spam throttles expire after at most 1 hour and never accumulate beyond factor 0.25.
- **PS-099-03.R03** Policy changes take effect for new consume calls within 5 seconds without resetting buckets.
- **PS-099-03.R04** Counting survives salt rotation, because consume looks a key up under the current and the previous epoch salt and sums window counters across both until the previous epoch has left the window, after which the previous salt is destroyed.
- **PS-099-03.R05** A class with a longWindow allows a request only when both windows allow and counts it in both, its salt epoch lasts max(24 h, longWindow periodMs), and for 24 h windows such as read.proximity.center_new the previous salt is kept 24 h after rotation and checked together with the current one.

## Specification

**Note:** Buckets and policies have no lifecycle states; a bucket is either present with arithmetic state or expired and recreated at full capacity.

### Timeouts and scheduled transitions

- Idle bucket eviction every 60 s removes buckets whose state equals full capacity or whose expiresAt has passed.
- Counter snapshots are persisted every 5 s.
- Class salt epochs rotate every max(24 h, the class's longest window); the previous salt is destroyed when the oldest counter keyed under it is older than that window (24 h after rotation for 24 h windows).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-099-09.T02 | property | PS-099-01.R01, PS-099-03.R01 | random arrival sequences against reference GCRA, token bucket and window counter models | decisions identical; tokens within [0, capacity]; tat monotonic; window sums never exceed the limit |
| TEST-PS-099-09.T05 | integration | PS-099-03.R02, PS-099-04.R03, PS-099-04.R04 | spam.detected with subjectKey and throttle ttl 2 hours; denial storm of 1 000 calls | the key's write buckets found through this module's own HMAC get factor 0.25 for 1 hour only; one rate.exceeded event per key per minute |
| TEST-PS-099-09.T08 | integration | PS-099-03.R03, PS-099-04.R02 | operator policy change at runtime; vault sets a local guard through the same command; idle eviction | takes effect ≤ 5 s without resetting buckets; local guard stored in scope local; full-capacity buckets evicted |
| TEST-PS-099-09.T16 | property | PS-099-03.R04, PS-099-01.R03 | 20-per-30-days window_counter with arrivals spread over 60 days and a salt rotation on day 15 | at most 20 allowed in any 30-day window across the rotation; previous salt destroyed once its last counter leaves the window |
| TEST-PS-099-09.T20 | property | PS-099-03.R05, PS-099-03.R04 | random arrivals against a class with 20 per minute and longWindow 200 per hour, and against center_new over 3 days with a salt rotation at each midnight; center_seen probes for repeated and new cells | never more than 20 in any minute or 200 in any hour; never more than 5 new centers in any 24 h across rotations; previous salt kept 24 h then destroyed; a repeated cell is refused by the probe and costs nothing in center_new |

## Dependencies

Module depends on: F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
