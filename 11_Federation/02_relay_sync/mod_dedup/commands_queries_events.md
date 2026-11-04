# PS-087-04 — Commands, queries and events: Federated dedup

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M02 Federated dedup](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/dedup` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-087-04.R01** The module exposes pure functions only and no vault, relay or network commands.
- **PS-087-04.R02** Functions return Result<Decision, AppError> and never throw for bad input.
- **PS-087-04.R03** No events are emitted; the caller turns decisions into events.

## Specification

### Commands

_None._

### Queries

_None._

### Events produced

_None._

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| FEDERATION_GAP_TOO_LARGE | 422 | no | the envelope is more than 100 sequence numbers ahead of the stored head |
| FEDERATION_BUFFER_FULL | 429 | yes | the gap buffer for this author or tenant is full |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** API: decide(env, head, known, counts, now) -> Decision; drain(buffered[], head) -> Envelope[] in release order; expired(buffered[], now) -> {drop[], fetch[]}; verifyChain(envelopes[]) -> Result<void>.

### Example

```
decide(env{seq:8, prev:"sha256-c7"}, head{seq:6, cid:"sha256-a2"}, known, counts, now) -> { kind: "buffer", missing: [7], until: "2026-11-05T10:00:00.000Z" }
decide(env{seq:7, prev:"sha256-a2"}, head{seq:6, cid:"sha256-a2"}, known, counts, now) -> { kind: "next" }
decide(env{seq:7, prev:"sha256-ff"}, head{seq:6, cid:"sha256-a2"}, known, counts, now) -> { kind: "fork", reason: "prev_mismatch" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-087-09.T05 | unit | PS-087-02.R01, PS-087-03.R03, PS-087-04.R01 | order of unrelated authors permuted | each author's decision identical regardless of order |
| TEST-PS-087-09.T06 | unit | PS-087-05.R03, PS-087-09.R02, PS-087-04.R02, PS-087-04.R03, PS-087-05.R01 | inspect exports and signatures | only pure functions; no events; Result type; VerifiedEnvelope required by type |

## Dependencies

Module depends on: F11.S01.M03, CTR-FED-001, CTR-ERR-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
