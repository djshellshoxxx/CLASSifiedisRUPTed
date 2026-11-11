# PS-052-08 — Observability and performance: Pseudonymous accounts

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M01 Pseudonymous accounts](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/pseudonyms` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-052-08.R01** Relays export registry metrics per CTR-OBS-001; the PWA keeps counters in local diagnostics only.
- **PS-052-08.R02** Account creation completes within 2 seconds on a Moto G-class device including scrypt (N=2^17), and registry claims within 300 ms p95.
- **PS-052-08.R03** Skeleton computation takes at most 5 ms for a 32 code point pseudonym.

## Specification

**Metrics**
- classrup_identity_handle_claims_total{outcome=ok|taken|confusable|invalid|replay|stale|rate_limited} (relay)
- classrup_identity_registry_size (gauge, relay)
- local counter device_key_changes_total{kind=added|revoked|pending|contested}

**Logs**
- info identity.device_key {event, correlationId} - no keys, labels, pseudonyms or DIDs.

**Budgets**
- Account creation p95 <= 2 s on a Moto G-class device (scrypt dominates); claim and check p95 <= 300 ms on the relay; skeleton <= 5 ms; fingerprint <= 1 ms.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-052-09.T13 | load | PS-052-08.R01, PS-052-08.R02, PS-052-08.R03 | 50 claims per second for 5 minutes on a relay; account creation on emulated Moto G; 32 code point skeletons | p95 <= 300 ms on relay and <= 2 s creation; skeleton <= 5 ms; registry metrics exported |

## Dependencies

Module depends on: F16.S02.M02, F10.S01.M02, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
