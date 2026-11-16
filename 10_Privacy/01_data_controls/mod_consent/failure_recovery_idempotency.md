# PS-076-06 — Failure recovery and idempotency: Privacy consent

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M01 Privacy consent](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/consent` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-076-06.R01** Commands are idempotent per CTR-IDM-001 using vault command IDs and expectedRevision on withdrawal.
- **PS-076-06.R02** Withdrawal commits locally first; relay delivery of the signed withdrawal retries until peer_accepted or the relay is removed.
- **PS-076-06.R03** The check function fails closed, so any error means not granted.

## Specification

- **idempotency:** Vault command ID recorded for 24 h; grant of the same purpose, scope and policy hash while already granted returns the existing consent.
- **concurrency:** Partial unique index allows one granted row per purpose and relay; Web Lock privacy-consent serializes tabs; check reads a consistent snapshot.
- **retries:** Signed statements retry 5 s, 30 s, 5 min, 1 h, then every 6 h up to 30 days.
- **offline:** Grant and withdrawal work offline and apply locally at once; relay statements wait in the sync outbox and the UI shows prepared.
- **partial failure:** If the relay never receives the withdrawal, local processing for the purpose has already stopped; the UI shows the relay may still hold copies and offers export of the statement.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-076-09.T11 | integration | PS-076-06.R01, PS-076-06.R02, PS-076-06.R03 | replay command ID; relay offline during withdrawal | original result; local processing stops at once; UI shows prepared |

## Dependencies

Module depends on: F07.S01.M01, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
