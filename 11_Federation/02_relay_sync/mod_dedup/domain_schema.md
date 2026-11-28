# PS-087-01 — Domain schema: Federated dedup

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M02 Federated dedup](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/dedup` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-087-01.R01** The module owns no entity; its inputs are an Envelope, the ChainHead of its chain key (author, signerKey, stream) or none, the known cids and stored neighbours of that chain, buffer counts per author, source and tenant, and the open conflict candidates, and its output is a Decision value type.
- **PS-087-01.R02** The chain rule follows CTR-FED-001 per chain key (seq starts at 1, prev is the cid of the previous seq of the same chain and is absent only at seq 1), but a receiver with no head anchors at whatever seq it first sees.
- **PS-087-01.R03** The buffer limits are constants of this module (24 h window, gap 100, 50 per author with history, 5 per freshly anchored author, 500 per source, 5000 total of which at most 1000 for freshly anchored authors) so every relay and vault behaves identically.
- **PS-087-01.R04** Chains detect equivocation and do not gate acceptance; forks are detected only on (author, signerKey, stream, seq) collisions or prev mismatches with stored neighbours, and every other verified envelope is eventually accepted.

## Specification

**Note:** Stateless decision functions; buffered rows and chain heads are persisted as FederatedRecord by F11.S01.M02, so no entity is owned here. A freshly anchored author is a chain anchored less than 24 h ago with fewer than 10 accepted records; an author with history is any other anchored chain.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-087-09.T01 | unit | PS-087-01.R01, PS-087-01.R02, PS-087-02.R01 | decide for the duplicate, anchor, next, backfill, buffer, reanchor, fork and held_on_fork cases of the example | decision kinds as documented |
| TEST-PS-087-09.T03 | unit | PS-087-01.R03, PS-087-02.R02, PS-087-02.R03, PS-087-09.R03 | gap of 100 and 101; 50th and 51st buffered for an author with history; 5th and 6th for a fresh author; 500th and 501st for one source; 5000th and 5001st total | at limit accepted; 101 returns reanchor with reason FEDERATION_GAP_TOO_LARGE; above the caps FEDERATION_BUFFER_FULL or eviction of the offending source |
| TEST-PS-087-09.T04 | property | PS-087-01.R04, PS-087-07.R03 | random splices of prev values, duplicated seq with different cid, and gaps without collisions | splices and collisions always fork; non-colliding gaps never fork and are eventually accepted |
| TEST-PS-087-09.T13 | integration | PS-087-01.R02, PS-087-01.R04 | fresh vault receives an offer from stranger S at seq 37 of thread stream thr:A, then seq 38 | seq 37 anchor and accepted; seq 38 next |
| TEST-PS-087-09.T14 | integration | PS-087-02.R05, PS-087-01.R04 | peer relay joins after author X published 200 records, some older than 180 days and beyond their type maxAge and some tombstoned | aged-out and tombstoned predecessors become continuity stubs; every live record is accepted; the peer converges to the origin's live set |

## Dependencies

Module depends on: F11.S01.M03, CTR-FED-001, CTR-ERR-001, CTR-OBS-001, CTR-TST-001. Predecessor: [module SPEC](SPEC.md).
