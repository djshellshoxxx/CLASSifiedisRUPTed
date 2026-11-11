# PS-081-01 — Domain schema: Data classification model

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S02.M02 Data classification model](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/security_boundaries/model` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-081-01.R01** The library defines the value types PrivacyClass, LocationLevel, Sink, ClassificationMap and RedactionStrategy and no persistent entities.
- **PS-081-01.R02** A ClassificationMap assigns a class to every field path of a schema, with optional location level, and is stored beside the schema in the registry as part of its version.
- **PS-081-01.R03** The default class for any unannotated path is P3 and the default sink decision for P3 and P4 is deny.

## Specification

**Note:** Library module with no persistent entity. Value types are PrivacyClass P0..P4, LocationLevel L0..L4, Sink (log, event, federation, notification, projection, export, ui_public, ui_participant, ui_owner), ClassificationMap {schema, fields: path to {class, level?, redact?: drop|hash|truncate|snap}} and RedactionResult {value, dropped: path[], refused?: boolean}.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-081-09.T01 | unit | PS-081-01.R01, PS-081-01.R02, PS-081-02.R01 | load a classification map for a schema and check every field | all paths classified; a missing path raises PRIVACY_CLASSIFICATION_MISSING |
| TEST-PS-081-09.T02 | unit | PS-081-01.R03, PS-081-02.R02 | unannotated field in a record redacted for each sink | treated as P3 and dropped from every non-owner sink |

## Dependencies

Module depends on: CTR-PRV-001, CTR-EVT-001, CTR-FED-001, CTR-ERR-001, CTR-IOX-001, CTR-OBS-001, CTR-TST-001. Predecessor: [module SPEC](SPEC.md).
