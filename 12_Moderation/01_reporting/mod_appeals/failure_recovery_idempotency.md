# PS-092-06 — Failure recovery and idempotency: Appeals

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M03 Appeals](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/appeals` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-092-06.R01** All commands are idempotent per CTR-IDM-001 and mutating commands require expectedRevision.
- **PS-092-06.R02** Concurrent assignment attempts serialize on appeal revision within the relay store; there is no cross-vault lock.
- **PS-092-06.R03** Decision and event are written in one relay transaction, and a vault that misses the decision statement can refetch it by appeal ID.

## Specification

- **idempotency:** Local Idempotency-Key on vault commands; relay stores (appellantKey, appealId) for 24 h and replays the signed receipt; decide replays the stored decision statement.
- **concurrency:** expectedRevision on decide and withdraw; unique (tenant_id, action_id) index enforces one appeal per action under races; assignment uses compare-and-set on status and revision.
- **retries:** Sync outbox retries delivery for up to 7 days with CTR-IDM-001 backoff; the vault polls decision status every 15 min while open when online.
- **offline:** File and withdraw can be queued offline; deadline arithmetic always uses the relay-signed reasons time so offline delay can consume the window, and the UI shows the remaining days before the user goes offline.
- **partial failure:** If the relay accepts the appeal but the receipt is lost, the retry returns the stored receipt; if the decision statement fails to deliver, it is available via query and the vault fetches it; sync state never shows peer_accepted without a verified relay signature.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-092-09.T09 | integration | PS-092-06.R01, PS-092-06.R02 | same Idempotency-Key replayed; concurrent assign and withdraw | original receipt replayed; consistent final state by revision |
| TEST-PS-092-09.T10 | chaos | PS-092-06.R03, PS-092-03.R03 | receipt lost then retried; decision statement undelivered | stored receipt replayed; vault fetches decision; sync state advances honestly |

## Dependencies

Module depends on: F12.S02.M01, F12.S01.M02, F12.S02.M03, F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
