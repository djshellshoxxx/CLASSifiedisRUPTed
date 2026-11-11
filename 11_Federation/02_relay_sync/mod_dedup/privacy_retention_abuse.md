# PS-087-07 — Privacy, retention and abuse: Federated dedup

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M02 Federated dedup](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/dedup` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-087-07.R01** The module reads only cids, authors, signer keys, streams, seq and prev, never payloads, so it cannot leak content.
- **PS-087-07.R02** Buffer caps per author, per source and per tenant, the bounded share of freshly anchored authors and offending-source eviction cap the memory an attacker can pin with forged future seq numbers or Sybil authors.
- **PS-087-07.R03** Retention of buffered envelopes is at most 24 h, after which they are released with chainGap rather than kept or silently dropped.

## Specification

**Data classification**
- Cids, did:key authors and signer keys, stream ids and seq numbers: P0 identifiers for public chains; thread stream ids are opaque random values that reveal no counterpart.

**Retention**
- No data kept; buffered rows follow F11.S01.M02 and are released after at most 24 h.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Memory or storage exhaustion by forged future seq numbers or many Sybil authors | gap ≤ 100 for buffering, 50 per author with history, 5 per fresh author, 500 per source with eviction of the offending source first, 5000 total with a 1000 fresh-author share (V02, V03) |
| T02 | Replay of delivered envelopes to cause repeated side effects | duplicate decision by cid; callers emit no event on duplicate |
| T03 | Equivocation: two different histories for the same seq | collision at (author, signerKey, stream, seq) gives fork, never accepted; handed to F11.S02.M03; successors held_on_fork |
| T04 | Hash-chain splice: valid envelope with prev pointing at an unrelated cid | prev must equal the stored neighbour's cid, else fork prev_mismatch |
| T05 | Chain used as a censorship gate: a receiver that never saw seq 1, or whose predecessors were tombstoned or aged out, refuses later statements | anchor at the first verified envelope, continuity stubs, and release with chainGap after the 24 h window |

**Abuse controls**
- Buffer-full and gap counts per source are local diagnostics only; gap and buffer codes are never reported as peer faults to the F11.S03.M01 health score.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-087-09.T04 | property | PS-087-01.R04, PS-087-07.R03 | random splices of prev values, duplicated seq with different cid, and gaps without collisions | splices and collisions always fork; non-colliding gaps never fork and are eventually accepted |
| TEST-PS-087-09.T07 | unit | PS-087-02.R01, PS-087-06.R01, PS-087-07.R03 | expired() with buffer rows at 23 h 59 min and 24 h 00 min; backwards clock jump | only the 24 h row is released with chainGap (none dropped); the jump does not extend the window |
| TEST-PS-087-09.T09 | abuse | PS-087-07.R01, PS-087-07.R02 | one freshly anchored author forges 10 000 future seq numbers | at most 5 buffered, the rest refused; payload never read; no peer health report |

## Dependencies

Module depends on: F11.S01.M03, CTR-FED-001, CTR-ERR-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
