# PS-085-08 — Observability and performance: Envelope signatures

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M03 Envelope signatures](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/signatures` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-085-08.R01** Verification outcomes and latencies are measured per CTR-OBS-001 without logging keys or payloads.
- **PS-085-08.R02** Verification of one typical 4 KiB envelope meets a p95 budget of 2 ms on the reference relay CPU.
- **PS-085-08.R03** A batch of 100 envelopes verifies in under 250 ms on a single worker.

## Specification

**Metrics**
- classrup_federation_signature_verify_total{outcome=ok|invalid|malformed|unsupported_did}
- classrup_federation_signature_verify_duration_ms (histogram)
- classrup_federation_request_signature_total{outcome=ok|invalid|stale}

**Logs**
- warn federation.signature.invalid {cidPrefix, authorPrefix(16), code, correlationId} — never the signature or payload.

**Budgets**
- verifyEnvelope p95 ≤ 2 ms for envelopes ≤ 4 KiB; ≤ 20 ms for envelopes up to 262144 bytes.
- 100-envelope batch verify ≤ 250 ms on one worker.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-085-09.T12 | load | PS-085-07.R02, PS-085-08.R01, PS-085-08.R02, PS-085-08.R03 | verify 100-envelope batches of 4 KiB for 60 s | p95 per envelope ≤ 2 ms, batch ≤ 250 ms, metrics exported |

## Dependencies

Module depends on: CTR-FED-001, CTR-ERR-001, CTR-ID-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
