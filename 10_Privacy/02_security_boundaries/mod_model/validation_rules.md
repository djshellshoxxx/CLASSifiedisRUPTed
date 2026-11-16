# PS-081-02 — Validation rules: Data classification model

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S02.M02 Data classification model](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/security_boundaries/model` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-081-02.R01** Classification maps are validated against the schema's fields so every path is covered and no path refers to a missing field.
- **PS-081-02.R02** Redaction refuses outputs that would carry a class above what the sink allows.
- **PS-081-02.R03** Location handling validates the geohash cell precision and never accepts coordinates for public sinks.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | every schema field path has an entry in the ClassificationMap | PRIVACY_CLASSIFICATION_MISSING |
| V02 | the class of an event payload is at least the maximum class of its fields | PRIVACY_CLASSIFICATION_MISSING |
| V03 | a field with class P3 or P4 is never emitted to log, federation, notification or projection sinks | PRIVACY_SINK_FORBIDDEN |
| V04 | locations in public, search, federation or notification payloads have level at most L2 | PRIVACY_LOCATION_TOO_PRECISE |
| V05 | P2 fields are only emitted inside end-to-end encrypted participant envelopes or to the owner | PRIVACY_SINK_FORBIDDEN |
| V06 | a ClassificationMap contains no path that is absent from the schema | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-081-09.T01 | unit | PS-081-01.R01, PS-081-01.R02, PS-081-02.R01 | load a classification map for a schema and check every field | all paths classified; a missing path raises PRIVACY_CLASSIFICATION_MISSING |
| TEST-PS-081-09.T02 | unit | PS-081-01.R03, PS-081-02.R02 | unannotated field in a record redacted for each sink | treated as P3 and dropped from every non-owner sink |
| TEST-PS-081-09.T03 | unit | PS-081-02.R02, PS-081-03.R02 | full class by sink matrix (5 classes by 9 sinks) | result equals the PRV-001 table; P3 and P4 never allowed to log, federation, notification, projection |
| TEST-PS-081-09.T04 | unit | PS-081-02.R03, PS-081-03.R03 | locations L0 to L4 for public sinks | L3 and L4 snapped to L2 cell or refused with PRIVACY_LOCATION_TOO_PRECISE; L0 to L2 pass |
| TEST-PS-081-09.T06 | property | PS-081-02.R01, PS-081-06.R03 | random nested structures with unknown paths | unknown paths default to P3 and never appear in public sinks |
| TEST-PS-081-09.T08 | unit | PS-081-04.R03, PS-081-02.R02 | assertSinkSafe on a module test with an unsafe value | assertion fails with path list and no values in the message |

## Dependencies

Module depends on: CTR-PRV-001, CTR-EVT-001, CTR-FED-001, CTR-ERR-001, CTR-IOX-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
