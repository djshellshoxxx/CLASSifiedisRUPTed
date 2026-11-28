# PS-087-02 — Validation rules: Federated dedup

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M02 Federated dedup](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/dedup` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-087-02.R01** Decisions are deterministic functions of (envelope, chain view, buffer counts, open conflicts, now).
- **PS-087-02.R02** Out-of-range inputs are rejected before any state is considered.
- **PS-087-02.R03** Each rejection maps to one stable code so peers and users see consistent reasons.
- **PS-087-02.R04** Buffer capacity is shared fairly; caps apply per source and per author, freshly anchored authors use a bounded share, and eviction starts with the source that exceeds its cap, so a Sybil flood cannot refuse legitimate out-of-order envelopes.
- **PS-087-02.R05** A predecessor older than its type's maxAge, or one that was tombstoned, is used only as a continuity stub (cid, seq, prev; no content stored), so the F11.S01.M02 age limit never blocks a chain.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | envelope seq is an integer ≥ 1, prev is absent iff seq = 1 and the chain key (author, signerKey, stream) is complete | VALIDATION_FAILED |
| V02 | gap seq - head.seq - 1 ≤ 100 for buffering; a larger gap is never buffered and is returned as decision reanchor (accepted with chainGap, missing range listed for catch-up) carrying this reason code | FEDERATION_GAP_TOO_LARGE |
| V03 | buffered rows: per author ≤ 50 (≤ 5 for a freshly anchored author), per source ≤ 500, per tenant ≤ 5000 with freshly anchored authors ≤ 1000; when a cap is reached the oldest rows of the source over its cap are evicted first, otherwise the envelope is refused | FEDERATION_BUFFER_FULL |
| V04 | bufferedUntil = receivedAt + 86400 s exactly; expiry compares against the injected clock | VALIDATION_FAILED |
| V05 | every buffer request names its source (peer relay id, device key or mailbox source) so caps and eviction are per source | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-087-09.T01 | unit | PS-087-01.R01, PS-087-01.R02, PS-087-02.R01 | decide for the duplicate, anchor, next, backfill, buffer, reanchor, fork and held_on_fork cases of the example | decision kinds as documented |
| TEST-PS-087-09.T03 | unit | PS-087-01.R03, PS-087-02.R02, PS-087-02.R03, PS-087-09.R03 | gap of 100 and 101; 50th and 51st buffered for an author with history; 5th and 6th for a fresh author; 500th and 501st for one source; 5000th and 5001st total | at limit accepted; 101 returns reanchor with reason FEDERATION_GAP_TOO_LARGE; above the caps FEDERATION_BUFFER_FULL or eviction of the offending source |
| TEST-PS-087-09.T07 | unit | PS-087-02.R01, PS-087-06.R01, PS-087-07.R03 | expired() with buffer rows at 23 h 59 min and 24 h 00 min; backwards clock jump | only the 24 h row is released with chainGap (none dropped); the jump does not extend the window |
| TEST-PS-087-09.T14 | integration | PS-087-02.R05, PS-087-01.R04 | peer relay joins after author X published 200 records, some older than 180 days and beyond their type maxAge and some tombstoned | aged-out and tombstoned predecessors become continuity stubs; every live record is accepted; the peer converges to the origin's live set |
| TEST-PS-087-09.T15 | abuse | PS-087-02.R04 | 200 Sybil authors from source P send 10 future-seq envelopes each while author Y with history sends 3 out-of-order envelopes through source Q | P capped at 500 with its oldest rows evicted first; Y's envelopes buffered and drained in order; none of Y's refused |

## Dependencies

Module depends on: F11.S01.M03, CTR-FED-001, CTR-ERR-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
