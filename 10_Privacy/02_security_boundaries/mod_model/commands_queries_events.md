# PS-081-04 — Commands, queries and events: Data classification model

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S02.M02 Data classification model](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/security_boundaries/model` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-081-04.R01** The public surface is the TypeScript package; there are no relay or vault commands, queries or events.
- **PS-081-04.R02** Errors are returned as Result values with the codes in the errors table, and logging the redaction summary uses only counts and paths.
- **PS-081-04.R03** The package exposes a test helper assertSinkSafe(value, schema, sink) for module tests.

## Specification

### Commands

_None._

### Queries

_None._

### Events produced

_None._

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| PRIVACY_CLASSIFICATION_MISSING | 500 | no | a schema field or event payload lacks a classification; build fails and runtime treats the field as P3 |
| PRIVACY_SINK_FORBIDDEN | 403 | no | the data class is not allowed to flow to this sink |
| PRIVACY_LOCATION_TOO_PRECISE | 422 | no | location precision is finer than L2 for a public sink |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Library module. Package surface (packages/privacy/src/security_boundaries/model): classOf(path, map), maxClass(a, b), canFlow(cls, sink), capLocation(level, sink), redactForLog / redactForEvent / redactForFederation / redactForNotification / redactForProjection / redactForExport(record, schema, ctx), labelKey(cls), loadClassification(schemaId), assertSinkSafe(value, schema, sink). No relay or vault commands, no events.

### Example

```
redactForLog({ id: "0192…", title: "Bike", address: "Main St 4", note: "mail me a@b.example" }, schema "classrup.bazaar.listing/v1", ctx)
=> { id: "0192…", title: "Bike", address: "[redacted:P3]", note: "mail me [email]" } with dropped ["address"]
redactForFederation({ …, location: { lat: 52.5208, lon: 13.4095 } }) => location snapped to geohash5 "u336y" (L2) or refused if opt-in is missing
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-081-09.T07 | contract | PS-081-04.R01, PS-081-04.R02, PS-081-09.R02 | run the public API surface through the contract checker | signatures and error codes match the errors table |
| TEST-PS-081-09.T08 | unit | PS-081-04.R03, PS-081-02.R02 | assertSinkSafe on a module test with an unsafe value | assertion fails with path list and no values in the message |

## Dependencies

Module depends on: CTR-PRV-001, CTR-EVT-001, CTR-FED-001, CTR-ERR-001, CTR-IOX-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
