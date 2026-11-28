# F09 — Commerce and evidence

**Status:** SPECIFIED. **Parent:** [ClassRup](../PROJECT_SPEC.md). **Package slug:** `commerce`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Subfeatures

- [F09.S01 01_payments](01_payments/SPEC.md) — 3 modules
- [F09.S02 02_settlement](02_settlement/SPEC.md) — 3 modules
- [F09.S03 03_valuation](03_valuation/SPEC.md) — 3 modules

## Aggregation

The feature is enabled by flag `F09` (CTR-FLG-001); each module can be disabled independently when no enabled module depends on it. Upstream features: F07, F10, F11, F15, F16, F18.

### Cross-subfeature and external events

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| commerce.dispute.opened | F09.S02.M02 | F09.S01.M01 | internal |
| commerce.dispute.resolved | F09.S02.M02 | F09.S01.M01 | internal |
| commerce.dispute.withdrawn | F09.S02.M02 | F09.S01.M01 | internal |
| privacy.deletion.completed | F10.S01.M04 | F09.S01.M01 | external |
| bazaar.inventory.conflict_detected | F01.S03.M01 | F09.S01.M01 | external |
| privacy.deletion.completed | F10.S01.M04 | F09.S01.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F09.S01.M03 | external |
| commerce.payment.acknowledged | F09.S01.M01 | F09.S02.M01 | internal |
| commerce.payment.finalized | F09.S01.M03 | F09.S02.M01 | internal |
| identity.device_key.revoked | F07.S01.M01 | F09.S02.M01 | external |
| privacy.deletion.completed | F10.S01.M04 | F09.S02.M01 | external |
| commerce.payment.disputed | F09.S01.M01 | F09.S02.M02 | internal |
| services.dispute.opened | F03.S02.M03 | F09.S02.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F09.S02.M02 | external |
| commerce.deal.completed | F09.S01.M01 | F09.S02.M03 | internal |
| commerce.payment.finalized | F09.S01.M03 | F09.S02.M03 | internal |
| commerce.payment.reorged | F09.S01.M03 | F09.S02.M03 | internal |
| commerce.payment.expired | F09.S01.M01 | F09.S02.M03 | internal |
| commerce.payment.failed | F09.S01.M03 | F09.S02.M03 | internal |
| privacy.deletion.completed | F10.S01.M04 | F09.S02.M03 | external |
| privacy.deletion.completed | F10.S01.M04 | F09.S03.M02 | external |
