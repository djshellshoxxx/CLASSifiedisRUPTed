# PS-081-10 — Import, export, backup and rollback: Data classification model

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S02.M02 Data classification model](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/security_boundaries/model` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-081-10.R01** Classification maps ship inside the schema registry and are part of each release; they hold no user data.
- **PS-081-10.R02** The export helper redactForExport is used by the export orchestrator to exclude P4, unclassified paths and other users' P2 and higher content.
- **PS-081-10.R03** A change to a field's class is a schema version change and is reviewed as a privacy change.

## Specification

- **export:** No user data. redactForExport(record, schema, ctx) is the library entry the export orchestrator (F10.S01.M03) calls per record; it drops P4 and unclassified paths and refuses records whose schema has no map.
- **import:** Imported records are re-classified by the current maps on arrival; fields without a current classification are held as P4 and never emitted to any sink until a map classifies them.
- **backup:** Maps are versioned with the repository; no runtime storage.
- **migration rollback:** Lowering a field's class requires a major schema version and a privacy review; raising a class is allowed in a minor version. Rollback pins the previous library and map set together.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-081-09.T15 | unit | PS-081-10.R01, PS-081-10.R02, PS-081-10.R03, PS-081-03.R03 | load v1 maps and a v2 candidate with an added class or sink | v1 maps load; an added class or sink requires the major version flag |

## Dependencies

Module depends on: CTR-PRV-001, CTR-EVT-001, CTR-FED-001, CTR-ERR-001, CTR-IOX-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
