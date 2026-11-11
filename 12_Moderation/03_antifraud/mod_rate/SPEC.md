# F12.S03.M03 — Rate limiting

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F12.S03](../SPEC.md). **Process IDs:** PS-099-01…PS-099-10. **Code:** `packages/moderation/src/antifraud/rate`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Rate limiting through the RateLimitPort used by the kernel command bus. On a relay it enforces the relay's hosting policy per actor key and capability, per IP prefix (/24 for IPv4, /48 for IPv6) for windows up to 24 h, and per tenant, using GCRA for command capabilities, token buckets for burst-tolerant reads such as keyword search, and window counters for long windows such as 20 appeals per 30 days. Every policy is { limit, periodMs, burst } from 1 second to 30 days, optionally with a second, longer window (for example 20 per minute and 200 per hour). It owns the per-tenant default request rate (class request.default, formerly the tenant record's requestRatePerMinutePerKey) and the classes other modules register with their own defaults, such as the shared proximity budget of F06.S02.M03. In a user's vault it provides local UX guards (for example a confirmation after 10 offers in an hour or above 10 open offers) that protect the user from their own mistakes and are not security controls. Limits are configured per relay tenant, return RATE_LIMITED with retryAfterMs, survive salt rotation, and degrade predictably when the counter store is unavailable.

## Responsibilities

- Provide RateLimitPort.consume(key, cost) returning allowed, remaining, limit, retryAfterMs and resetAt, in under 1 ms for in-memory state.
- Implement GCRA (emission interval periodMs / limit, burst tolerance), token bucket and sliding window counter algorithms with per-class policy.
- Key limits by (actor key, capability class), by (IP prefix, capability class) for windows up to 24 h and by tenant global caps, using HMAC hashes under per-class salt epochs so raw IPs and keys are never stored.
- Own the RateBucket state and a per-tenant RatePolicy configuration with built-in classes, and emit moderation.rate.exceeded at most once per key per minute.
- Select class report.receive.reduced for reporter keys with a report_dismissed_bad_faith signal recorded by F12.S03.M02 in the last 30 days, and apply spam velocity penalties to the posting key's write buckets.
- Provide vault-local UX guards from the same code (flow guards and stock guards such as open offers and open cycle proposals), configured by the user and never sent to anyone.
- Own the per-tenant default request rate policy (built-in class request.default, which replaces the requestRatePerMinutePerKey limit F15.S04.M03 dropped from the tenant record) and charge it once per relay request on top of the request's own class.
- Accept capability classes registered by their owner modules with defaults through RatePolicyRegistry.register (for example the shared proximity budget classes read.proximity.query.anonymous, read.proximity.query.token, read.proximity.center_seen and read.proximity.center_new, defined once in F06.S02.M03), seed tenant RatePolicy rows from those defaults and honour the fail mode each registration locks.
- [object Object]

## Not responsible for

- Deciding bans or suspensions after repeated violations (F12.S02.M01 decides from signals).
- Account-level quotas by tier and risk (F12.S03.M04), which call this module for flow limits.
- Command bus registration and HTTP mapping (F15.S02.M02 calls the port).
- Network-level DDoS protection, which belongs to the relay's hosting environment.
- The numbers and caller-class rules of module-registered classes (the owner module defines them once, for example F06.S02.M03 for the proximity budget); tenant limits other than request rates (F15.S04.M03 TenantPort.limits).
- Future: distributed counters across relay replicas; adaptive limits driven by load.

## User stories

- As a relay operator, I set limits per capability class from per-second to per-30-days and see which keys hit them, without storing IP addresses.
- As a member, when I hit a limit I see how long to wait and why, and queued offline commands retry politely.
- As a user, I get a gentle 'You made 10 offers in an hour, continue?' guard on my own device, and a reminder when I have more than 10 open offers.

## Edge cases

