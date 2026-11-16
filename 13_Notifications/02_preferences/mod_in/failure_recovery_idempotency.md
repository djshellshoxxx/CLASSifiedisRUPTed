# PS-106-06 — Failure recovery and idempotency: In-app notification preferences

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M04 In-app notification preferences](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/in` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-106-06.R01** Vault commands commit locally first; mirroring is a retried outbox step with states prepared, transport acknowledged and peer accepted.
- **PS-106-06.R02** Mirror statements are idempotent on seq and applied only if seq is higher than the stored one.
- **PS-106-06.R03** Concurrent edits from two devices merge per cell by cell revision; there is no distributed lock and no destructive overwrite of unrelated cells.

## Specification

- **idempotency:** Vault set is idempotent on the resulting cell values and expectedRevision; relay mirror is idempotent on (userDid, seq) with Idempotency-Key replay window 24 h.
- **concurrency:** expectedRevision per cell; each command is one IndexedDB transaction; the mirror always sends the complete push and email columns with a strictly increasing seq so the relay holds one consistent snapshot.
- **retries:** Outbox retries the mirror with backoff base 1 s, factor 2, cap 15 min for 14 days.
- **offline:** All edits work offline and show saved on this device; the mirror is sent when online; the UI says the relay still uses previous push settings until confirmed.
- **partial failure:** If mirroring fails the local matrix stays authoritative for in-app and the relay keeps the previous snapshot; a failed mirror never blocks local changes.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-106-09.T04 | integration | PS-106-03.R03, PS-106-06.R01 | edit while relay down then relay up | mirror shows local_committed, prepared, transport_acknowledged in order, never ahead |
| TEST-PS-106-09.T08 | integration | PS-106-06.R02, PS-106-06.R03 | replay mirror seq 5 after seq 7; two devices edit different cells | stale replay ignored; merged cells preserved |

## Dependencies

Module depends on: F13.S02.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
