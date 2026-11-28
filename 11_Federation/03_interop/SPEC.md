# F11.S03 — 03_interop

**Status:** SPECIFIED. **Parent:** [F11](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F11.S03.M01 | [Peer trust](mod_trust/SPEC.md) | SPECIFIED | Allowlisted peers with keys, quotas, trust level, health score; opt-in both sides. |
| F11.S03.M02 | [Federation blocklists](mod_blocklists/SPEC.md) | SPECIFIED | Block by peer, author did, cid, or content hash list; import of shared blocklists requires operator review. |
| F11.S03.M03 | [Account and relay migration](mod_migration/SPEC.md) | SPECIFIED | Signed move record to new home relay, redirect, export/import coupling; ActivityPub/AT bridges documented as FUTURE. |

## Aggregation

Modules in this subfeature share the feature package `packages/federation` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| federation.record.rejected | F11.S01.M02 | F11.S03.M01 | external |
| federation.conflict.detected | F11.S02.M03 | F11.S03.M01 | external |
| federation.delivery.failed | F11.S02.M01 | F11.S03.M01 | external |
| platform.flag.changed | F15.S04.M02 | F11.S03.M01 | external |
| privacy.deletion.completed | F10.S01.M04 | F11.S03.M01 | external |
| identity.block.added | F07.S02.M02 | F11.S03.M02 | external |
| identity.block.removed | F07.S02.M02 | F11.S03.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F11.S03.M02 | external |
| identity.portable_doc.published | F07.S02.M01 | F11.S03.M03 | external |
| identity.device_key.revoked | F07.S01.M01 | F11.S03.M03 | external |
| federation.delivery.failed | F11.S02.M01 | F11.S03.M03 | external |
| federation.conflict.detected | F11.S02.M03 | F11.S03.M03 | external |
| federation.conflict.resolved | F11.S02.M03 | F11.S03.M03 | external |
| privacy.deletion.requested | F10.S01.M04 | F11.S03.M03 | external |
| privacy.deletion.cancelled | F10.S01.M04 | F11.S03.M03 | external |
| privacy.deletion.completed | F10.S01.M04 | F11.S03.M03 | external |
