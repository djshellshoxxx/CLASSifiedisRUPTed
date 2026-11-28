# F08.S03 — 03_meetups

**Status:** SPECIFIED. **Parent:** [F08](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F08.S03.M01 | [Safe meetup guidance](mod_safe/SPEC.md) | SPECIFIED | Operator-curated public meetup spots per L2 cell (police stations, malls) and safety checklist; no user location stored. |
| F08.S03.M02 | [Meetup handoff check-in](mod_handoff/SPEC.md) | SPECIFIED | Both-party check-in at agreed time window, no-show reporting, optional trusted-contact share link (user-initiated). |
| F08.S03.M03 | [Meetup coordination](mod_coordination/SPEC.md) | SPECIFIED | Propose time windows and place (safe spot or L3 area), agreement by both, reschedule limit 5. |

## Aggregation

Modules in this subfeature share the feature package `packages/comms` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| security.role.assigned | F16.S01.M01 | F08.S03.M01 | external |
| security.role.revoked | F16.S01.M01 | F08.S03.M01 | external |
| comms.meetup.agreed | F08.S03.M03 | F08.S03.M02 | internal |
| comms.meetup.cancelled | F08.S03.M03 | F08.S03.M02 | internal |
| comms.meetup.proposed | F08.S03.M03 | F08.S03.M02 | internal |
| identity.block.added | F07.S02.M02 | F08.S03.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F08.S03.M02 | external |
| comms.consent.received | F08.S02.M02 | F08.S03.M03 | external |
| comms.consent.revoked | F08.S02.M02 | F08.S03.M03 | external |
| comms.thread.archived | F08.S01.M02 | F08.S03.M03 | external |
| identity.block.added | F07.S02.M02 | F08.S03.M03 | external |
| mutiny.cycle.cancelled | F02.S03.M03 | F08.S03.M03 | external |
| services.booking.cancelled | F03.S02.M01 | F08.S03.M03 | external |
| rentals.reservation.cancelled | F05.S01.M01 | F08.S03.M03 | external |
| privacy.deletion.completed | F10.S01.M04 | F08.S03.M03 | external |
