# F11.S02 — 02_relay_sync

**Status:** SPECIFIED. **Parent:** [F11](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F11.S02.M01 | [Relay delivery](mod_delivery/SPEC.md) | SPECIFIED | Push batches to peers with retries/backoff, per-peer quotas, pull catch-up by cursor. |
| F11.S02.M02 | [Federated dedup](mod_dedup/SPEC.md) | SPECIFIED | cid dedup, seq/prev chain ordering, gap buffering 24 h. |
| F11.S02.M03 | [Federated conflicts](mod_conflicts/SPEC.md) | SPECIFIED | Fork detection (two envelopes same author/seq), origin-wins policy, quarantine and operator review. |

## Aggregation

Modules in this subfeature share the feature package `packages/federation` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| federation.record.accepted | F11.S01.M02 | F11.S02.M01 | external |
| federation.tombstone.applied | F11.S01.M02 | F11.S02.M01 | external |
| federation.peer.added | F11.S03.M01 | F11.S02.M01 | external |
| federation.peer.suspended | F11.S03.M01 | F11.S02.M01 | external |
| federation.peer.reinstated | F11.S03.M01 | F11.S02.M01 | external |
| federation.peer.removed | F11.S03.M01 | F11.S02.M01 | external |
| federation.account.moved | F11.S03.M03 | F11.S02.M01 | external |
| identity.portable_doc.published | F07.S02.M01 | F11.S02.M01 | external |
| privacy.consent.withdrawn | F10.S01.M01 | F11.S02.M01 | external |
| platform.flag.changed | F15.S04.M02 | F11.S02.M01 | external |
| federation.account.moved | F11.S03.M03 | F11.S02.M03 | external |
| identity.portable_doc.published | F07.S02.M01 | F11.S02.M03 | external |
| federation.peer.suspended | F11.S03.M01 | F11.S02.M03 | external |
| privacy.deletion.completed | F10.S01.M04 | F11.S02.M03 | external |
