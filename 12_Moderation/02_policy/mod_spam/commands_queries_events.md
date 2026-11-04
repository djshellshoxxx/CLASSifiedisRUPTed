# PS-097-04 — Commands, queries and events: Spam detection

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M02 Spam detection](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/spam` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-097-04.R01** The SpamEvaluator port is evaluate(input) returning score, heuristics[], throttle? and degraded flag, and has no side effects except the fingerprint index and the event.
- **PS-097-04.R02** moderation.spam.detected is emitted only when score ≥ 50, with throttle only when the velocity heuristic matched.
- **PS-097-04.R03** The module consumes listing publication and account creation events to feed duplicate and new-key heuristics.

## Specification

### Commands

_None._

### Queries

_None._

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `moderation.spam.detected` | P2 | { subjectKeyHash, targetType, targetId, targetCid, score, heuristics: string[], throttle?: { capability, windowMs, ttlMs }, rulesVersion, degraded } |

### Events consumed

| Type | Effect |
|---|---|
| `bazaar.listing.published` | evaluate the published projection for duplicate hash, link density and velocity on the relay that indexes it, or in the vault for incoming listings |
| `identity.account.created` | start the new-key window (first seen time) used by the new-key heuristic on this store |
| `moderation.rate.exceeded` | count as a velocity observation for the key hash |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| SPAM_EVALUATION_DEGRADED | 200 | no | evaluation ran in exact-hash mode while the index rebuilds; informational |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Library module with no commands or queries. It is invoked by relay intake and by the vault filter through the SpamEvaluator port and publishes events.

### Example

```
SpamEvaluator.evaluate({ storeClock: "2026-11-04T10:00:00Z", keyHash: "k_9a3f…", targetType: "listing", targetCid: "sha256-aa01…", text: "BUY NOW http://a.example http://b.example …" })
-> { score: 72, heuristics: ["link_density:0.31", "duplicate_exact:3_in_24h"], throttle: null, rulesVersion: "spam/1.2", degraded: false }
event moderation.spam.detected { subjectKeyHash: "k_9a3f…", score: 72, heuristics: [...] }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-097-09.T04 | unit | PS-097-02.R03, PS-097-04.R02 | link density on zero-length and unspaced scripts; score 49 and 50 | no division by zero; event only at score ≥ 50 |
| TEST-PS-097-09.T05 | contract | PS-097-04.R01, PS-097-04.R02, PS-097-09.R02 | evaluate and event emission | port output and moderation.spam.detected validate against registry schemas |
| TEST-PS-097-09.T06 | integration | PS-097-04.R03 | listing.published, account.created and rate.exceeded events delivered twice | counters updated once; one event per (targetCid, rulesVersion) |

## Dependencies

Module depends on: F12.S03.M02, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
