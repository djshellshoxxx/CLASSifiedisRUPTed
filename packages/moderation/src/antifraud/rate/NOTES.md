# F12.S03.M03 Rate limiting (PS-099)

Files: `index.ts` (limiter, definitions), `engine.ts` (pure GCRA and token bucket), `rate.test.ts`.

## Implemented
- `createRateLimiter(options)` returns a kernel `RateLimitPort` (`check`) for `createBus({ rateLimit })` (N18) plus `consume(key, cost)` returning `{ allowed, limit, remaining, retryAfterMs, resetAt, scope }`.
  Scopes in relay mode: actor, IP prefix (policy rate and burst times `prefixMultiplier`), tenant cap (default 2000 per minute per class). Anonymous callers are keyed by prefix only. A denied request spends nothing in any scope. Vault mode (`mode: 'vault'`) uses one `local` scope.
- GCRA and token bucket (exact for integer parameters, epsilon comparison, monotonic clock derived from the injected clock; backward steps give zero elapsed time).
- Degraded mode when the `CounterStore` throws: failMode open gives a local limit of half rate; closed (relay.access, report.receive, key.register always) denies for 30 s.
- Commands `moderation.ratepolicy.set`, `moderation.ratebucket.reset`; queries `moderation.ratepolicy.list`, `moderation.ratebucket.get_status_own`; event `moderation.rate.exceeded` (definition `rateExceededEvent`); error `RATE_POLICY_FAIL_MODE_LOCKED`.
- Consumers `moderation.rate_spam_penalty` (moderation.spam.detected with throttle: factor 0.25 on write.* buckets for min(ttlMs, 1 h), never accumulating) and `moderation.rate_limit_refresh` (moderation.limit.changed: drops the cached account multiplier).
- `RATE_ROLES` role table for `createRoleTableAuthz`; `validatePolicy`, `BUILTIN_POLICIES`, `defaultClassOf`.

## Ports the composition root supplies
- `keyedHash(salt: string, message: string): string` : HMAC-SHA-256 hex (64 chars). No cryptography is implemented here.
- `salt(epochDay: number): string` and optional `destroySalt(epochDay)` : random per-day salt, destroyed 24 h after use.
- `onExceeded(notice: RateExceededNotice): void` : the root publishes `rateExceededEvent` (payload without `tenantId`) in its own transaction. `check` runs outside any transaction, so the module cannot `ctx.emit` it.
- Optional: `classOf(capability, kind)`, `accountMultiplier(tenantId, actorKey)`, `store: CounterStore`, `logger`, `metrics`.
- `rateDefinitions({ limiter, isRegisteredClass?, resolveSubjectKey? })`: `resolveSubjectKey` maps the `subjectKeyHash` of moderation.spam.detected to the actor key (see open questions).
- Periodic jobs the root runs: `limiter.flushExceeded()` and `limiter.evictIdle()` every 60 s, `limiter.snapshot()` every 5 s into its own operational store, `limiter.restore(rows)` at start, `limiter.loadPolicies(tenantId, policies)` from `moderation.ratepolicy.list` at start (set command also applies a policy immediately).

## Deviations
- Spec says `RateLimitPort.consume`; the kernel port is `check(q)`, which is what the bus calls. Both exist.
- `moderation.rate.exceeded` is delivered through `onExceeded`, once per key and class per window, when the window closes (lazily on the next denial or on `flushExceeded()`), not on the first denial.
- Bucket state is in process memory (ADR-0016: local counters); no RateBucket repo is written. Snapshots are rows returned to the root.
- Salt rotation (daily) restarts counters and penalties: hashes of the previous day can never match, as the spec's salt destruction implies.
- `ratePerMinute` is an integer 1..6000 as specified, so per-hour rates are only expressible through the pure engine (test T01 uses it).
- Account multiplier scales both rate and burst of the actor scope (clamped 0.25..4).

## Test rows not covered
T12 load (5 000/s for 5 minutes, 100 000 buckets: not deterministic in the time budget), T13 traceability run, T14 export/import and restore (policies are plain repo records; the export/import framework is not available here), T15 e2e (needs the PWA).

## Open questions
- `moderation.spam.detected` carries `subjectKeyHash` (pseudonymous), not the actor key; penalties need `resolveSubjectKey`. Which hash and who owns the lookup?
- Persistence of the daily salt across restarts (root concern) decides whether restored buckets still match.
