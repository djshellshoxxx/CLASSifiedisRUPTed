# F09.S01 — 01_payments

**Status:** SPECIFIED. **Parent:** [F09](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F09.S01.M01 | [Noncustodial payment claims](mod_noncustodial/SPEC.md) | SPECIFIED | Deal (context ref, parties, terms) and PaymentClaim state machine (CTR-COM-001); also merchant fee claims for paid listings. |
| F09.S01.M02 | [Cash payments](mod_cash/SPEC.md) | SPECIFIED | Cash method rules: payee acknowledgement required, optional bilateral receipt, safety guidance; no verification claims. |
| F09.S01.M03 | [Crypto payments](mod_crypto/SPEC.md) | SPECIFIED | Payment request (address supplied by payee, amount, chain), ChainVerifierPort adapters, confirmation tracking, reorg handling, finality policy (COM-5). |

## Aggregation

Modules in this subfeature share the feature package `packages/commerce` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| commerce.payment.confirming | F09.S01.M03 | F09.S01.M01 | internal |
| commerce.payment.confirmed | F09.S01.M03 | F09.S01.M01 | internal |
| commerce.payment.finalized | F09.S01.M03 | F09.S01.M01 | internal |
| commerce.payment.reorged | F09.S01.M03 | F09.S01.M01 | internal |
| commerce.payment.failed | F09.S01.M03 | F09.S01.M01 | internal |
| commerce.dispute.opened | F09.S02.M02 | F09.S01.M01 | external |
| commerce.dispute.resolved | F09.S02.M02 | F09.S01.M01 | external |
| commerce.dispute.withdrawn | F09.S02.M02 | F09.S01.M01 | external |
| privacy.deletion.completed | F10.S01.M04 | F09.S01.M01 | external |
| bazaar.inventory.conflict_detected | F01.S03.M01 | F09.S01.M01 | external |
| commerce.deal.opened | F09.S01.M01 | F09.S01.M02 | internal |
| commerce.payment.claimed | F09.S01.M01 | F09.S01.M02 | internal |
| commerce.payment.acknowledged | F09.S01.M01 | F09.S01.M02 | internal |
| commerce.payment.expired | F09.S01.M01 | F09.S01.M02 | internal |
| commerce.deal.cancelled | F09.S01.M01 | F09.S01.M02 | internal |
| privacy.deletion.completed | F10.S01.M04 | F09.S01.M02 | external |
| commerce.payment.claimed | F09.S01.M01 | F09.S01.M03 | internal |
| commerce.payment.acknowledged | F09.S01.M01 | F09.S01.M03 | internal |
| commerce.payment.expired | F09.S01.M01 | F09.S01.M03 | internal |
| commerce.deal.cancelled | F09.S01.M01 | F09.S01.M03 | internal |
| privacy.deletion.completed | F10.S01.M04 | F09.S01.M03 | external |
