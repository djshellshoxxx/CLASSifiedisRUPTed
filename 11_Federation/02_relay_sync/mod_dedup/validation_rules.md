# PS-087-02 — Validation rules: Federated dedup

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M02 Federated dedup](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/dedup` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-087-02.R01** Decisions are deterministic functions of (envelope, head, known cids, buffer counts, now).
- **PS-087-02.R02** Out-of-range inputs are rejected before any state is considered.
- **PS-087-02.R03** Each rejection maps to one stable code so peers and users see consistent reasons.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | envelope seq is an integer ≥ 1 and prev is absent iff seq = 1 | VALIDATION_FAILED |
| V02 | seq - head.seq - 1 ≤ 100 (gap size) | FEDERATION_GAP_TOO_LARGE |
| V03 | buffered count for the author < 50 and total buffered < 5000 | FEDERATION_BUFFER_FULL |
| V04 | bufferedUntil = receivedAt + 86400 s exactly; expiry compares against the injected clock | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-087-09.T01 | unit | PS-087-09.R02, PS-087-01.R01, PS-087-01.R02, PS-087-02.R01 | decide for next, duplicate, buffer, fork, reject cases from the example | decision kinds as documented |
| TEST-PS-087-09.T03 | unit | PS-087-02.R02, PS-087-02.R03, PS-087-01.R03 | gap of 100 and 101; 50th and 51st buffered for one author; 5000th and 5001st total | boundary accepted at limit, FEDERATION_GAP_TOO_LARGE or FEDERATION_BUFFER_FULL above |
| TEST-PS-087-09.T04 | property | PS-087-01.R01, PS-087-02.R01, PS-087-07.R03 | random splices of prev values and duplicated seq with different cid | never next; always fork or reject |
| TEST-PS-087-09.T05 | unit | PS-087-02.R01, PS-087-03.R03, PS-087-04.R01 | order of unrelated authors permuted | each author's decision identical regardless of order |

## Dependencies

Module depends on: F11.S01.M03, CTR-FED-001, CTR-ERR-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
