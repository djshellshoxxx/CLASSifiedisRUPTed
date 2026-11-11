# PS-130-08 — Observability and performance: Signatures

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M03 Signatures](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/signatures` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-130-08.R01** Relay verification outcomes are counted per CTR-OBS-001 with codes as labels and no key IDs; the vault keeps local diagnostics only.
- **PS-130-08.R02** sign and verify meet p95 ≤ 5 ms on desktop-class and ≤ 25 ms on a Moto G-class device for 4 KiB payloads.
- **PS-130-08.R03** Verification failure spikes are visible to the incident detection hooks of F16.S03.M02.

## Specification

**Metrics**
- classrup_security_signature_verifications_total{outcome=valid|invalid,code}
- classrup_security_signature_verify_ms (histogram)
- classrup_security_signature_freshness_total{class=fresh|stale|unknown}

**Logs**
- relay warn signature.invalid {context, code, correlationId} — no payload, no key ID.

**Budgets**
- sign and verify p95 ≤ 5 ms (desktop) and ≤ 25 ms (Moto G profile) for 4 KiB; canonicalization of 64 KiB ≤ 10 ms.
- Library bundle ≤ 12 KiB gzip excluding @noble/curves.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-130-09.T11 | load | PS-130-08.R01, PS-130-08.R02, PS-130-08.R03 | 1 000 verifications per second for 5 minutes, 4 KiB payloads; Moto G profile | p95 ≤ 5 ms desktop and ≤ 25 ms Moto G; metrics exported |

## Dependencies

Module depends on: F16.S02.M02, CTR-FED-001, CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
