# PS-080-08 — Observability and performance: Metadata minimization

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S02.M03 Metadata minimization](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/security_boundaries/metadata` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-080-08.R01** The PWA sends no telemetry (OBS-7); stripping timings and failures stay in local diagnostics and relays follow CTR-OBS-001 for upload outcomes.
- **PS-080-08.R02** Image stripping meets the latency budget on a mid-range phone and on a relay worker.
- **PS-080-08.R03** CI reports the corpus pass rate and findings by type.

## Specification

**Metrics**
- Local diagnostics and relay: classrup_privacy_image_strip_total{outcome=ok|unsupported|too_large|gps_present}
- classrup_privacy_image_strip_ms (histogram)
- CI report: corpus_clean_rate (must be 100 percent)

**Logs**
- info image.stripped {sha256Prefix8, widthxheight, durationMs, correlationId} — no filenames, no metadata values, no IP.

**Budgets**
- stripImage for a 12 MP photo p95 ≤ 1.5 s on a 2022 mid-range Android device and ≤ 400 ms on a relay worker.
- verifyImageClean p95 ≤ 50 ms; truncateIp and publicTime p99 ≤ 0.02 ms; package ≤ 40 KiB gzip excluding the codec.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-080-09.T15 | load | PS-080-08.R01, PS-080-08.R02, PS-080-08.R03 | 12 MP photos on a mid-range device profile and relay worker | p95 ≤ 1.5 s client and ≤ 400 ms relay; verify ≤ 50 ms; corpus clean rate 100 percent |

## Dependencies

Module depends on: F10.S02.M02, CTR-PRV-001, CTR-FED-001, CTR-ERR-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
