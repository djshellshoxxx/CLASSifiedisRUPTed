# PS-080-05 — Authorization and capabilities: Metadata minimization

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S02.M03 Metadata minimization](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/security_boundaries/metadata` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-080-05.R01** The library performs no authorization; callers decide who may upload and which view is public.
- **PS-080-05.R02** It has no network or storage access, so it cannot leak data.
- **PS-080-05.R03** Clients apply stripImage before upload and relays apply verifyImageClean on receipt and reject non-clean images; neither side trusts the other, and relays never re-encode or substitute bytes because blobs are content-addressed (N9).

## Specification

_None._

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-080-09.T08 | integration | PS-080-05.R03, PS-080-07.R01 | client strips then relay verifies; send an unstripped image from a stub old client | clean upload stored with exactly the bytes whose hash is in the listing; the unstripped image is rejected with PRIVACY_METADATA_GPS_PRESENT, never re-encoded and never stored |
| TEST-PS-080-09.T09 | unit | PS-080-05.R01, PS-080-05.R02 | static analysis of imports | no network or storage access in the package |

## Dependencies

Module depends on: F10.S02.M02, CTR-PRV-001, CTR-FED-001, CTR-ID-001, CTR-ERR-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
