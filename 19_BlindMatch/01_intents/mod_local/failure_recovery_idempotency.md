# PS-149-06 — Failure recovery and idempotency: Private local intents

**Status:** SPECIFIED (Stage 3). **Module:** [F19.S01.M01 Private local intents](SPEC.md) · **Scope:** FUTURE · **Code:** `packages/blindmatch/src/intents/local` · **Contracts:** [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-149-06.R01** Use optimistic revisions and atomic storage transactions; a rejected storage transaction rolls back, while session loss after commit can conceal a successful mutation behind FORBIDDEN.
- **PS-149-06.R02** Retain no replay cache or deleted-object registry; repeated erasure reports absence without history.
- **PS-149-06.R03** Conceal late results after session loss and require explicit fresh owner action after state inspection.

## Specification

- **idempotency:** No persistent request hash or replay response; current revisions control mutation and erase leaves no history.
- **concurrency:** Current revision and ephemeral epoch checks reject stale results; session rereads revision after loading.
- **retries:** No automatic retry or recovered job; owner chooses a fresh action after state inspection.
- **offline:** Local functions require no remote account, wallet, payment or network provider.
- **partial failure:** Roll back rejected storage transactions and suppress stale asynchronous results with fixed errors. A late FORBIDDEN can follow a successful commit; inspect current state after unlocking before retrying.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-149-09.T06 | unit | PS-149-06.R01, PS-149-06.R02, PS-149-06.R03 | Inject transaction failure and session loss during persistence | Rejected transactions roll back; post-commit session loss conceals results and requires state inspection |

## Dependencies

Module depends on: F15.S02.M03, CTR-ERR-001, CTR-PRV-001, CTR-IOX-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
