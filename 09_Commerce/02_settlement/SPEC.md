# F09.S02 — 02_settlement

**Status:** SPECIFIED. **Parent:** [F09](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F09.S02.M01 | [Receipts](mod_receipts/SPEC.md) | SPECIFIED | Signed receipts (COM-6) by payee/payer, verification of signature, export. |
| F09.S02.M02 | [Disputes](mod_disputes/SPEC.md) | SPECIFIED | Shared case handling for deals/cycles/bookings/rentals: evidence refs, mediator (moderator) assignment, outcomes (no-fault close, refund-claimed, return-agreed, enforcement referral); platform cannot move money. |
| F09.S02.M03 | [Settlement reconciliation](mod_reconciliation/SPEC.md) | SPECIFIED | Periodic reconciliation of deals vs claims vs chain observations; stale/mismatch detection for users and operators. |

## Aggregation

Modules in this subfeature share the feature package `packages/commerce` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| commerce.payment.acknowledged | F09.S01.M01 | F09.S02.M01 | external |
| commerce.payment.finalized | F09.S01.M03 | F09.S02.M01 | external |
| identity.device_key.revoked | F07.S01.M01 | F09.S02.M01 | external |
| privacy.deletion.completed | F10.S01.M04 | F09.S02.M01 | external |
| commerce.payment.disputed | F09.S01.M01 | F09.S02.M02 | external |
| services.dispute.opened | F03.S02.M03 | F09.S02.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F09.S02.M02 | external |
| commerce.deal.completed | F09.S01.M01 | F09.S02.M03 | external |
| commerce.payment.finalized | F09.S01.M03 | F09.S02.M03 | external |
| commerce.payment.reorged | F09.S01.M03 | F09.S02.M03 | external |
| commerce.receipt.issued | F09.S02.M01 | F09.S02.M03 | internal |
| commerce.payment.expired | F09.S01.M01 | F09.S02.M03 | external |
| commerce.payment.failed | F09.S01.M03 | F09.S02.M03 | external |
| privacy.deletion.completed | F10.S01.M04 | F09.S02.M03 | external |
