# PS-105-06 — Failure recovery and idempotency: Quiet-hours schedule

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M02 Quiet-hours schedule](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/hours` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-105-06.R01** Saving is idempotent on the resulting schedule content and expectedRevision, and mirroring is idempotent on the statement cid.
- **PS-105-06.R02** Evaluation is deterministic and has no I/O, so it can be retried and cached freely.
- **PS-105-06.R03** Each device of the principal is a separate vault with its own mirror chain; the relay keeps the latest verified statement per device chain, the gate uses the one the relay accepted most recently across the user's active devices, and a device whose statement was superseded is shown which device's schedule the relay uses.

## Specification

- **idempotency:** Vault set is idempotent on identical content; relay mirror is idempotent on statement cid with Idempotency-Key replay window 24 h; a repeated cid returns the stored outcome and acceptance; evaluate is a pure function.
- **concurrency:** expectedRevision on set protects tabs of one vault; each command is one IndexedDB transaction; the relay accepts only seq above the head of that device chain with prev equal to the head cid, so out-of-order statements cannot restore an old schedule and an equal seq with another cid is refused as a fork; there is no cross-device merge.
- **retries:** Outbox retries the mirror with backoff base 1 s, factor 2, cap 15 min for 14 days; a CONFLICT_STATE stops retries and asks the user to re-save.
- **offline:** Saving works offline; local evaluation uses the saved schedule; the mirror is sent when online and the UI says the relay still uses the previous schedule until confirmed.
- **partial failure:** If mirroring fails the local schedule is unaffected and in-app behavior is correct; an unconfirmed or superseded mirror means a relay may send a hook push at another quiet boundary, which the UI discloses.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-105-09.T10 | integration | PS-105-06.R01, PS-105-06.R02, PS-105-06.R03, PS-105-03.R03 | replay seq 3 after seq 5 on one chain; devices A and B each sign seq 1; a restored vault signs seq 5 again with another cid; relay down during save | stale outcome without peer_accepted; latest accepted of A and B is effective and the other device shows which device's schedule applies; fork refused CONFLICT_STATE with currentCid; local evaluation unaffected; sync states advance prepared to transport_acknowledged to peer_accepted only for applied |

## Dependencies

Module depends on: F13.S02.M03, F11.S01.M01, F16.S02.M02, F07.S02.M01, F15.S01.M01, F15.S02.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
