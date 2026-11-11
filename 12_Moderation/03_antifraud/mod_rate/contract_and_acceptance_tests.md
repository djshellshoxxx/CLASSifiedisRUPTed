# PS-099-09 — Contract and acceptance tests: Rate limiting

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M03 Rate limiting](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/rate` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-099-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-099-09.R02** GCRA, token bucket and window counter arithmetic are covered by property tests against a reference model.
- **PS-099-09.R03** Fail modes, privacy of keys and event throttling are covered by integration and abuse tests.

## Specification

See the module test table below (all processes).

**Fixtures:** Policy write.index gcra limit 20 periodMs 3600000 burst 5; read.search token bucket capacity 60 refill 1 per second; appeal.receive.30d window_counter limit 20 periodMs 2592000000; fixed monotonic clock and injectable wall clock; IPv4 192.0.2.10 and IPv6 2001:db8:1:1::5 for prefix tests.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-099-09.T01 | unit | PS-099-01.R04, PS-099-04.R01 | GCRA 20 per hour burst 5: 5 immediate calls then more | first 5 allowed, 6th denied with retryAfterMs = 180000 minus elapsed |
| TEST-PS-099-09.T02 | property | PS-099-01.R01, PS-099-03.R01 | random arrival sequences against reference GCRA, token bucket and window counter models | decisions identical; tokens within [0, capacity]; tat monotonic; window sums never exceed the limit |
| TEST-PS-099-09.T03 | unit | PS-099-02.R01, PS-099-02.R02, PS-099-02.R03 | policy with limit 0, burst 2000, periodMs of 31 days, ip_prefix scope on a 7-day window, fail open on relay.access; port called with malformed input | VALIDATION_FAILED four times, MODERATION_RATE_POLICY_FAIL_MODE_LOCKED; the port denies without throwing |
| TEST-PS-099-09.T04 | unit | PS-099-01.R03, PS-099-07.R01 | /24 and /48 keys: 192.0.2.10 and 192.0.2.200; two addresses in one /48; daily prefix salt rotation | same prefix hash within an epoch; prefix salt destroyed by 48 h; no raw IP or key in rows or logs |
| TEST-PS-099-09.T05 | integration | PS-099-03.R02, PS-099-04.R03, PS-099-04.R04 | spam.detected with subjectKey and throttle ttl 2 hours; denial storm of 1 000 calls | the key's write buckets found through this module's own HMAC get factor 0.25 for 1 hour only; one rate.exceeded event per key per minute |
| TEST-PS-099-09.T06 | contract | PS-099-04.R01, PS-099-09.R02 | port, commands and event | validate against registry schemas; bus maps denial to RATE_LIMITED with retryAfterMs; port has no HTTP route |
| TEST-PS-099-09.T07 | abuse | PS-099-05.R01, PS-099-05.R02, PS-099-05.R03 | member sets policy; reset by member; anonymous consume | FORBIDDEN, FORBIDDEN, keyed by IP prefix only |
| TEST-PS-099-09.T08 | integration | PS-099-03.R03, PS-099-04.R02 | operator policy change at runtime; vault sets a local guard through the same command; idle eviction | takes effect ≤ 5 s without resetting buckets; local guard stored in scope local; full-capacity buckets evicted |
| TEST-PS-099-09.T09 | chaos | PS-099-06.R01, PS-099-06.R02, PS-099-06.R03 | concurrent consumes on one key; counter store down for reads and for relay.access; restart mid-run | never above burst; reads fail open at half rate; relay.access closed 30 s; loosening ≤ one burst |
| TEST-PS-099-09.T10 | abuse | PS-099-07.R03 | 20 keys from one /24 hammering write.index; attacker rotates 50 keys | prefix limit reached at 5× actor limit; tenant cap holds |
| TEST-PS-099-09.T11 | integration | PS-099-07.R02, PS-099-01.R01 | injected clock: a 24 h class bucket 25 h after its last update; a 30-day class bucket 31 days after its last update | both purged; export contains none |
| TEST-PS-099-09.T12 | load | PS-099-08.R01, PS-099-08.R02, PS-099-08.R03 | 5 000 consumes per second for 5 minutes with 100 000 live buckets; snapshot persistence failure | p95 ≤ 1 ms, memory ≤ 64 MiB, snapshot ≤ 500 ms, snapshot age alert fires |
| TEST-PS-099-09.T13 | unit | PS-099-09.R01, PS-099-09.R03 | traceability tool run | every PS-099 requirement maps to a passing test |
| TEST-PS-099-09.T14 | integration | PS-099-10.R01, PS-099-10.R02, PS-099-10.R03 | export policy, import with an out-of-bounds row, restore backup; v1 policy row with ratePerMinute 30 | valid policies round-trip and the invalid row is rejected; the expand step stores limit 30 periodMs 60000; buckets absent and recreated empty |
| TEST-PS-099-09.T15 | e2e | PS-099-04.R06 | mobile user sends the 11th offer in an hour with the local guard at 10 and opens an 11th open offer | confirmation dialogs appear; no count is sent to any relay; axe zero serious issues |
| TEST-PS-099-09.T16 | property | PS-099-03.R04, PS-099-01.R03 | 20-per-30-days window_counter with arrivals spread over 60 days and a salt rotation on day 15 | at most 20 allowed in any 30-day window across the rotation; previous salt destroyed once its last counter leaves the window |
| TEST-PS-099-09.T17 | integration | PS-099-04.R05 | moderation.signal.recorded report_dismissed_bad_faith observed 10 days ago (delivered twice) for reporter key R; R files 4 reports in 24 h; one more marked exempt (minor_safety); clock advanced 21 more days | one marker row; 4th RATE_LIMITED under report.receive.reduced; exempt one allowed under report.receive; after the marker expires report.receive applies again |
| TEST-PS-099-09.T18 | unit | PS-099-01.R02, PS-099-01.R04 | ratepolicy.set for 5 per 24 h, 20 per hour, 50 per 24 h and 20 per 30 days | all accepted and stored with limit and periodMs; GCRA emission interval reported as periodMs / limit |
| TEST-PS-099-09.T19 | contract | PS-099-04.R07, PS-099-01.R05, PS-099-02.R04 | F06.S02.M03 contract fixture registers the four proximity classes with its v1 numbers (20 per minute and 200 per hour, 60 per minute and 600 per hour, a center_seen probe of 1 per 24 h, 2 new centers per hour and 5 per 24 h with failModeLocked); a second module registers read.proximity.center_new again; an operator sets failMode open on it | tenant rows seeded with ownerModule F06.S02.M03 and longWindow; VALIDATION_FAILED for the duplicate owner; MODERATION_RATE_POLICY_FAIL_MODE_LOCKED |
| TEST-PS-099-09.T20 | property | PS-099-03.R05, PS-099-03.R04 | random arrivals against a class with 20 per minute and longWindow 200 per hour, and against center_new over 3 days with a salt rotation at each midnight; center_seen probes for repeated and new cells | never more than 20 in any minute or 200 in any hour; never more than 5 new centers in any 24 h across rotations; previous salt kept 24 h then destroyed; a repeated cell is refused by the probe and costs nothing in center_new |
| TEST-PS-099-09.T21 | chaos | PS-099-06.R03 | counter store down during proximity searches | read.proximity.query.* allowed at half rate in memory; read.proximity.center_new returns RATE_LIMITED for 30 seconds |
| TEST-PS-099-09.T22 | integration | PS-099-04.R08, PS-099-01.R05, PS-099-02.R04 | request.default at 120 per minute; one request consuming three classes; anonymous caller; set request.default to 5 and to 1500; tenant migration with requestRatePerMinutePerKey 300 | the request charges request.default once; the 121st request in a minute is RATE_LIMITED whatever its class; anonymous charged by prefix; VALIDATION_FAILED twice; expand step writes limit 300 periodMs 60000 |

## Acceptance criteria

- All tests T01–T22 pass in CI.
- Concurrent requests never exceed burst plus rate × elapsed time, and window counters never exceed their limit across salt rotations (property tests).
- No raw IP address or actor key is ever persisted or logged by this module.

## Dependencies

Module depends on: F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
