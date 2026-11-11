# PS-004-02 — Validation rules: Listing publication

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M03 Listing publication](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/publish` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-004-02.R01** Publication is allowed only for a complete listing whose kind-specific terms exist and whose region is at least L1.
- **PS-004-02.R02** Policy checks run in the vault before signing and cannot be skipped by the caller.
- **PS-004-02.R03** Every violation maps to one stable error code with a localized message key.
- **PS-004-02.R04** Before anything leaves the vault, publish runs the in-process spam evaluation moderation.spam.evaluate and risk assessment moderation.risk.assess (N19), the federation_publish consent check when federation is opted in (N6) and assertPublicCell on the region (N8); an elevated spam score or risk level holds the publication for owner confirmation.
- **PS-004-02.R05** The clock sanity check trusts no single relay: it compares the device clock with the median of the latest receipts from at least 2 distinct relays in the last 7 days, discards receipts more than 24 h ahead of that median and flags their relay untrusted, and only warns when fewer than 2 relays are available (ADR-0016 §5).
- **PS-004-02.R06** Unpublishing a listing that has active local inventory holds requires explicit owner confirmation; the holds stay valid and are listed.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | listing status is draft, unpublished or expired; relays whose delivery for this listing has hostingRemoved are dropped from relayIds and reported in skippedRelays, and only an empty remaining relay list is refused | BAZAAR_PUBLISH_NOT_ALLOWED |
| V02 | title >= 3 and description >= 10 code points; kind sell has SellTerms, wanted has WantSpec, giveaway has GiveawayTerms | BAZAAR_PUBLISH_INCOMPLETE |
| V03 | regionCell present with length 4 or 5 and mediaRefs have no GPS tag | BAZAAR_PUBLISH_INCOMPLETE |
| V04 | category is active and, if restricted for the chosen jurisdiction profile, notices are acknowledged | BAZAAR_PUBLISH_BLOCKED |
| V05 | prohibited-item verdict is not block | BAZAAR_PUBLISH_BLOCKED |
| V06 | verdict review or risk level elevated or high requires ownerConfirmedAt | BAZAAR_PUBLISH_CONFIRMATION_REQUIRED |
| V07 | expiresInDays between 1 and 90 | VALIDATION_FAILED |
| V08 | 1 to 10 destination relays, each a user-selected relay known to the vault with a pinned signing key | VALIDATION_FAILED |
| V09 | vault has fewer than 100 active publications | BAZAAR_PUBLISH_LIMIT |
| V10 | publish and renew: device clock within 24 h of the median of the latest receipts from at least 2 distinct relays in the last 7 days, after discarding receipts more than 24 h ahead of that median (their relay is flagged untrusted); with fewer than 2 relays the UI warns and the command proceeds | PRECONDITION_FAILED |
| V11 | renew only in the last 7 days of life (or at expiry when requested by the F01.S01.M04 deferral), renewals < 3 and total life <= 120 days | BAZAAR_PUBLISH_RENEW_NOT_ALLOWED |
| V12 | moderation.risk.assess (F12.S03.M01, N19) for subject listing_publication returns low; elevated or high moves the record to held_for_confirmation before any signing | BAZAAR_PUBLISH_CONFIRMATION_REQUIRED |
| V13 | federationOptIn true requires privacy.consent.check {purpose federation_publish, relayId} to return granted for every destination relay (N6) | BAZAAR_PUBLISH_FEDERATION_CONSENT_REQUIRED |
| V14 | assertPublicCell(regionCell) of F06.S02.M01 accepts the cell (N8) before the projection is built | DISCOVERY_PRECISION_FORBIDDEN |
| V15 | unpublish of a listing with active local holds (F01.S03.M01 list_holds) requires confirmHolds true | BAZAAR_PUBLISH_HOLDS_ACTIVE |
| V16 | relay notice or promotion statement: Ed25519 signature over JCS verifies with the pinned key of deliveries[].relayId (rotation only when signed by the previous key), its target statementCid or listingId belongs to this publication, and its cid is new | VALIDATION_FAILED |
| V17 | the built projection's key set equals the allowlist exactly and maxBudget is present only when budgetVisible is true | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-004-09.T03 | unit | PS-004-02.R01, PS-004-02.R02, PS-004-02.R03 | violate each rule V01-V17 | documented error code returned, no statement signed |
| TEST-PS-004-09.T19 | integration | PS-004-02.R04 | spam stub (moderation.spam.evaluate) scores high, then risk stub (moderation.risk.assess) returns elevated; federationOptIn without consent for R1; regionCell of 6 characters injected past the record check | held_for_confirmation and no signature in both first cases; BAZAAR_PUBLISH_FEDERATION_CONSENT_REQUIRED; DISCOVERY_PRECISION_FORBIDDEN; nothing queued in each case |
| TEST-PS-004-09.T20 | abuse | PS-004-02.R05 | R3 returns receipts 3 days in the future while R1 and R2 agree with the device; then only R3 is configured | R3 flagged untrusted and publish succeeds; with R3 alone the command proceeds with clockWarning instead of PRECONDITION_FAILED |
| TEST-PS-004-09.T21 | integration | PS-004-02.R06 | unpublish L with an active deal hold without and with confirmHolds | BAZAAR_PUBLISH_HOLDS_ACTIVE first; then unpublished with the hold still active and listed |

## Dependencies

Module depends on: F01.S01.M01, F01.S02.M01, F01.S02.M02, F01.S02.M03, F01.S03.M01, F18.S01.M01, F18.S01.M02, F18.S01.M03, F12.S02.M02, F12.S03.M01, F10.S01.M01, F06.S02.M01, F08.S01.M01, F09.S01.M01, F16.S02.M03, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-COM-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
