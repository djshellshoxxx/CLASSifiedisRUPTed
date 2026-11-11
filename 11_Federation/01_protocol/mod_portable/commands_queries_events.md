# PS-083-04 — Commands, queries and events: Portable record packaging

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M01 Portable record packaging](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/portable` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-083-04.R01** The module exposes TypeScript functions only and no network commands or queries.
- **PS-083-04.R02** Functions return Result<T, AppError> and never include rejected field values in error params.
- **PS-083-04.R03** The module emits no events; draft building is a local pure step.

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
| FEDERATION_NOT_OPTED_IN | 403 | no | the owner has not enabled federation for this record |
| FEDERATION_EXPORT_FORBIDDEN_FIELD | 422 | no | the record contains a field or precision that must not be exported |
| FEDERATION_PAYLOAD_INVALID | 422 | no | inbound payload has unknown members, wrong types or exceeds string limits |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** API: buildDraft(record, head{seq,prev}, now) -> UnsignedEnvelope; previewDraft(record) -> {fields[], excluded[]}; toMirrorView(verifiedEnvelope) -> MirrorView; allowlistFor(type) -> string[]; roleFor(type, context) -> RoleRule (signer role resolver used by F11.S01.M02 V14). Participant-audience statements are encrypted by their source modules and only wrapped, never mapped, here.

### Example

```
buildDraft({ type: "classrup.bazaar.listing/v1", id: "0192f3a4-...", title: "Road bike", geohash: "u33db", federate: true }, { seq: 4, prev: "sha256-9fQ..." }, now)
-> { v: 1, type: "classrup.bazaar.listing/v1", author: "did:key:z6Mk...", createdAt: "2026-11-04T10:00:00.000Z", seq: 5, prev: "sha256-9fQ...", payload: { id: "0192f3a4-...", title: "Road bike", region: { geohash: "u33db", level: "L2" } }, ext: {} }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-083-09.T07 | contract | PS-083-03.R01, PS-083-03.R02, PS-083-04.R01, PS-083-04.R02 | exercise each exported function | signatures and Result shapes match the schema registry; error params contain no values |
| TEST-PS-083-09.T08 | unit | PS-083-04.R03, PS-083-05.R01 | inspect module for event emission and authorization calls | none present; opt-in read happens at build time |

## Dependencies

Module depends on: F10.S02.M02, CTR-FED-001, CTR-PRV-001, CTR-ERR-001, CTR-SCH-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
