# PS-083-05 — Authorization and capabilities: Portable record packaging

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M01 Portable record packaging](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/portable` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-083-05.R01** The library performs no authorization; callers (listing publication, profile settings, delivery) decide who may federate which record.
- **PS-083-05.R02** The opt-in flag is read from the source record at draft time and re-checked by F11.S01.M02 at ingest of local envelopes.
- **PS-083-05.R03** Mirror views contain only P0 data and may be shown to anonymous readers when the tenant has public browse enabled.

## Specification

_None._

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-083-09.T08 | unit | PS-083-04.R03, PS-083-05.R01 | inspect module for event emission and authorization calls | none present; opt-in read happens at build time |
| TEST-PS-083-09.T09 | integration | PS-083-03.R03, PS-083-05.R02, PS-083-05.R03 | draft then sign then ingest then toMirrorView | mirror view equals source P0 fields, labelled remote, no private fields |

## Dependencies

Module depends on: F10.S02.M02, CTR-FED-001, CTR-PRV-001, CTR-ERR-001, CTR-SCH-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
