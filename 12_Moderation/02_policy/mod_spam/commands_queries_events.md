# PS-097-04 — Commands, queries and events: Spam detection

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M02 Spam detection](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/spam` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-097-04.R01** The SpamEvaluator port evaluate(input) is exposed in-process as the query moderation.spam.evaluate, returning score, heuristics, throttle?, rulesVersion and degraded, with no side effects except the fingerprint and key-observation indexes and, for relay_intake and vault_filter, the event.
- **PS-097-04.R02** moderation.spam.detected is emitted only when score ≥ 50 in relay_intake or vault_filter mode, never for an author's pre-sign check, with throttle only when the velocity heuristic matched.
- **PS-097-04.R03** The relay index-intake hook passes the projection text before indexing, and the store's own first observation of a key (identity.session.started on a relay, federation.record.accepted in a vault) starts the new-key window; identity.account.created is never used for other keys.
- **PS-097-04.R04** moderation.spam.detected carries the subject did:key (a pseudonymous public key, P2, never leaving the store per EVT-8) so F12.S02.M01, F12.S03.M02 and F12.S03.M03 act on the same key, and hashing is used only inside the indexes and logs.
- **PS-097-04.R05** In author_presign mode the query reads the author's own local publication history, writes nothing and emits nothing, and its output contract is the one F01.S01.M03 tests against (N19).

## Specification

### Commands

_None._

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `moderation.spam.evaluate` | moderation.spam.evaluate | { mode: author_presign\|relay_intake\|vault_filter, subjectKey: did:key, targetType (listing_publication for the F01.S01.M03 author_presign call, the projection type otherwise), targetId?, targetCid?, text, links?: string[], receivedAt (store clock), claimedCreatedAt? } | { score: 0..100, heuristics: { name, value, threshold, points }[], throttle?: { capabilityClass, ttlMs ≤ 3600000 }, rulesVersion, degraded: boolean } | VALIDATION_FAILED, PAYLOAD_TOO_LARGE, FORBIDDEN |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `moderation.spam.detected` | P2 | { subjectKey: did:key, mode: relay_intake\|vault_filter, targetType, targetId, targetCid, score, heuristics: string[], throttle?: { capabilityClass, ttlMs }, rulesVersion, degraded } — store-local (EVT-8): relay-local on a relay, vault-local in a vault; never federated or sent to notification channels |

### Events consumed

| Type | Effect |
|---|---|
| `identity.session.started` | relay, kind relay_token: record the first observation of did in the key-observation index when absent, starting the new-key window on this relay |
| `federation.record.accepted` | vault: record the first observation of the author key and, for listing records of other authors, read the accepted projection and run vault_filter mode for the local fold setting; relay: record the first observation of the author key |

### Module errors

_None._

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** No commands. One in-process query, moderation.spam.evaluate, used by F01.S01.M03 before signing (author_presign), by the relay index-intake hook before a projection is indexed (relay_intake) and by the vault feed filter (vault_filter); it is never routable over HTTP.

### Example

```
query moderation.spam.evaluate (relay index-intake hook, in-process)
{ "mode": "relay_intake", "subjectKey": "did:key:z6MkPosterExample", "targetType": "listing", "targetCid": "sha256-aa01…", "receivedAt": "2026-11-04T10:00:00Z", "claimedCreatedAt": "2026-11-03T09:00:00Z", "text": "BUY NOW http://a.example http://b.example …" }
-> { "score": 72, "heuristics": [ { "name": "link_density", "value": 0.31, "threshold": 0.2, "points": 30 }, { "name": "duplicate_exact", "value": 3, "threshold": 2, "points": 32 }, { "name": "backdated_claim", "value": 25, "threshold": 24, "points": 10 } ], "throttle": null, "rulesVersion": "spam/1.2", "degraded": false }
event moderation.spam.detected { "subjectKey": "did:key:z6MkPosterExample", "mode": "relay_intake", "score": 72, "heuristics": ["link_density", "duplicate_exact", "backdated_claim"], "rulesVersion": "spam/1.2", "degraded": false }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-097-09.T04 | unit | PS-097-04.R02 | link density on zero-length and unspaced scripts; score 49 and 50 in relay_intake; score 90 in author_presign | no division by zero; event only at ≥ 50 in relay_intake; no event for author_presign |
| TEST-PS-097-09.T05 | contract | PS-097-04.R01, PS-097-09.R02, PS-097-09.R03 | evaluate output and moderation.spam.detected; corpus fixtures | validate against registry schemas; fixtures produce their expected scores |
| TEST-PS-097-09.T06 | integration | PS-097-04.R03, PS-097-06.R01 | relay index-intake hook with projection text; identity.session.started delivered twice; federation.record.accepted for a listing in a vault with fold on | evaluated before indexing; first observation recorded once; vault filter folds the listing; no identity.account.created consumer exists |
| TEST-PS-097-09.T16 | contract | PS-097-04.R04 | spam.detected with throttle at score 85 delivered to F12.S03.M03, F12.S03.M02 and F12.S02.M01 contract fixtures | the posting key's write bucket gets penalty 0.25, a spam_detected signal is recorded for subjectKey and a case is opened for the same subjectKey |
| TEST-PS-097-09.T17 | contract | PS-097-04.R05 | F01.S01.M03 contract fixture evaluates a draft in author_presign mode before signing | output has score, heuristics, rulesVersion and degraded; no event and no index row written |

## Dependencies

Module depends on: F12.S03.M03, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
