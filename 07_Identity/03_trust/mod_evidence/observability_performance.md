# PS-057-08 — Observability and performance: Trust evidence

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S03.M02 Trust evidence](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/trust/evidence` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-057-08.R01** Relays export operator-issued attestation counts per CTR-OBS-001; vaults keep local counters only.
- **PS-057-08.R02** Verification of one attestation takes at most 8 ms p95 on a Moto G-class device.
- **PS-057-08.R03** Listing 50 attestations for a subject completes within 50 ms p95 locally.

## Specification

**Metrics**
- classrup_identity_relay_attestations_total{outcome=issued|rejected} (relay)
- local counter attestation_total{event=issued|received|endorsed|revoked|expired|rejected|not_displayed}

**Logs**
- info attestation.event {event, kind, correlationId} - no DIDs, labels or check notes.

**Budgets**
- verify p95 <= 8 ms on device; list 50 p95 <= 50 ms; issue p95 <= 100 ms; issue_relay p95 <= 300 ms; list_linkage p95 <= 20 ms.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-057-09.T11 | load | PS-057-08.R01, PS-057-08.R02, PS-057-08.R03 | verify 1 000 attestations and list 50 on emulated Moto G | verify p95 <= 8 ms, list p95 <= 50 ms; relay counters exported |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S03.M01, F15.S02.M01, F16.S02.M02, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
