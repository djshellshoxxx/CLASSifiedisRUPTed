# PS-099-09 — Contract and acceptance tests: Rate limiting

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M03 Rate limiting](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/rate` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-099-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-099-09.R02** GCRA and token bucket arithmetic are covered by property tests against a reference model.
- **PS-099-09.R03** Fail modes, privacy of keys and event throttling are covered by integration and abuse tests.

## Specification

See the module test table below (all processes).

**Fixtures:** Policy write.offer gcra 20 per hour burst 5; read.search token bucket capacity 60 refill 1 per second; fixed monotonic clock; IPv4 192.0.2.10 and IPv6 2001:db8:1:1::5 for prefix tests.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-099-09.T01 | unit | PS-099-01.R01, PS-099-01.R02, PS-099-04.R01 | GCRA 20/hour burst 5: 5 immediate calls then more | first 5 allowed, 6th denied with retryAfterMs = 3 minutes minus elapsed |
| TEST-PS-099-09.T02 | property | PS-099-01.R01, PS-099-03.R01 | random arrival sequences against reference GCRA and token bucket models | decisions identical; tokens within [0, capacity]; tat monotonic |
| TEST-PS-099-09.T03 | unit | PS-099-02.R01, PS-099-02.R02, PS-099-02.R03 | policy with rate 0, burst 2000, fail open on relay.access | VALIDATION_FAILED, VALIDATION_FAILED, RATE_POLICY_FAIL_MODE_LOCKED |
| TEST-PS-099-09.T04 | unit | PS-099-01.R03, PS-099-04.R02 | /24 and /48 keys: 192.0.2.10 and 192.0.2.200; two addresses in one /48 | same prefix hash; salt rotates after 24 h; no raw IP in rows or logs |
| TEST-PS-099-09.T05 | integration | PS-099-03.R02, PS-099-04.R03 | spam.detected with throttle ttl 2 hours; denial storm of 1 000 calls | factor 0.25 for 1 hour only; one rate.exceeded event per key per minute |
| TEST-PS-099-09.T06 | contract | PS-099-04.R01, PS-099-04.R03, PS-099-09.R02 | port, commands and event | validate against registry schemas; bus maps denial to RATE_LIMITED with retryAfterMs |
| TEST-PS-099-09.T07 | abuse | PS-099-05.R01, PS-099-05.R02, PS-099-05.R03 | member sets policy; reset by member; anonymous consume | FORBIDDEN, FORBIDDEN, keyed by IP prefix only |
| TEST-PS-099-09.T08 | integration | PS-099-03.R01, PS-099-03.R03 | policy change at runtime; idle eviction | takes effect ≤ 5 s without resetting buckets; full-capacity buckets evicted |
| TEST-PS-099-09.T09 | chaos | PS-099-06.R01, PS-099-06.R02, PS-099-06.R03 | counter store down for reads and for relay.access; restart mid-run | reads fail open at half rate; relay.access closed 30 s; loosening ≤ one burst |
| TEST-PS-099-09.T10 | abuse | PS-099-07.R01, PS-099-07.R03 | 20 keys from one /24 hammering write.offer; attacker rotates 50 keys | prefix limit reached at 5× actor limit; tenant cap holds |
| TEST-PS-099-09.T11 | integration | PS-099-07.R02 | buckets after 24 hours | purged; export contains none |
| TEST-PS-099-09.T12 | load | PS-099-08.R01, PS-099-08.R02, PS-099-08.R03 | 5 000 consumes per second for 5 minutes with 100 000 live buckets | p95 ≤ 1 ms, memory ≤ 64 MiB, snapshot ≤ 500 ms |
| TEST-PS-099-09.T13 | unit | PS-099-09.R01, PS-099-09.R03 | traceability tool run | every PS-099 requirement maps to a passing test |
| TEST-PS-099-09.T14 | integration | PS-099-10.R01, PS-099-10.R02, PS-099-10.R03 | export policy, import, restore backup | policies round-trip; buckets absent and recreated empty |
| TEST-PS-099-09.T15 | e2e | PS-099-01.R01, PS-099-04.R02 | mobile user sends 11th offer in an hour with local guard set to 10 | confirmation dialog appears; axe zero serious issues |

## Acceptance criteria

- All tests T01–T15 pass in CI.
- Concurrent requests never exceed burst plus rate × elapsed time (property test).
- No raw IP address or actor key is ever persisted or logged by this module.

## Dependencies

Module depends on: F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
