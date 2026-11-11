# PS-083-04 — Commands, queries and events: Portable record packaging

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M01 Portable record packaging](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/portable` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-083-04.R01** The module exposes TypeScript functions only and no network commands or queries.
- **PS-083-04.R02** Functions return Result<T, AppError> and never include rejected field values in error params.
- **PS-083-04.R03** The module emits no events; draft building is a local pure step.
- **PS-083-04.R04** F11's own statement types and their signer roles are listed in the registry table of the domain schema (N2); other modules contribute entries for their own types, and every entry has an audience, signer role, role resolution, payload schema and maximum age.

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
| FEDERATION_NOT_OPTED_IN | 403 | no | the owner has not enabled federation for this public record |
| FEDERATION_EXPORT_FORBIDDEN_FIELD | 422 | no | the record contains a field or precision that must not be exported |
| FEDERATION_PAYLOAD_INVALID | 422 | no | inbound payload has unknown members, wrong types, a location finer than L2 or coordinates, or exceeds string limits |
| FEDERATION_SIGNER_ROLE_INVALID | 422 | no | the type is unregistered or the signer key does not hold the role the type requires; the statement is quarantined |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** API: buildDraft(record, now) -> UnsignedDraft (no seq or prev; F11.S01.M02 allocates them); previewDraft(record) -> {fields[], excluded[]}; toMirrorView(verifiedEnvelope) -> MirrorView; allowlistFor(type) -> string[]; validateInbound(envelope) -> Result<void> (V06, V07, V09, V11); registryEntry(type) -> {audience, signerRole, roleResolution, payloadSchema, subjectKey?, commitment?, maxAge} or none; roleFor(type, context, resolvers{portableDoc, pinnedRelayKey}) -> RoleRule used by F11.S01.M02 V14; subjectKeyOf(type, payload) -> string or none; conflictsWith(a, b) -> boolean (commitment predicate); maxAgeOf(type) -> ms or none. StatementPublisherPort { publish({type, audience, payload, recipients[{did, mailboxId}]}) -> {cid, seq, chainKey}; issueTombstone({targetCid?, targetRecordKey?, reason}) -> {tombstoneCid} } is implemented by F11.S01.M02. Participant-audience statements are encrypted by their source modules and only shape-checked, never mapped, here.

### Example

```
buildDraft({ type: "classrup.bazaar.listing/v1", id: "0192f3a4-...", title: "Road bike", geohash: "u33dbcx", federate: true }, now)
-> { v: 1, type: "classrup.bazaar.listing/v1", author: "did:key:z6MkRoot...", createdAt: "2026-11-04T10:00:00.000Z", payload: { id: "0192f3a4-...", title: "Road bike", region: { geohash: "u33db", level: "L2" } }, ext: { stream: "pub", audience: "public" } }
roleFor("classrup.federation.peer_accept/v1", { author: "did:key:z6MkUserDevice..." }, resolvers) -> { ok: false, code: "FEDERATION_SIGNER_ROLE_INVALID" }  // user key cannot hold a relay role
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-083-09.T07 | contract | PS-083-03.R01, PS-083-03.R02, PS-083-04.R01, PS-083-04.R02 | exercise each exported function | signatures and Result shapes match the schema registry; error params contain no values; toMirrorView refuses envelopes that F11.S01.M02 has not stored |
| TEST-PS-083-09.T08 | unit | PS-083-03.R03, PS-083-04.R03, PS-083-05.R01 | inspect module for event emission, stored lifecycle state and authorization calls | none present |
| TEST-PS-083-09.T16 | unit | PS-083-01.R04, PS-083-04.R04 | roleFor for every registry row (three portable types and every F11 type) with the correct signer and with a wrong signer of the same key class | correct signer resolves its role; wrong signer yields a rule that makes F11.S01.M02 quarantine; every row has audience, role, resolution, schema and maxAge |

## Dependencies

Module depends on: F06.S02.M01, F10.S02.M02, CTR-FED-001, CTR-PRV-001, CTR-ERR-001, CTR-SCH-001, CTR-TST-001, CTR-ID-001. Predecessor: [domain_schema.md](domain_schema.md).
