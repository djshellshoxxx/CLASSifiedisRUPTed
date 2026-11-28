# F13.S02 — 02_preferences

**Status:** SPECIFIED. **Parent:** [F13](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F13.S02.M01 | [Quiet-hours enforcement](mod_quiet/SPEC.md) | SPECIFIED | Defer push/email during quiet hours into a queue released at window end; urgent class (security) bypass. |
| F13.S02.M02 | [Quiet-hours schedule](mod_hours/SPEC.md) | SPECIFIED | Per-user schedule in IANA time zone with DST-correct evaluation (pure function isQuiet(at)). |
| F13.S02.M03 | [Channel opt-in/opt-out](mod_opt/SPEC.md) | SPECIFIED | Per-channel consent (push, email) linked to F10 privacy consent; one-click unsubscribe tokens. |
| F13.S02.M04 | [In-app notification preferences](mod_in/SPEC.md) | SPECIFIED | Per-category (offers, cycles, messages, auctions, bookings, moderation, security) × channel matrix; security always on in-app. |

## Aggregation

Modules in this subfeature share the feature package `packages/notify` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| notify.notification.read | F13.S01.M03 | F13.S02.M01 | external |
| notify.quiet_hours.changed | F13.S02.M02 | F13.S02.M01 | internal |
| notify.channel.opted_out | F13.S02.M03 | F13.S02.M01 | internal |
| notify.preference.changed | F13.S02.M04 | F13.S02.M01 | internal |
| privacy.deletion.requested | F10.S01.M04 | F13.S02.M01 | external |
| privacy.deletion.completed | F10.S01.M04 | F13.S02.M01 | external |
| notify.channel.opted_in | F13.S02.M03 | F13.S02.M02 | internal |
| notify.channel.opted_out | F13.S02.M03 | F13.S02.M02 | internal |
| security.key.revoked | F16.S02.M02 | F13.S02.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F13.S02.M02 | external |
| privacy.consent.withdrawn | F10.S01.M01 | F13.S02.M03 | external |
| privacy.consent.granted | F10.S01.M01 | F13.S02.M03 | external |
| privacy.deletion.requested | F10.S01.M04 | F13.S02.M03 | external |
| privacy.deletion.completed | F10.S01.M04 | F13.S02.M03 | external |
| notify.channel.opted_in | F13.S02.M03 | F13.S02.M04 | internal |
| notify.channel.opted_out | F13.S02.M03 | F13.S02.M04 | internal |
| security.key.revoked | F16.S02.M02 | F13.S02.M04 | external |
| privacy.deletion.completed | F10.S01.M04 | F13.S02.M04 | external |
