# PS-081-09 — Contract and acceptance tests: Data classification model

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S02.M02 Data classification model](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/security_boundaries/model` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-081-09.R01** Every requirement is covered by at least one automated test.
- **PS-081-09.R02** The sink matrix of this spec, which refines CTR-PRV-001, is tested exhaustively for all class and sink pairs.
- **PS-081-09.R03** Property and fuzz tests cover nesting, arrays and unknown paths.

## Specification

See the module test table below (all processes).

**Fixtures:** Schemas with fields of every class P0 to P4 and one unannotated field, locations at L0 to L4, nested records, and a fake PII corpus of emails, phones and addresses.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-081-09.T01 | unit | PS-081-01.R01, PS-081-01.R02, PS-081-02.R01 | load a classification map for a schema and check every field | all paths classified; a missing path raises PRIVACY_CLASSIFICATION_MISSING |
| TEST-PS-081-09.T02 | unit | PS-081-01.R03, PS-081-02.R02 | unannotated field in a record redacted for each of the 11 sinks | treated as P4 and dropped from every sink, including export and ui_owner |
| TEST-PS-081-09.T03 | unit | PS-081-01.R04, PS-081-02.R02, PS-081-03.R02 | full class by sink matrix (5 classes by 11 sinks) and the location cap per sink | every result equals the matrix in the domain_schema note; P4 denied everywhere; P3 only to event, export and ui_owner |
| TEST-PS-081-09.T04 | unit | PS-081-02.R03 | locations L0 to L4 for public sinks | L3 and L4 snapped to L2 cell or refused with PRIVACY_LOCATION_TOO_PRECISE; L0 to L2 pass |
| TEST-PS-081-09.T05 | property | PS-081-03.R01, PS-081-03.R02, PS-081-06.R01 | random records and schemas | redaction is pure, idempotent and monotonic; class order is total |
| TEST-PS-081-09.T06 | property | PS-081-02.R01, PS-081-06.R03 | random nested structures with unknown paths | unknown paths default to P4 and never appear in any sink output |
| TEST-PS-081-09.T07 | contract | PS-081-04.R01, PS-081-04.R02, PS-081-09.R02 | run the public API surface through the contract checker | signatures and error codes match the errors table |
| TEST-PS-081-09.T08 | unit | PS-081-04.R03, PS-081-02.R02 | assertSinkSafe on a module test with an unsafe value | assertion fails with path list and no values in the message |
| TEST-PS-081-09.T09 | unit | PS-081-05.R01, PS-081-05.R02, PS-081-05.R03 | static analysis of imports and call graph | no fetch, fs, Date or Math.random; default sink is public log |
| TEST-PS-081-09.T10 | abuse | PS-081-07.R03, PS-081-07.R01 | 40-level nesting and 5 MiB record | rejected within 1 ms; no values logged |
| TEST-PS-081-09.T11 | unit | PS-081-06.R02, PS-081-07.R02 | classification map missing for a schema | fail closed with all fields P4; redactForExport refuses with PRIVACY_CLASSIFICATION_MISSING |
| TEST-PS-081-09.T12 | integration | PS-081-07.R02 | CI lint on the repository schemas | fails for an injected unannotated field and an event class below its max field class; passes otherwise |
| TEST-PS-081-09.T13 | load | PS-081-08.R01, PS-081-08.R02, PS-081-08.R03 | 10 000 redactions of 50-field records and bundle size check | p99 ≤ 0.2 ms and gzip ≤ 8 KiB |
| TEST-PS-081-09.T14 | unit | PS-081-09.R01, PS-081-09.R03 | traceability tool run | every PS-081 requirement maps to a passing test |
| TEST-PS-081-09.T15 | unit | PS-081-10.R01, PS-081-10.R02, PS-081-10.R03, PS-081-03.R03 | load v1 maps and a v2 candidate with an added class or sink | v1 maps load; an added class or sink requires the major version flag |
| TEST-PS-081-09.T16 | unit | PS-081-01.R03 | redactForExport on records with an unannotated field, a field from a newer schema version and a P4 key field | none of those paths appears in any redactForExport result |
| TEST-PS-081-09.T17 | unit | PS-081-02.R04, PS-081-02.R02 | redactForEnvelope with a P2 field and encrypted false, encrypted true with no recipients, encrypted true with recipients; a P3 field; redactForEvent with a P4 field and an L4 location; redactForSearch with an L3 location and a P1 field | refused, refused, allowed; P3 refused; P4 and L4 refused for events; search snaps to L2 and drops the P1 field |

## Acceptance criteria

- Every schema field in the repository has a classification and CI reports 0 unclassified fields.
- The full class by sink matrix test passes and matches the matrix in this spec.
- No public, search, federation or notification payload in tests contains a location finer than L2 or any P3 or P4 field, and no event carries P4 or L4.

## Dependencies

Module depends on: CTR-PRV-001, CTR-EVT-001, CTR-FED-001, CTR-ERR-001, CTR-IOX-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
