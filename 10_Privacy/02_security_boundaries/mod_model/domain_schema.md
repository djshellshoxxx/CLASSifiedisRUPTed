# PS-081-01 — Domain schema: Data classification model

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S02.M02 Data classification model](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/security_boundaries/model` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-081-01.R01** The library defines the value types PrivacyClass, LocationLevel, Sink, ClassificationMap and RedactionStrategy and no persistent entities.
- **PS-081-01.R02** A ClassificationMap assigns a class to every field path of a schema, with optional location level, and is stored beside the schema in the registry as part of its version.
- **PS-081-01.R03** The default class for any unannotated or unknown path is P4, which is denied for every sink including export and ui_owner, so an unclassified field never appears in any output.
- **PS-081-01.R04** The class-by-sink matrix in the note, covering 5 classes by 11 sinks plus a location cap per sink, is the normative oracle for canFlow and every redaction helper.

## Specification

**Note:** Library module with no persistent entity. Value types - PrivacyClass P0..P4, LocationLevel L0..L4, Sink (log, event, federation, notification, projection, search, participant_envelope, export, ui_public, ui_participant, ui_owner), ClassificationMap {schema, fields: path to {class, level?, redact?: drop|hash|truncate|snap}} and RedactionResult {value, dropped: path[], refused?: boolean}. Sink matrix (A allow, I IDs only, X allow with other users' data excluded, E allow only when the envelope is encrypted to its listed recipients, D deny). P0 - log A, event A, federation A (only when the owner opted in, FED-1), notification A, projection A, search A, participant_envelope A, export A, ui_public A, ui_participant A, ui_owner A. P1 - log I, event A, federation D, notification D, projection D, search D, participant_envelope E, export A, ui_public D, ui_participant A, ui_owner A. P2 - log I, event A (vault-local, EVT-8), federation D, notification D, projection D, search D, participant_envelope E, export X, ui_public D, ui_participant A, ui_owner A. P3 - log D, event A (vault-local only, EVT-8), federation D, notification D, projection D, search D, participant_envelope D, export X, ui_public D, ui_participant D, ui_owner A. P4 and unclassified - D for every sink. Location cap per sink - log L2, event L3 (L4 refused, EVT-5), federation L2, notification L2, projection L2, search L2, participant_envelope L4 only for a user-initiated share (F06.S02.M02) and L3 otherwise, export L4 for the owner's own records, ui_public L2, ui_participant L3, ui_owner L4.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-081-09.T01 | unit | PS-081-01.R01, PS-081-01.R02, PS-081-02.R01 | load a classification map for a schema and check every field | all paths classified; a missing path raises PRIVACY_CLASSIFICATION_MISSING |
| TEST-PS-081-09.T02 | unit | PS-081-01.R03, PS-081-02.R02 | unannotated field in a record redacted for each of the 11 sinks | treated as P4 and dropped from every sink, including export and ui_owner |
| TEST-PS-081-09.T03 | unit | PS-081-01.R04, PS-081-02.R02, PS-081-03.R02 | full class by sink matrix (5 classes by 11 sinks) and the location cap per sink | every result equals the matrix in the domain_schema note; P4 denied everywhere; P3 only to event, export and ui_owner |
| TEST-PS-081-09.T16 | unit | PS-081-01.R03 | redactForExport on records with an unannotated field, a field from a newer schema version and a P4 key field | none of those paths appears in any redactForExport result |

## Dependencies

Module depends on: CTR-PRV-001, CTR-EVT-001, CTR-FED-001, CTR-ERR-001, CTR-IOX-001, CTR-OBS-001, CTR-TST-001. Predecessor: [module SPEC](SPEC.md).
