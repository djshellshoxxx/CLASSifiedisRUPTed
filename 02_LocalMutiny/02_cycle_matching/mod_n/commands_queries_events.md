# PS-018-04 — Commands, queries and events: N-party cycle engine

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M03 N-party cycle engine](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/n` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-018-04.R01** The vault commands generate, import and dismiss change only local records and send no statement; only the relay command compute_public runs on a relay and is optional.
- **PS-018-04.R02** Every command is idempotent per CTR-IDM-001 and emits its events in the same IndexedDB transaction as the state change (EVT-8).
- **PS-018-04.R03** Runs are serialized per vault with a Web Locks mutex so at most one run executes at a time, and the relay serializes runs per tenant.
- **PS-018-04.R04** The engine consumes want, listing, profile, valuation, block and cycle events only to mark the graph dirty or to change suggestion status; it never acts on another party's behalf.
- **PS-018-04.R05** classrup.mutiny.cycle_suggestion/v1 envelopes are registered with the F11.S01.M01 statement registry with signer role 'relay that computed it' (evidence of a relay assertion only); this module is their single ingest owner, and a relay run calls the relay platform hook notify.notification.dispatch for a content-free push after each mailbox put (N17), with no build dependency because the hook is provided by the relay runtime.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `mutiny.suggestion.generate` | mutiny.suggestion.generate | { lmax? (2..8, default 5), mode? local_rooted (default), timeBudgetMs? ≤ 250, expansionBudget? ≤ 100000, dryRun? } | { runId, suggestions: CycleSuggestion[], stats: { nodes, edges, expansions, durationMs, cyclesFound, truncated, projectionAsOf } } | MUTINY_LMAX_INVALID, MUTINY_GRAPH_TOO_LARGE, MUTINY_MATCHING_NOT_ENABLED, MUTINY_RUN_IN_PROGRESS, RATE_LIMITED | mutiny.cycle.suggested, mutiny.matching.run_completed | yes (Idempotency-Key) |
| `mutiny.suggestion.import` | mutiny.suggestion.import | { envelope: classrup.mutiny.cycle_suggestion/v1 signed by a relay, received via mailbox } | { suggestionId, verifiedLocally, status } | MUTINY_SUGGESTION_UNVERIFIED, VALIDATION_FAILED, UNSUPPORTED_SCHEMA_VERSION | mutiny.cycle.suggested | yes (Idempotency-Key) |
| `mutiny.suggestion.dismiss` | mutiny.suggestion.dismiss | { suggestionId, expectedRevision } | { suggestionId, revision, suppressedUntil } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `mutiny.suggestion.compute_public` | mutiny.suggestion.compute_public | { partition?: l1 geohash4, lmax? ≤ tenant maximum, scheduledAt } — relay command; delivers each suggestion as an end-to-end encrypted envelope to the participants' mailboxes, calls notify.notification.dispatch for a content-free push, keeps computed rings RET-EPHEMERAL and never logs them | { runId, stats, deliveredEnvelopes: int } | MUTINY_LMAX_INVALID, MUTINY_GRAPH_TOO_LARGE, MUTINY_RUN_IN_PROGRESS, FEATURE_DISABLED | mutiny.matching.run_completed | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `mutiny.suggestion.list_mine` | mutiny.suggestion.read | { status? default suggested, cursor?, limit ≤ 50 } | { items: CycleSuggestion[], nextCursor? } |  |
| `mutiny.suggestion.get` | mutiny.suggestion.read | { suggestionId } | { suggestion: CycleSuggestion, explanation: Explanation } | NOT_FOUND |
| `mutiny.graph.get_stats` | mutiny.graph.read_stats | { runId? default latest } | { runId, nodes, edges, expansions, durationMs, truncated, inputHash } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `mutiny.cycle.suggested` | P2 | { suggestionId, runId, cycleKey, length, participantIds, mode, verifiedLocally, expiresAt } |
| `mutiny.matching.run_completed` | P2 | { runId, mode, nodes, edges, expansions, durationMs, cyclesFound, suggestionsCreated, truncated } |

### Events consumed

| Type | Effect |
|---|---|
| `bazaar.want.declared` | mark graph dirty; schedule a run after the 60 s debounce |
| `bazaar.want.withdrawn` | supersede active suggestions whose legs reference the want |
| `bazaar.listing.unpublished` | supersede active suggestions containing an item of that listing |
| `bazaar.listing.expired` | supersede active suggestions containing an item of that listing |
| `bazaar.inventory.depleted` | supersede active suggestions containing that inventory item |
| `mutiny.matching_profile.updated` | mark graph dirty; supersede suggestions whose participant opted out, paused or narrowed maxCycleLength or distance |
| `mutiny.valuation.declared` | mark graph dirty; supersede suggestions whose value gap changed beyond the profile tolerance |
| `identity.block.added` | supersede active suggestions containing the blocked DID; no notification names the block |
| `mutiny.cycle.proposed` | set matching suggestion to proposed when payload.suggestionId matches |
| `mutiny.cycle.declined` | suppress the cycleKey for 30 days in this vault |
| `identity.portable_doc.published` | recompute keyLinked and the trust panel of active suggestions containing that DID |
| `identity.reputation.recomputed` | refresh completedTrades in the trust panel of active suggestions containing that DID |
| `privacy.deletion.completed` | delete all suggestions and graph caches of the erased local principal; suggestions are RET-SHORT and not evidence |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| MUTINY_LMAX_INVALID | 422 | no | Lmax is outside 2..tenant maximum |
| MUTINY_GRAPH_TOO_LARGE | 422 | no | graph exceeds 2000 nodes or 20000 edges even after L1 partitioning |
| MUTINY_MATCHING_NOT_ENABLED | 409 | no | the principal has not opted in to matching |
| MUTINY_RUN_IN_PROGRESS | 409 | yes | another matching run holds the mutex |
| MUTINY_PROFILE_NOT_ELIGIBLE | 409 | no | an endpoint of an edge is not an opted-in, unpaused participant |
| MUTINY_EDGE_INVALID | 422 | no | an edge fails item, want, distance or projection-age admission |
| MUTINY_SUGGESTION_UNVERIFIED | 422 | no | relay suggestion failed local signature or leg re-verification |
| MUTINY_RING_KEY_LINKED | 409 | no | two or more participants of the ring are key-linked and proposing needs explicit confirmation |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
# Algorithm (ADR-0005). nodes = DIDs sorted ascending; edge A->B when an item A offers satisfies an active want of B.
# For each start s in ascending order: restrict to nodes >= s, keep the strongly connected component of s,
# compute reverse BFS distance d(v) to s, DFS from s in ascending neighbour order, abandon a branch when depth + d(v) > Lmax.
# Johnson blocking sets are not used with a length cap because blocking is unsound under a depth bound.
# Unbounded Johnson 1975 is O((n+e)(c+1)) for c cycles; the bounded search is limited by 100000 expansions / 250 ms instead.
# Maximum-weight cycle packing is NP-hard for cycle length cap >= 3 (Abraham, Blum, Sandholm 2007) so selection is greedy.
# Score tuple, compare descending: (participants, -imbalance quantized to 10 permille, -maxDistanceBucket, oldestWantAgeDays); ties by cycleKey ascending.
#
# 2-party: edges a1->a2 [bike], a2->a1 [guitar]          => cycle [a1,a2] length 2
# 3-party: a3->a4 [lamp], a4->a5 [desk], a5->a3 [chair]  => cycle [a3,a4,a5] length 3
# 4-party: b1->b2 [skis], b2->b3 [tent], b3->b4 [drill], b4->b1 [novel] => cycle [b1,b2,b3,b4] length 4
# N-party (6): c1->c2->c3->c4->c5->c6->c1 : with Lmax 5 no cycle (length 6 > 5, pruned); with Lmax 8 cycle [c1..c6]
# Greedy: nodes n1..n4, edges n1->n2, n2->n1, n2->n3, n3->n4, n4->n1.
#   candidates from n1: [n1,n2] (2 participants) and [n1,n2,n3,n4] (4 participants)
#   4 participants outranks 2, selected; [n1,n2] shares n1 and n2 so it is dropped. Max cycles through a node stay bounded by budgets.
POST (vault command) mutiny.suggestion.generate
Idempotency-Key: 0192f3a4-0000-7000-8000-0000000000a1
{ "lmax": 5, "mode": "local_rooted" }
200 { "runId": "0192f3a5-1111-7000-8000-000000000001",
      "suggestions": [ { "id": "0192f3a5-2222-7000-8000-000000000002", "length": 3, "status": "suggested", "verifiedLocally": true,
        "score": { "participants": 3, "imbalancePermille": 42, "maxDistanceBucket": 1, "oldestWantAgeDays": 12 } } ],
      "stats": { "nodes": 412, "edges": 1380, "expansions": 9120, "durationMs": 38, "cyclesFound": 17, "truncated": "none" } }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-018-09.T01 | unit | PS-018-01.R01, PS-018-01.R02, PS-018-04.R01, PS-018-09.R04 | run on g2, g3, g4 | suggestions of length 2, 3, 4 with stable cycleKey rotated to smallest DID; no statement emitted |
| TEST-PS-018-09.T09 | integration | PS-018-04.R02, PS-018-04.R03, PS-018-06.R01 | replay generate with same key, different body, and parallel generate | stored result replayed; IDEMPOTENCY_KEY_REUSED; second parallel gets MUTINY_RUN_IN_PROGRESS |
| TEST-PS-018-09.T10 | contract | PS-018-04.R02, PS-018-09.R03 | each command and event | payloads validate against registry schemas classrup.mutiny.cycle_suggestion/v1 and event payloads |
| TEST-PS-018-09.T11 | integration | PS-018-04.R04, PS-018-03.R02 | consume want.withdrawn, block.added, cycle.declined | suggestions superseded, and declined cycleKey suppressed 30 days |
| TEST-PS-018-09.T24 | contract | PS-018-04.R05 | registry entry of classrup.mutiny.cycle_suggestion/v1 and relay push hook | signer role relay; compute_public calls notify.notification.dispatch once per delivered envelope with no content |

## Dependencies

Module depends on: F02.S02.M04, F02.S02.M05, F02.S04.M03, F01.S01.M01, F01.S02.M02, F01.S03.M01, F06.S02.M01, F07.S02.M02, F07.S02.M01, F07.S03.M01, F07.S03.M02, F09.S03.M02, F09.S03.M03, F11.S01.M01, F11.S01.M02, F16.S02.M03, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-OBS-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
