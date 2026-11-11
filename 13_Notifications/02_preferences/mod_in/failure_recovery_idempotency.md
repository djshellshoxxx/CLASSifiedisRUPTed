# PS-106-06 — Failure recovery and idempotency: In-app notification preferences

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M04 In-app notification preferences](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/in` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-106-06.R01** Vault commands commit locally first; mirroring is a retried outbox step with states prepared, transport acknowledged and peer accepted.
- **PS-106-06.R02** Mirror statements are idempotent on cid and applied only when they extend the head of their device chain.
- **PS-106-06.R03** Each device is a separate vault; within one vault concurrent edits of the same cell produce CONFLICT_REVISION, and across devices the relay applies per channel the statement it accepted most recently among the user's active device chains, shows the other devices which device's matrix it uses, and never merges cells.

## Specification

- **idempotency:** Vault set is idempotent on the resulting cell values and expectedRevision; relay mirror is idempotent on statement cid with Idempotency-Key replay window 24 h and returns the stored outcome and acceptance.
- **concurrency:** expectedRevision per cell protects tabs of one vault; each command is one IndexedDB transaction; each statement carries the complete column of one channel with seq and prev on its device chain, so the relay holds one consistent snapshot per chain; an equal seq with another cid is refused as a fork.
- **retries:** Outbox retries the mirror with backoff base 1 s, factor 2, cap 15 min for 14 days; a CONFLICT_STATE stops retries and asks the user to re-save.
- **offline:** All edits work offline and show saved on this device; the mirror is sent when online; the UI says the relay still uses previous push or email settings until confirmed.
- **partial failure:** If mirroring fails the local matrix stays authoritative for in-app, OS alerts and vault-originated alerts, and the relay keeps the previous snapshot for hook dispatches; a failed mirror never blocks local changes.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-106-09.T04 | integration | PS-106-03.R03, PS-106-06.R01 | edit while relay down then relay up | mirror shows local_committed, prepared, transport_acknowledged and peer_accepted only after the acceptance signature over its cid |
| TEST-PS-106-09.T08 | integration | PS-106-06.R02, PS-106-06.R03 | replay mirror seq 5 after seq 7 on one chain; devices A and B each mirror a different push column; a restored vault reuses seq 7 with another cid | stale replay acknowledged without change and never peer_accepted; the column accepted last is effective and A shows that the relay uses B's settings; fork refused CONFLICT_STATE with currentCid; no merged cells |
| TEST-PS-106-09.T15 | contract | PS-106-09.R03, PS-106-06.R03 | golden default table and resolve without a mirror; security.key.revoked for the effective device key | resolve returns the defaults with source defaults and allows security push; after revocation the next active chain or the defaults apply |

## Dependencies

Module depends on: F13.S02.M03, F11.S01.M01, F16.S02.M02, F07.S02.M01, F15.S01.M01, F15.S02.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
