# PS-080-03 — Workflow state machine: Metadata minimization

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S02.M03 Metadata minimization](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/security_boundaries/metadata` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-080-03.R01** All functions are pure and deterministic given the same input and, for rate-limit keys, the same daily salt.
- **PS-080-03.R02** Image processing is a fixed pipeline of decode, orient, downscale, re-encode, size step and verify, and any step failure aborts without output.
- **PS-080-03.R03** Output is never a partially cleaned image; the verification step must pass before bytes are returned.

## Specification

**Note:** Stateless pipeline functions with no lifecycle. Daily salt rotation for rate-limit keys is supplied by the caller (relay) and not held here.

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-080-09.T02 | unit | PS-080-02.R02, PS-080-03.R03 | scan every output with verifyImageClean and exiftool | zero metadata findings and zero GPS tags in all 40 outputs |
| TEST-PS-080-09.T06 | property | PS-080-03.R01, PS-080-03.R03, PS-080-06.R01 | random inputs through each helper twice | deterministic and idempotent; no partial output on forced failure |
| TEST-PS-080-09.T18 | unit | PS-080-03.R02 | corpus images with EXIF orientation 3, 6 and 8 | orientation is applied to the pixels before stripping; output has no orientation tag and renders upright |

## Dependencies

Module depends on: F10.S02.M02, CTR-PRV-001, CTR-FED-001, CTR-ID-001, CTR-ERR-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
