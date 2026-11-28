# F10.S01 — 01_data_controls

**Status:** SPECIFIED. **Parent:** [F10](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F10.S01.M01 | [Privacy consent](mod_consent/SPEC.md) | SPECIFIED | Purpose-based consents (federation, notifications email/push, analytics none-by-default, precise location sharing) with versioned policy text hash. |
| F10.S01.M02 | [Retention and legal hold](mod_retention/SPEC.md) | SPECIFIED | Retention class enforcement sweeps, jurisdiction overrides, legal hold with two-person approval. |
| F10.S01.M03 | [Data export](mod_export/SPEC.md) | SPECIFIED | Orchestrate per-module export sections into classrup-export/v1 bundle (CTR-IOX-001), signed, expiring download (7 days). |
| F10.S01.M04 | [Account and data deletion](mod_delete/SPEC.md) | SPECIFIED | Deletion with 14-day grace, tombstones, crypto-shred, federation tombstone propagation, evidence retained per RET-EVIDENCE pseudonymized. |

## Aggregation

Modules in this subfeature share the feature package `packages/privacy` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| notify.channel.opted_out | F13.S02.M03 | F10.S01.M01 | external |
| security.role.revoked | F16.S01.M01 | F10.S01.M02 | external |
| platform.tenant.configured | F15.S04.M03 | F10.S01.M02 | external |
| governance.jurisdiction_profile.activated | F18.S01.M01 | F10.S01.M02 | external |
| federation.tombstone.applied | F11.S01.M02 | F10.S01.M02 | external |
| privacy.deletion.requested | F10.S01.M04 | F10.S01.M03 | internal |
| privacy.deletion.completed | F10.S01.M04 | F10.S01.M03 | internal |
| identity.device_key.revoked | F07.S01.M01 | F10.S01.M03 | external |
| mutiny.cycle.completed | F02.S03.M04 | F10.S01.M04 | external |
| mutiny.cycle.cancelled | F02.S03.M03 | F10.S01.M04 | external |
| commerce.deal.completed | F09.S01.M01 | F10.S01.M04 | external |
| commerce.deal.cancelled | F09.S01.M01 | F10.S01.M04 | external |
| commerce.dispute.resolved | F09.S02.M02 | F10.S01.M04 | external |
| rentals.rental.closed | F05.S02.M02 | F10.S01.M04 | external |
| rentals.reservation.cancelled | F05.S01.M01 | F10.S01.M04 | external |
| services.booking.completed | F03.S02.M02 | F10.S01.M04 | external |
| services.booking.cancelled | F03.S02.M01 | F10.S01.M04 | external |
