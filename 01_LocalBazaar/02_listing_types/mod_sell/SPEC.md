# F01.S02.M01 — Sell listing type

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F01.S02](../SPEC.md). **Process IDs:** PS-006-01…PS-006-10. **Code:** `packages/bazaar/src/listing_types/sell`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Defines the commercial terms of a sell listing: asking price in Money, accepted currencies, accepted payment methods (cash, crypto, external), negotiable flag, barter-acceptable flag, minimum offer threshold and pickup or delivery options. The public part of the terms is embedded in the signed listing projection (F01.S01.M03). There is no checkout and no custody: buying always ends in a noncustodial Deal with payment claims (F09). Payment instructions such as account numbers are never stored here or published; they are exchanged privately after a deal is opened. Money caps are per currency so assets with many decimals can be priced.

## Responsibilities

- Own SellTerms, one record per sell listing, with strict Money validation (CTR-MNY-001), a per-currency maximum from F09.S03.M03 and currency checks against the currency registry.
- Enforce price-change discipline on published listings (at most 10 changes per 24 h) and report each change to F01.S01.M02 as a material revision.
- Publish the terms to other modules through the query bazaar.sell_terms.get and the event bazaar.sell_terms.set.
- Provide the seller's minimum offer threshold to F01.S04.M01, which applies it on receipt in the seller vault and never tells the buyer (F01.S04.M01 V12).
- Carry the public barterAcceptable flag that the projection exposes for barter matching and discovery filters (N15).
- Register the F10 privacy ports for SellTerms and classify every field (N6).

## Not responsible for

- Taking payment, escrow, checkout or receipts (F09); crypto addresses are exchanged only inside a Deal.
- Offers and counteroffers (F01.S04.M01, F01.S04.M02), including the auto-rejection of offers below minOffer.
- Currency registry and FX (F09.S03.M01, F09.S03.M02); this module only checks that a currency is registered and reads its decimals through F09.S03.M03.
- Shipping carriers and tracking.
- Future: tiered pricing for quantity and scheduled sales.

## User stories

- As a seller, I set an asking price, say I accept cash or Bitcoin, and mark the price negotiable.
- As a seller, I set a minimum offer so very low offers never reach me.
- As a buyer, I can see clearly which payment methods the seller accepts and that the app does not handle my money.
- As a trader, I mark my sell listing barter-acceptable so swap matching and the barter filter can find it.

## Edge cases

- Price amount is sent as a floating-point number; rejected with VALIDATION_FAILED because Money is an integer string.
- Currency is not in the registry (for example a typo XAU1); rejected with BAZAAR_SELL_CURRENCY_UNKNOWN.
- Seller enables crypto but names no asset; BAZAAR_SELL_CRYPTO_ASSET_REQUIRED is returned.
- Seller changes price an 11th time in 24 h; RATE_LIMITED with retryAfterMs set.
- Terms are saved on a published listing while offline; they are committed locally, marked unsent, and buyers see them only after the new projection is accepted.
- Seller sets minimum offer higher than the asking price; BAZAAR_SELL_MIN_OFFER_INVALID is returned.
- Free-text delivery note contains what looks like an IBAN or wallet address; it is rejected with BAZAAR_SELL_PAYMENT_DETAILS_PUBLIC.
- Seller prices in ETH (18 decimals) at 0.5 ETH, which is 5 x 10^17 minor units; accepted because the cap is 10^10 major units for every currency.
- The listing is deleted; the terms are purged 30 days later and a tombstone stays 180 days.

## UX and accessibility

- Sell terms form: price with currency selector, additional accepted currencies, payment method chips (cash, crypto, external), crypto asset picker, negotiable switch, barter-acceptable switch, minimum offer, pickup and delivery options.
- Honesty banner: ClassRup does not hold your money. Payment happens directly between you and the buyer.

**States:** loading; empty; saving-local; saved-local; unsent-changes; validation-error; rate-limited

**Accessibility:** Price input has a visible label with currency and uses inputmode decimal; errors are linked with aria-describedby.; Payment method chips are toggle buttons with pressed state exposed.; Money amounts are displayed with currency code via Intl.NumberFormat (UX-4).

## Owned data

- `SellTerms` (classrup.bazaar.sell_terms/v1, P3, RET-STANDARD)

## Interfaces

- Commands: `bazaar.sell_terms.define`
- Queries: `bazaar.sell_terms.get`, `bazaar.sell_terms.accepts`
- Emits: `bazaar.sell_terms.set`
- Consumes: `bazaar.listing.deleted`

## Dependencies

F01.S01.M01, F01.S01.M02, F09.S03.M01, F09.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-SCH-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-006-01 | [Domain schema](domain_schema.md) | 4 |
| PS-006-02 | [Validation rules](validation_rules.md) | 4 |
| PS-006-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-006-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-006-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-006-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-006-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-006-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-006-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-006-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/bazaar/src/listing_types/sell/index.ts`.

## Acceptance criteria

- All tests T01-T18 pass in CI.
- No money is ever represented as a floating-point number, every currency has a cap derived from its decimals, and minOffer never appears outside the owner's vault.
- No screen or string suggests the platform holds, escrows or processes payment.
