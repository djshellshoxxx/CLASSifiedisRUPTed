# F12.S03.M03 — Rate limiting

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F12.S03](../SPEC.md). **Process IDs:** PS-099-01…PS-099-10. **Code:** `packages/moderation/src/antifraud/rate`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Rate limiting through the RateLimitPort used by the kernel command bus. On a relay it enforces the relay's hosting policy per actor key and capability and per IP prefix (/24 for IPv4, /48 for IPv6) using GCRA for command capabilities and token buckets for burst-tolerant reads such as proximity search. In a user's vault it provides local UX throttles (for example a confirmation after 10 offers in an hour) that protect the user from their own mistakes and are not security controls. Limits are configured per relay tenant, return RATE_LIMITED with retryAfterMs, and degrade predictably when the counter store is unavailable.

## Responsibilities

- Provide RateLimitPort.consume(key, cost) returning allowed, remaining, limit, retryAfterMs and resetAt, in under 1 ms for in-memory state.
- Implement GCRA (theoretical arrival time with burst tolerance) and token bucket algorithms with per-capability policy.
- Key limits by (actor key, capability), by (IP prefix, capability class) and by tenant global caps, using salted hashes so raw IPs are never stored.
- Own the RateBucket state and a per-tenant RatePolicy configuration with defaults, and emit moderation.rate.exceeded at most once per key per minute.
- Provide vault-local UX throttles from the same code, configured by the user and never sent to anyone.

## Not responsible for

- Deciding bans or suspensions after repeated violations (F12.S02.M01 decides from signals).
- Account-level quotas by reputation (F12.S03.M04) which call this module for flow limits.
- Command bus registration and HTTP mapping (F15.S02.M02 calls the port).
- Network-level DDoS protection, which belongs to the relay's hosting environment.
- Future: distributed counters across relay replicas; adaptive limits driven by load.

## User stories

- As a relay operator, I set limits per capability class and see which keys hit them, without storing IP addresses.
- As a member, when I hit a limit I see how long to wait and why, and queued offline commands retry politely.
- As a user, I get a gentle 'You made 10 offers in an hour, continue?' guard on my own device.

## Edge cases

- Many users share one NAT /24 prefix; the prefix limit is 5 times the actor limit so a household or campus is not blocked by one heavy user.
- IPv6 clients rotate addresses within a /64; limiting is by /48 so rotation inside the allocation does not evade the limit.
- Counter store is unavailable; read capabilities fail open with a local in-memory limit of half the normal rate, and sensitive capabilities (relay access challenge, report receive, key registration) fail closed with RATE_LIMITED for 30 seconds.
- Relay restarts; counters are persisted every 5 seconds, so at most 5 seconds of arrivals are forgotten and limits are never loosened by more than one burst.
- Clock moves backward; GCRA uses a monotonic clock and ignores wall-clock steps.
- A spam velocity throttle arrives for a key; a penalty factor 0.25 applies to its write buckets for at most 1 hour.

## UX and accessibility

- Rate limit toast: 'Too many requests, try again in N seconds' with a countdown; queued commands show 'waiting' and retry automatically.
- Settings > Safety > Guard rails (vault): thresholds for local confirmation prompts, with defaults and a reset button.
- Operator configuration page: capability class table with burst, rate per minute, prefix multiplier, fail mode.

**States:** idle; limited-countdown; retrying; local-guard-prompt

**Accessibility:** Countdown text is announced at 10 second intervals through an aria-live polite region, not every second.; Guard prompts are dialogs with focus trap and buttons of at least 44 by 44 px.; Retry state is described in text.

## Owned data

- `RateBucket` (classrup.moderation.ratebucket/v1, P3, RET-EPHEMERAL)
- `RatePolicy` (classrup.moderation.ratepolicy/v1, P1, RET-STANDARD)

## Interfaces

- Commands: `moderation.ratepolicy.set`, `moderation.ratebucket.reset`
- Queries: `moderation.ratepolicy.list`, `moderation.ratebucket.get_status_own`
- Emits: `moderation.rate.exceeded`
- Consumes: `moderation.spam.detected`, `moderation.limit.changed`

## Dependencies

F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-099-01 | [Domain schema](domain_schema.md) | 3 |
| PS-099-02 | [Validation rules](validation_rules.md) | 3 |
| PS-099-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-099-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-099-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-099-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-099-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-099-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-099-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-099-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/moderation/src/antifraud/rate/index.ts`.

## Acceptance criteria

- All tests T01–T15 pass in CI.
- Concurrent requests never exceed burst plus rate × elapsed time (property test).
- No raw IP address or actor key is ever persisted or logged by this module.
