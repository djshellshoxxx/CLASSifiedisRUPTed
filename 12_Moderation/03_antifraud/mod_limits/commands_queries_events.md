# PS-098-04 — Commands, queries and events: Account limits

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M04 Account limits](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/limits` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-098-04.R01** The module exposes override set and clear commands and two queries, plus an in-process check used by the relay bus.
- **PS-098-04.R02** Every effective value change emits moderation.limit.changed in the same transaction as the row.
- **PS-098-04.R03** The module consumes risk, deal and account events to keep tier and multiplier current.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `moderation.accountlimit.override` | moderation.accountlimit.override | { subjectKey, limitKey, overrideValue, reason, expiresInMs, expectedRevision? } | { accountLimitId, effectiveValue, revision } | VALIDATION_FAILED, CONFLICT_REVISION, FORBIDDEN | moderation.limit.changed | yes (Idempotency-Key) |
| `moderation.accountlimit.clear_override` | moderation.accountlimit.clear_override | { accountLimitId, expectedRevision } | { accountLimitId, effectiveValue, revision } | NOT_FOUND, CONFLICT_REVISION, FORBIDDEN | moderation.limit.changed | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `moderation.accountlimit.check` | moderation.accountlimit.check | { subjectKey, limitKey, currentCount?, cost?: 1 } | { allowed, effectiveValue, used?, resetsAt?, reasons[] } | VALIDATION_FAILED, ACCOUNT_LIMIT_REACHED |
| `moderation.accountlimit.list_mine` | moderation.accountlimit.read_own | { includeAdjustments?: boolean } | { items: { limitKey, tier, effectiveValue, used?, adjustments[], nextTier? }[] } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `moderation.limit.changed` | P2 | { accountLimitId, subjectKey, limitKey, previousValue, effectiveValue, cause: tier\|risk\|override\|override_expired\|policy } |

### Events consumed

| Type | Effect |
|---|---|
| `moderation.risk.elevated` | set riskMultiplier 0.75 for medium and 0.5 for high on the subject's limits; recovery is recomputed by the daily sweep and signal events |
| `commerce.deal.completed` | increment completedDeals for both parties on this relay and re-evaluate tier |
| `identity.account.created` | set firstSeenAt for the key on this relay if not present |
| `moderation.action.applied` | restrict_feature actions naming a limit key set effectiveValue 0 for the action duration |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| ACCOUNT_LIMIT_REACHED | 429 | no | the key reached its limit; params.limitKey, params.effectiveValue and params.resetsAt where it applies |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
query moderation.accountlimit.check  (relay bus call before bazaar.listing.publish)
{ "subjectKey": "did:key:z6MkMemberExample", "limitKey": "listings_per_day" }
-> { "allowed": false, "effectiveValue": 5, "used": 5, "resetsAt": "2026-11-05T09:12:00Z", "reasons": ["tier new: 5 per day; becomes 20 after 7 days and 3 completed deals"] }
POST https://relay.example/api/v1/cmd/moderation.accountlimit.override  (moderator token)
{ "subjectKey": "did:key:z6MkMemberExample", "limitKey": "listings_per_day", "overrideValue": 30, "reason": "Verified shop selling stock", "expiresInMs": 2592000000 }
-> 200 { "accountLimitId": "0192f410-aaaa-7000-8000-00000000000a", "effectiveValue": 30, "revision": 2 }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-098-09.T04 | integration | PS-098-03.R01, PS-098-03.R03, PS-098-04.R03 | deal.completed events and 7-day sweep; override expiry | tier promoted once both conditions hold; limit.changed emitted on expiry |
| TEST-PS-098-09.T05 | integration | PS-098-03.R02, PS-098-04.R03 | risk.elevated medium then high then recovery | effective value 0.75×, 0.5×, then base; one event per distinct value |
| TEST-PS-098-09.T06 | contract | PS-098-04.R01, PS-098-04.R02, PS-098-09.R02 | commands, queries and event | validate against registry schemas; check output matches examples |
| TEST-PS-098-09.T15 | e2e | PS-098-01.R02, PS-098-04.R01 | mobile member hits the daily listing limit | limit sheet shows used, allowed, reset time and next tier; axe zero serious issues |

## Dependencies

Module depends on: F12.S03.M01, F12.S03.M03, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
