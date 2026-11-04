# PS-011-07 — Privacy, retention and abuse: Purchase offers

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S04.M01 Purchase offers](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/pricing/offers` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-011-07.R01** Offer amounts and notes never appear in public listing views, search, federation or notification payloads.
- **PS-011-07.R02** Offer evidence is retained for RET-EVIDENCE and pseudonymized if either party deletes their account.
- **PS-011-07.R03** Offer spam and lowballing harassment are limited by caps, rate limits and seller-side filters.

## Specification

**Data classification**
- Offer: P2 (buyer, seller).
- note: P2 free text; scanned by F12.S02.M02 spam heuristics; never federated.

**Retention**
- Terminal offers: RET-EVIDENCE (2 years after last related activity).
- On account deletion: buyerId/sellerId replaced with a per-deletion pseudonym; amounts kept for the counterparty's records.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Lowball offer flooding to harass a seller | per-buyer rate limit 20 offers/hour, per-listing 50 open cap, seller can set a minimum offer threshold (offers below auto-rejected silently to the seller) |
| T02 | Offer note used for phishing links | link detection via F12.S02.M02; links rendered as plain text; report action on each offer |
| T03 | Enumeration of who offered on a listing | queries restricted to seller; other actors get NOT_FOUND |
| T04 | Replay of an accept request | idempotency key and expectedRevision; replay returns original result |

**Abuse controls**
- Signals bazaar.offer.made velocity and reject ratio to F12.S03.M02 fraud signals.
- Report offer action creates F12.S01.M01 report with an evidence snapshot.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-011-09.T08 | abuse | PS-011-05.R01, PS-011-05.R02, PS-011-07.R01 | non-owner accepts; third party queries offers; public listing view | FORBIDDEN or NOT_FOUND; no offer data in public payloads |
| TEST-PS-011-09.T11 | integration | PS-011-07.R02 | buyer deletes account | offer pseudonymized, seller still sees amount |
| TEST-PS-011-09.T12 | abuse | PS-011-07.R03 | 21 offers in one hour by one buyer | 21st returns RATE_LIMITED |

## Dependencies

Module depends on: F01.S01.M03, F01.S02.M01, F01.S03.M01, F09.S01.M01, F09.S03.M03, F07.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-IDM-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
