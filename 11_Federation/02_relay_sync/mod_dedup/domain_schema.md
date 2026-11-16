# PS-087-01 — Domain schema: Federated dedup

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M02 Federated dedup](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/dedup` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-087-01.R01** The module owns no entity; its inputs are an Envelope, a ChainHead {seq, cid} and a set of known cids, and its output is a Decision value type.
- **PS-087-01.R02** The chain rule is fixed by CTR-FED-001 (seq starts at 1, prev is the cid of the previous seq of the same author and is absent only at seq 1).
- **PS-087-01.R03** The buffer limits are constants of this module (24 h, 100 ahead, 50 per author, 5000 total) so every relay and vault behaves identically.

## Specification

**Note:** Stateless decision functions; buffered rows and chain heads are persisted as FederatedRecord by F11.S01.M02, so no entity is owned here.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-087-09.T01 | unit | PS-087-09.R02, PS-087-01.R01, PS-087-01.R02, PS-087-02.R01 | decide for next, duplicate, buffer, fork, reject cases from the example | decision kinds as documented |
| TEST-PS-087-09.T02 | property | PS-087-01.R02, PS-087-03.R01, PS-087-03.R02, PS-087-09.R03 | random permutations and duplicates of a 50-envelope chain through decide and drain | final accepted order equals seq order; every arrival yields at most one next per seq |
| TEST-PS-087-09.T03 | unit | PS-087-02.R02, PS-087-02.R03, PS-087-01.R03 | gap of 100 and 101; 50th and 51st buffered for one author; 5000th and 5001st total | boundary accepted at limit, FEDERATION_GAP_TOO_LARGE or FEDERATION_BUFFER_FULL above |
| TEST-PS-087-09.T04 | property | PS-087-01.R01, PS-087-02.R01, PS-087-07.R03 | random splices of prev values and duplicated seq with different cid | never next; always fork or reject |

## Dependencies

Module depends on: F11.S01.M03, CTR-FED-001, CTR-ERR-001, CTR-OBS-001, CTR-TST-001. Predecessor: [module SPEC](SPEC.md).
