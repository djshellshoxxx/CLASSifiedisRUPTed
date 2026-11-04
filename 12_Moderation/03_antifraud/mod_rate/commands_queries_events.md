# PS-099-04 — Commands, queries and events: Rate limiting

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M03 Rate limiting](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/rate` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-099-04.R01** The port RateLimitPort.consume is in-process and used by the kernel command bus before each handler; it is not an HTTP endpoint.
- **PS-099-04.R02** Operators change policy and reset buckets through two relay commands; the vault changes local thresholds through the same policy command in local scope.
- **PS-099-04.R03** moderation.rate.exceeded is emitted at most once per key per minute with a count, so denial storms do not create event storms.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `moderation.ratepolicy.set` | moderation.ratepolicy.set | { capabilityClass, algorithm, ratePerMinute, burst, prefixMultiplier?, failMode?, expectedRevision? } | { policyId, revision } | VALIDATION_FAILED, CONFLICT_REVISION, RATE_POLICY_FAIL_MODE_LOCKED, FORBIDDEN |  | yes (Idempotency-Key) |
| `moderation.ratebucket.reset` | moderation.ratebucket.reset | { capabilityClass, keyHash } | { reset: true } | NOT_FOUND, FORBIDDEN |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `moderation.ratepolicy.list` | moderation.ratepolicy.read | { cursor?, limit ≤ 100 } | { items: RatePolicy[], nextCursor? } |  |
| `moderation.ratebucket.get_status_own` | moderation.ratebucket.read_own | { capabilityClass } | { limit, remaining, resetAt, penaltyUntil? } for the caller's own key |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `moderation.rate.exceeded` | P2 | { actorKeyHash?, capabilityClass, scope, deniedCount, windowMs, observedAt } |

### Events consumed

| Type | Effect |
|---|---|
| `moderation.spam.detected` | when the payload carries a throttle, set penaltyFactor 0.25 on the key's write buckets for min(ttlMs, 3600000) |
| `moderation.limit.changed` | refresh cached per-account multipliers used when computing effective rates |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| RATE_POLICY_FAIL_MODE_LOCKED | 422 | no | security-sensitive classes must fail closed |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
RateLimitPort.consume({ tenantId, capabilityClass: "write.offer", actorKeyHash: "a_77c1…", ipPrefixHash: "p_90de…" }, cost=1)
-> { allowed: false, limit: 20, remaining: 0, retryAfterMs: 1800, resetAt: "2026-11-04T10:00:02Z" }  -> bus returns 429 RATE_LIMITED { retryAfterMs: 1800 }
POST https://relay.example/api/v1/cmd/moderation.ratepolicy.set  (relay command, operator token)
{ "capabilityClass": "write.offer", "algorithm": "gcra", "ratePerMinute": 1, "burst": 10 }  -> 200 { "policyId": "0192f400-9999-7000-8000-000000000009", "revision": 2 }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-099-09.T01 | unit | PS-099-01.R01, PS-099-01.R02, PS-099-04.R01 | GCRA 20/hour burst 5: 5 immediate calls then more | first 5 allowed, 6th denied with retryAfterMs = 3 minutes minus elapsed |
| TEST-PS-099-09.T04 | unit | PS-099-01.R03, PS-099-04.R02 | /24 and /48 keys: 192.0.2.10 and 192.0.2.200; two addresses in one /48 | same prefix hash; salt rotates after 24 h; no raw IP in rows or logs |
| TEST-PS-099-09.T05 | integration | PS-099-03.R02, PS-099-04.R03 | spam.detected with throttle ttl 2 hours; denial storm of 1 000 calls | factor 0.25 for 1 hour only; one rate.exceeded event per key per minute |
| TEST-PS-099-09.T06 | contract | PS-099-04.R01, PS-099-04.R03, PS-099-09.R02 | port, commands and event | validate against registry schemas; bus maps denial to RATE_LIMITED with retryAfterMs |
| TEST-PS-099-09.T15 | e2e | PS-099-01.R01, PS-099-04.R02 | mobile user sends 11th offer in an hour with local guard set to 10 | confirmation dialog appears; axe zero serious issues |

## Dependencies

Module depends on: F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
