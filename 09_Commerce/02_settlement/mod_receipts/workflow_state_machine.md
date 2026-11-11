# PS-071-03 — Workflow state machine: Receipts

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S02.M01 Receipts](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/settlement/receipts` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-071-03.R01** Receipts are immutable; there is no editing or deletion by status change.
- **PS-071-03.R02** Delivery progress is tracked by the sync outbox states, not by receipt status.
- **PS-071-03.R03** Verification is recomputed on demand and cached with its check time.

## Specification

**Note:** Receipts are immutable evidence records with no lifecycle; delivery state is carried by the sync outbox (prepared, transport_acknowledged, peer_accepted) and verification result, party binding and key status by the verification field.

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-071-09.T03 | unit | PS-071-01.R02, PS-071-03.R01, PS-071-03.R03 | attempt edit or delete via API and re-run verify after claim expiry | no edit path exists; verification result recomputed and receipt retained |
| TEST-PS-071-09.T09 | integration | PS-071-03.R02, PS-071-07.R01 | offline signing then reconnect | receipt delivered, sync state advances to peer_accepted only on signed acknowledgement |

## Dependencies

Module depends on: F09.S01.M01, F09.S03.M03, F07.S01.M01, F07.S02.M01, F07.S02.M02, F16.S02.M03, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
