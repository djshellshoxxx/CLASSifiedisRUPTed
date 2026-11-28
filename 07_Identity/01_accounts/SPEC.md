# F07.S01 — 01_accounts

**Status:** SPECIFIED. **Parent:** [F07](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F07.S01.M01 | [Pseudonymous accounts](mod_pseudonyms/SPEC.md) | SPECIFIED | Account creation with user-chosen pseudonym (unique per tenant, 3..32 chars, confusable check), device key registration, pseudonym change cooldown 30 days. |
| F07.S01.M02 | [Sessions](mod_sessions/SPEC.md) | SPECIFIED | Challenge-response login, opaque tokens hashed at rest, idle/absolute expiry, list and revoke sessions (CTR-CAP-001). |
| F07.S01.M03 | [Account recovery](mod_recovery/SPEC.md) | SPECIFIED | Recovery kit: encrypted recovery key blob + verifier; recovery adds a new device key and revokes others on request; rate limited; 72 h notification delay to existing devices. |

## Aggregation

Modules in this subfeature share the feature package `packages/identity` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| privacy.deletion.completed | F10.S01.M04 | F07.S01.M01 | external |
| identity.device_key.revoked | F07.S01.M01 | F07.S01.M02 | internal |
| identity.recovery.completed | F07.S01.M03 | F07.S01.M02 | internal |
| identity.portable_doc.published | F07.S02.M01 | F07.S01.M02 | external |
| security.role.assigned | F16.S01.M01 | F07.S01.M02 | external |
| security.role.revoked | F16.S01.M01 | F07.S01.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F07.S01.M02 | external |
| identity.portable_doc.published | F07.S02.M01 | F07.S01.M03 | external |
| privacy.deletion.completed | F10.S01.M04 | F07.S01.M03 | external |
