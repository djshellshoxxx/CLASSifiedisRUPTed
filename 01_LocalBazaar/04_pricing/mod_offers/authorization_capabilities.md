# PS-011-05 — Authorization and capabilities: Purchase offers

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S04.M01 Purchase offers](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/pricing/offers` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-011-05.R01** Only signed-in, non-suspended members can make offers; only the listing owner can accept or reject; only the buyer can withdraw.
- **PS-011-05.R02** Offers are visible only to their buyer and seller; others receive NOT_FOUND.
- **PS-011-05.R03** Moderators can read offers only when attached to an open moderation case.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| bazaar.offer.make | member | notSuspended; not blockedWith(listing owner); account limit (F12.S03.M04) not exceeded |
| bazaar.offer.accept | member | owner(listing) and offer.sellerId = actor |
| bazaar.offer.reject | member | owner(listing) and offer.sellerId = actor |
| bazaar.offer.withdraw | member | offer.buyerId = actor |
| bazaar.offer.read_as_seller | member, moderator | owner(listing), or moderator with open case referencing the listing |
| bazaar.offer.read_own | member | offer.buyerId = actor |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-011-09.T08 | abuse | PS-011-05.R01, PS-011-05.R02, PS-011-07.R01 | non-owner accepts; third party queries offers; public listing view | FORBIDDEN or NOT_FOUND; no offer data in public payloads |
| TEST-PS-011-09.T09 | abuse | PS-011-05.R03 | moderator reads offers with and without an open case | allowed only with case |

## Dependencies

Module depends on: F01.S01.M03, F01.S02.M01, F01.S03.M01, F09.S01.M01, F09.S03.M03, F07.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-IDM-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
