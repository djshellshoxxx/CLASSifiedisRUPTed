# F11.S01 — 01_protocol

**Status:** SPECIFIED. **Parent:** [F11](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F11.S01.M01 | [Portable record packaging](mod_portable/SPEC.md) | SPECIFIED | Map owned P0 records (listings, profiles, offerings) to/from envelope payloads with field allowlists. |
| F11.S01.M02 | [Federated records](mod_records/SPEC.md) | SPECIFIED | Envelope parse/verify/store as read-only mirrors with provenance (CTR-FED-001). |
| F11.S01.M03 | [Envelope signatures](mod_signatures/SPEC.md) | SPECIFIED | JCS canonicalization + Ed25519 sign/verify, did:key encode/decode, relay request signing. |

## Aggregation

Modules in this subfeature share the feature package `packages/federation` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| federation.block_rule.changed | F11.S03.M02 | F11.S01.M02 | external |
| federation.peer.suspended | F11.S03.M01 | F11.S01.M02 | external |
| federation.conflict.detected | F11.S02.M03 | F11.S01.M02 | external |
| federation.conflict.resolved | F11.S02.M03 | F11.S01.M02 | external |
| federation.account.moved | F11.S03.M03 | F11.S01.M02 | external |
| identity.portable_doc.published | F07.S02.M01 | F11.S01.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F11.S01.M02 | external |
| bazaar.listing.unpublished | F01.S01.M03 | F11.S01.M02 | external |
| bazaar.listing.expired | F01.S01.M04 | F11.S01.M02 | external |
| services.offering.withdrawn | F03.S01.M01 | F11.S01.M02 | external |
| platform.flag.changed | F15.S04.M02 | F11.S01.M02 | external |
