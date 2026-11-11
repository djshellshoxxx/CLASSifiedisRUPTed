# PS-099-04 — Commands, queries and events: Rate limiting

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M03 Rate limiting](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/rate` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-099-04.R01** The port RateLimitPort.consume is in-process and used by the kernel command bus before each handler; it is not an HTTP endpoint.
- **PS-099-04.R02** Operators change policy and reset buckets through two relay commands; the vault changes local thresholds through the same policy command in local scope.
- **PS-099-04.R03** moderation.rate.exceeded is emitted at most once per key per minute with a count, so denial storms do not create event storms.
- **PS-099-04.R04** Consuming moderation.spam.detected derives the bucket key from the payload subjectKey with this module's own HMAC and applies the penalty to that key's write buckets.
- **PS-099-04.R05** For class report.receive, consume uses class report.receive.reduced while the key carries a reduced marker, which this module sets from moderation.signal.recorded of kind report_dismissed_bad_faith (F12.S03.M02) for 30 days from the signal's observedAt, unless the caller marks the request exempt (minor_safety).
- **PS-099-04.R06** Vault scope local provides flow guards (offers and reports per hour) and stock guards (open offers, open cycle proposals) counted from the vault's own records; they are UX confirmations, never security controls, and relays never receive their counts.
- **PS-099-04.R07** RatePolicyRegistry.register({ capabilityClass, ownerModule, algorithm, limit, periodMs, burst?, longWindow?, scopes, failMode, failModeLocked }) is the in-process registration port owner modules call at relay composition (F06.S02.M03 registers read.proximity.query.anonymous, read.proximity.query.token, read.proximity.center_seen and read.proximity.center_new with its own numbers); this module seeds a tenant RatePolicy row from the defaults when none exists, and owners depend on this module, never the reverse.
- **PS-099-04.R08** Every relay-scope consume also charges the actor key's request.default bucket once per request (the first consume carrying the request's correlationId), so the per-tenant default request rate applies to every relay command and query without a second bus call; anonymous requests charge it by IP prefix.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `moderation.ratepolicy.set` | moderation.ratepolicy.set | { capabilityClass, algorithm, limit, periodMs, burst?, scopes?, prefixMultiplier?, failMode?, kind?, expectedRevision? } | { policyId, revision, emissionIntervalMs? } | VALIDATION_FAILED, CONFLICT_REVISION, MODERATION_RATE_POLICY_FAIL_MODE_LOCKED, FORBIDDEN |  | yes (Idempotency-Key) |
| `moderation.ratebucket.reset` | moderation.ratebucket.reset | { capabilityClass, keyHash } | { reset: true } | NOT_FOUND, FORBIDDEN |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `moderation.ratepolicy.list` | moderation.ratepolicy.read | { cursor?, limit ≤ 100 } | { items: RatePolicy[], nextCursor? } |  |
| `moderation.ratebucket.get_status_own` | moderation.ratebucket.read_own | { capabilityClass } | { limit, periodMs, remaining, resetAt, penaltyUntil?, reducedClass?: boolean } for the caller's own key |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `moderation.rate.exceeded` | P2 | { actorKeyHash?, ipPrefixHash?, capabilityClass, scope, deniedCount, windowMs, observedAt } |

### Events consumed

| Type | Effect |
|---|---|
| `moderation.spam.detected` | when the payload carries a throttle, compute the bucket hash of subjectKey under the current class salts and set penaltyFactor 0.25 on that key's write buckets for min(ttlMs, 3600000) |
| `moderation.signal.recorded` | relay, kind report_dismissed_bad_faith only: write or extend a reduced marker row (class report.receive.reduced, reducedUntil = observedAt + 30 days) for the bucket hash of subjectKey; other kinds are ignored |
| `moderation.limit.changed` | refresh the cached per-key limit used by consume for the matching limit class (write.index, write.mailbox.new_recipient, write.bid) within 5 s |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| MODERATION_RATE_POLICY_FAIL_MODE_LOCKED | 422 | no | security-sensitive classes must fail closed |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** RateLimitPort.consume({ tenantId, capabilityClass, actorKey?, ipPrefix?, discriminator?, cost, exempt?, limitOverride?, correlationId? }) receives the actor key, the truncated prefix and any discriminator (for example the center cell of read.proximity.center_seen) in memory only and hashes them before any state access; limitOverride is accepted only from the in-process F12.S03.M04 limits check; correlationId lets request.default be charged once per request. RatePolicyRegistry.register is called only from the relay composition root; F12.S03.M03 depends on no module that registers classes.

### Example

```
RateLimitPort.consume({ tenantId, capabilityClass: "write.index", actorKey: "did:key:z6MkPosterExample", ipPrefix: "192.0.2.0/24" }, cost=1)
policy write.index: gcra, limit 20, periodMs 3600000, burst 5 (emission interval 180000 ms); 5 calls already made in the last second
-> { allowed: false, limit: 20, remaining: 0, retryAfterMs: 179000, resetAt: "2026-11-04T10:03:00Z" }  -> bus returns 429 RATE_LIMITED { retryAfterMs: 179000 }
POST https://relay.example/api/v1/cmd/moderation.ratepolicy.set  (relay command, operator token)
{ "capabilityClass": "appeal.receive.30d", "algorithm": "window_counter", "limit": 20, "periodMs": 2592000000, "scopes": ["actor"] }  -> 200 { "policyId": "0192f400-9999-7000-8000-000000000009", "revision": 2 }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-099-09.T01 | unit | PS-099-01.R04, PS-099-04.R01 | GCRA 20 per hour burst 5: 5 immediate calls then more | first 5 allowed, 6th denied with retryAfterMs = 180000 minus elapsed |
| TEST-PS-099-09.T05 | integration | PS-099-03.R02, PS-099-04.R03, PS-099-04.R04 | spam.detected with subjectKey and throttle ttl 2 hours; denial storm of 1 000 calls | the key's write buckets found through this module's own HMAC get factor 0.25 for 1 hour only; one rate.exceeded event per key per minute |
| TEST-PS-099-09.T06 | contract | PS-099-04.R01, PS-099-09.R02 | port, commands and event | validate against registry schemas; bus maps denial to RATE_LIMITED with retryAfterMs; port has no HTTP route |
| TEST-PS-099-09.T08 | integration | PS-099-03.R03, PS-099-04.R02 | operator policy change at runtime; vault sets a local guard through the same command; idle eviction | takes effect ≤ 5 s without resetting buckets; local guard stored in scope local; full-capacity buckets evicted |
| TEST-PS-099-09.T15 | e2e | PS-099-04.R06 | mobile user sends the 11th offer in an hour with the local guard at 10 and opens an 11th open offer | confirmation dialogs appear; no count is sent to any relay; axe zero serious issues |
| TEST-PS-099-09.T17 | integration | PS-099-04.R05 | moderation.signal.recorded report_dismissed_bad_faith observed 10 days ago (delivered twice) for reporter key R; R files 4 reports in 24 h; one more marked exempt (minor_safety); clock advanced 21 more days | one marker row; 4th RATE_LIMITED under report.receive.reduced; exempt one allowed under report.receive; after the marker expires report.receive applies again |
| TEST-PS-099-09.T19 | contract | PS-099-04.R07, PS-099-01.R05, PS-099-02.R04 | F06.S02.M03 contract fixture registers the four proximity classes with its v1 numbers (20 per minute and 200 per hour, 60 per minute and 600 per hour, a center_seen probe of 1 per 24 h, 2 new centers per hour and 5 per 24 h with failModeLocked); a second module registers read.proximity.center_new again; an operator sets failMode open on it | tenant rows seeded with ownerModule F06.S02.M03 and longWindow; VALIDATION_FAILED for the duplicate owner; MODERATION_RATE_POLICY_FAIL_MODE_LOCKED |
| TEST-PS-099-09.T22 | integration | PS-099-04.R08, PS-099-01.R05, PS-099-02.R04 | request.default at 120 per minute; one request consuming three classes; anonymous caller; set request.default to 5 and to 1500; tenant migration with requestRatePerMinutePerKey 300 | the request charges request.default once; the 121st request in a minute is RATE_LIMITED whatever its class; anonymous charged by prefix; VALIDATION_FAILED twice; expand step writes limit 300 periodMs 60000 |

## Dependencies

Module depends on: F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