- Many users share one NAT /24 prefix; the prefix limit is 5 times the actor limit so a household or campus is not blocked by one heavy user.
- IPv6 clients rotate addresses within a /64; limiting is by /48 so rotation inside the allocation does not evade the limit.
- Counter store is unavailable; read capabilities fail open with a local in-memory limit of half the normal rate, and sensitive capabilities (relay access challenge, report receive, key registration) fail closed with RATE_LIMITED for 30 seconds.
- Relay restarts; counters are persisted every 5 seconds, so at most 5 seconds of arrivals are forgotten and limits are never loosened by more than one burst.
- Clock moves backward; GCRA uses a monotonic clock and ignores wall-clock steps; window counters use the relay clock bucketed by minute, hour or day.
- A 20-per-30-days appeal window crosses a salt rotation; consume reads counters under the current and the previous epoch salt, so the 21st appeal in any 30 days is still refused.
- A spam velocity throttle arrives for a key; this module derives the key's bucket hash from the event's subjectKey and applies penalty factor 0.25 to its write buckets for at most 1 hour.
- A reporter key received a report_dismissed_bad_faith signal 10 days ago; its report.receive requests use class report.receive.reduced until 30 days pass, except minor_safety reports marked exempt.
- The counter store is down while a proximity search arrives; read.proximity.query.* fall back to the in-memory half rate like other read classes, but read.proximity.center_new is registered fail closed and returns RATE_LIMITED for 30 seconds, so a store outage never opens trilateration.
- A caller reaches 5 new search centers at 23:50 and the daily salt rotates at 00:00; the next new center at 00:10 is still refused because the 24 h window reads counters under the current and the previous salt, and the previous salt is kept 24 h after rotation.
- A relay migrates from a tenant record that held requestRatePerMinutePerKey 300; the expand step writes a request.default policy row with limit 300 and periodMs 60000, and later changes go through moderation.ratepolicy.set.
- 200 fresh keys from one /24 each comment once on one proposal within an hour; governance.policy_comment.accept.prefix admits at most 30 per 24 h for the prefix and the F12.S03.M04 new-key cap admits at most 25 per proposal, so at most 25 comments are accepted and the rest get RATE_LIMITED.
- An operator key uploads an 11th prohibited-rule pack in 24 h while its taxonomy and profile uploads are still below their limits; only governance.prohibited_rule.relay_upload refuses, because each upload type has its own class.

## UX and accessibility

- Rate limit toast: 'Too many requests, try again in N seconds' with a countdown; queued commands show 'waiting' and retry automatically.
- Settings > Safety > Guard rails (vault): thresholds for local confirmation prompts (offers per hour, reports per hour, open offers, open cycle proposals), with defaults and a reset button.
- Operator configuration page: capability class table with algorithm, limit, period, burst, scopes, prefix multiplier, fail mode.

**States:** idle; limited-countdown; retrying; local-guard-prompt

**Accessibility:** Countdown text is announced at 10 second intervals through an aria-live polite region, not every second.; Guard prompts are dialogs with focus trap and buttons of at least 44 by 44 px.; Retry state is described in text.

## Owned data

- `RateBucket` (classrup.moderation.ratebucket/v1, P3, RET-SHORT)
- `RatePolicy` (classrup.moderation.ratepolicy/v1, P1, RET-STANDARD)

## Interfaces

- Commands: `moderation.ratepolicy.set`, `moderation.ratebucket.reset`
- Queries: `moderation.ratepolicy.list`, `moderation.ratebucket.get_status_own`
- Emits: `moderation.rate.exceeded`
- Consumes: `moderation.spam.detected`, `moderation.signal.recorded`, `moderation.limit.changed`

## Dependencies

F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-099-01 | [Domain schema](domain_schema.md) | 5 |
| PS-099-02 | [Validation rules](validation_rules.md) | 4 |
| PS-099-03 | [Workflow state machine](workflow_state_machine.md) | 5 |
| PS-099-04 | [Commands, queries and events](commands_queries_events.md) | 9 |
| PS-099-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-099-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-099-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-099-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-099-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-099-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/moderation/src/antifraud/rate/index.ts`.

## Acceptance criteria

- All tests T01–T23 pass in CI.
- Concurrent requests never exceed burst plus rate × elapsed time, and window counters never exceed their limit across salt rotations (property tests).
- No raw IP address or actor key is ever persisted or logged by this module.
