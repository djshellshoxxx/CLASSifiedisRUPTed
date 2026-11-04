# PS-080-06 — Failure recovery and idempotency: Metadata minimization

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S02.M03 Metadata minimization](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/security_boundaries/metadata` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-080-06.R01** Functions are deterministic; stripping an already clean image returns an equivalent clean image.
- **PS-080-06.R02** A failure at any pipeline step returns an error and no bytes, so there is no partial unsafe output.
- **PS-080-06.R03** Image work runs in a worker with a 10 s timeout; on timeout the upload is cancelled and can be retried by the user.

## Specification

- **idempotency:** stripImage(stripImage(x)) is clean and equal in pixel content; truncateIp and publicTime are idempotent.
- **concurrency:** No shared state; at most 2 concurrent image jobs per client and 4 per relay worker pool.
- **retries:** Callers retry only after the user chooses another file; deterministic failures are not retried.
- **offline:** Fully offline; works in the browser and in the service worker.
- **partial failure:** Verification must pass before output is returned; any failure discards intermediate buffers.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-080-09.T06 | property | PS-080-03.R01, PS-080-03.R03, PS-080-06.R01 | random inputs through each helper twice | deterministic and idempotent; no partial output on forced failure |
| TEST-PS-080-09.T10 | abuse | PS-080-06.R02, PS-080-07.R02 | decoder fuzz with 1 000 malformed files and a worker that hangs | no crash, rejected within 10 s timeout, no output bytes |
| TEST-PS-080-09.T12 | integration | PS-080-07.R02, PS-080-06.R03 | rate-limit key construction across a salt rotation | same /24 maps to the same key within a day and to a different key after rotation |
| TEST-PS-080-09.T13 | abuse | PS-080-07.R03, PS-080-06.R02 | 61 uploads in an hour from one /24 | 61st returns RATE_LIMITED from the caller's limiter using the key; 3 concurrent image jobs queued |

## Dependencies

Module depends on: F10.S02.M02, CTR-PRV-001, CTR-FED-001, CTR-ERR-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
