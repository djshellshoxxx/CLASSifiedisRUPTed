# F10.S02 — 02_security_boundaries

**Status:** SPECIFIED. **Parent:** [F10](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F10.S02.M01 | [Privacy threat model](mod_threat/SPEC.md) | SPECIFIED | Living threat model (geolocation, metadata, Sybil, graph deanonymization, relay compromise) with mapped controls and privacy test suite IDs. |
| F10.S02.M02 | [Data classification model](mod_model/SPEC.md) | SPECIFIED | P0–P4 and L0–L4 types, field-level classification annotations, redaction helpers used by logs/events/federation/export. |
| F10.S02.M03 | [Metadata minimization](mod_metadata/SPEC.md) | SPECIFIED | EXIF/GPS stripping, IP truncation, timestamp coarsening for public views (to the hour), referrer/analytics minimization; verification checks. |

## Aggregation

Modules in this subfeature share the feature package `packages/privacy` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

_None._
