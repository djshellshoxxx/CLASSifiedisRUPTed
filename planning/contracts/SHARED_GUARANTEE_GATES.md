# Strong shared-guarantee gates

Status: **SPECIFIED_REVIEW_PENDING**. Documentation-only default; external protocol selection/validation and full F04/F01 process acceptance unresolved. Authority: latest parent instruction and [client-side architecture](../CLIENT_SIDE_ARCHITECTURE.md). No feature is removed or called implemented.

## GG-001 — Required disabled behavior

`auction.resolveGlobalWinner`, `auction.finalizeTrustedClose`, `placement.activatePaidAudience` are proposed local facade operations, not HTTP services. Their whole feature paths remain default-disabled while `selected_protocol_profile=null` or validation/required policy/security evidence is absent. Return CR-002 `FEATURE_DISABLED`, `retryable:false`, field error `EXTERNAL_PROTOCOL_NOT_SELECTED_OR_VALIDATED`, with a localized explanation and no payment, signing, network, item reservation, promotion, winner/finality event or state transition. A stale or malformed profile returns the same safe outcome; diagnostics stay local/redacted.

Local sorting, tentative bids, manual notes, owner claims or a local display preference must never substitute for the promised global-winner/trusted-close/paid-audience result. They may exist only as clearly separate unfinished/provisional records. A browser redirect, transport receipt, payment claim, local timestamp, local feature flag or user-generated profile cannot unlock a strong guarantee.

## GG-002 — Selection and validation boundary

Before any future enablement, specify an exact user-selected **external** protocol: profile ID/version, target market/audience, dependency operator/network and governance, noncustodial wallet/key boundaries, trust/consensus/time assumptions, canonical verifiable evidence, conflict/fork/reorg/outage handling, privacy/disclosure, expiry, refunds/disputes where applicable and objective acceptance fixtures. Selection and independent validation evidence must be explicit. A product-operated mandatory backend/account store or server-held user secret remains forbidden.

No adapter/profile implementation is approved by this contract. Future guard interfaces consume owner-approved validation evidence and local configuration, not caller assertions. Default unavailable/malformed/revoked validation fails closed; no network fallback or automatic protocol discovery. Even a validated protocol can promise only its precisely defined, owner-accepted scope under stated assumptions, never universal truth or guaranteed physical exchange.

## GG-003 — Reasoned candidates, not selection

For auction ordering/close, evaluate an optional public consensus/contract protocol with verifiable history, explicit network finality/reorg and clock rules, and audited noncustodial settlement. Compare it with signed bids plus an independent user-selected time/order witness. Both introduce external trust/cost/liveness/privacy dependencies; neither is selected, implemented or independently audited here. A local browser clock or signatures alone cannot establish a unique globally accepted close.

For paid placement, evaluate a user-selected independent publisher's signed entitlement/audience terms plus measurable publisher evidence and a dispute/refund policy. A public payment ledger can show a payment under a network policy; it cannot establish human attention, honest impressions or placement by every peer. If the original requested guarantee cannot be validated by any chosen profile, keep activation disabled and surface the contradiction for owner resolution. Do not quietly redefine paid reach as a local label.

## GG-004 — States and recovery

Gate state `disabled_unselected -> selected_unvalidated -> validation_pending -> eligible` is only a future configuration design. The current contract permits the first three states and no activation. `eligible` requires the separate reviewed full protocol and owner acceptance; creating this state diagram grants no eligibility. Revocation, incompatible version, uncertainty, source outage/fork or missing policy transitions to `disabled_uncertain` for new actions. Existing evidence remains labeled with source/uncertainty; no automatic rollback, fund transfer or fabricated winner. External recovery and already-paid obligations need their own full process contracts.

## GG-005 — Acceptance oracles

- T-GG-01: absent/invalid/revoked/stale/unvalidated profile, modified UI flag and forged caller evidence always reject strong operations with zero side effects.
- T-GG-02: local clock/order/claims/redirect/ACK cannot yield official winner, trusted close or active paid-audience status.
- T-GG-03: dependency disconnection/fork/reorg leaves new activation disabled and existing evidence uncertain; no silent local substitute.
- T-GG-04: UI, keyboard and screen reader explain the external-protocol gate without implying feature completion or product custody.
- T-GG-05: any later enablement requires exact protocol evidence, privacy/security/policy review and full requirement-to-test mapping, plus whole-suite specification GO before implementation.

These are test contracts, not executed tests. Full F04 auction and F01 promotion leaf requirements remain in the registry. This default does not postpone offline state, in-app notices or other independent specifications.
