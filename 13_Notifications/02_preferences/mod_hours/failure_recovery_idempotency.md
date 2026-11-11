# PS-105-06 — Failure recovery and idempotency: Quiet-hours schedule

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M02 Quiet-hours schedule](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/hours` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-105-06.R01** Saving is idempotent on the resulting schedule content and expectedRevision, and mirroring is idempotent on seq.
- **PS-105-06.R02** Evaluation is deterministic and has no I/O, so it can be retried and cached freely.
- **PS-105-06.R03** If the relay copy lags behind the vault, the relay applies the older schedule until the mirror arrives and the UI says so.

## Specification

- **idempotency:** Vault set is idempotent on identical content; relay mirror is idempotent on (userDid, seq) with Idempotency-Key replay window 24 h; evaluate is a pure function.
- **concurrency:** expectedRevision on set; each command is one IndexedDB transaction; the relay accepts only strictly higher seq so out-of-order statements cannot restore an old schedule; two devices editing concurrently produce a CONFLICT_REVISION on the second and the UI shows the winner for explicit re-edit.
- **retries:** Outbox retries the mirror with backoff base 1 s, factor 2, cap 15 min for 14 days.
- **offline:** Saving works offline; local evaluation uses the saved schedule; the mirror is sent when online and the UI says the relay still uses the previous schedule until confirmed.
- **partial failure:** If mirroring fails the local schedule is unaffected and in-app behavior is correct; an unconfirmed mirror means a relay may send a push at the old quiet boundary, which the UI discloses.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-105-09.T10 | integration | PS-105-06.R01, PS-105-06.R02, PS-105-06.R03, PS-105-03.R03 | replay seq 3 after seq 5; relay down during save | stale ignored; local evaluation unaffected; sync states advance prepared to transport acknowledged to peer accepted |

## Dependencies

Module depends on: F13.S02.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
