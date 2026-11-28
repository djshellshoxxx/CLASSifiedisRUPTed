# F07.S02 — 02_profiles

**Status:** SPECIFIED. **Parent:** [F07](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F07.S02.M01 | [Portable identity](mod_portable/SPEC.md) | SPECIFIED | did:key-based identity document listing device keys and relay home; signed; used by F11 federation and account migration. |
| F07.S02.M02 | [Profiles](mod_profiles/SPEC.md) | SPECIFIED | Public profile (pseudonym, avatar, bio, L1/L2 region), visibility per field, block list (P3) enforced platform-wide. |

## Aggregation

Modules in this subfeature share the feature package `packages/identity` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| identity.device_key.added | F07.S01.M01 | F07.S02.M01 | external |
| identity.device_key.revoked | F07.S01.M01 | F07.S02.M01 | external |
| identity.pseudonym.changed | F07.S01.M01 | F07.S02.M01 | external |
| privacy.deletion.completed | F10.S01.M04 | F07.S02.M01 | external |
| identity.account.created | F07.S01.M01 | F07.S02.M02 | external |
| identity.pseudonym.changed | F07.S01.M01 | F07.S02.M02 | external |
| discovery.location.updated | F06.S02.M02 | F07.S02.M02 | external |
| identity.portable_doc.published | F07.S02.M01 | F07.S02.M02 | internal |
| moderation.action.applied | F12.S02.M01 | F07.S02.M02 | external |
| moderation.action.reverted | F12.S02.M01 | F07.S02.M02 | external |
| federation.tombstone.applied | F11.S01.M02 | F07.S02.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F07.S02.M02 | external |
