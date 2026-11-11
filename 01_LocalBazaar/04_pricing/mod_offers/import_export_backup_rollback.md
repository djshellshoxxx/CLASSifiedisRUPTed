# PS-011-10 — Import, export, backup and rollback: Purchase offers

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S04.M01 Purchase offers](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/pricing/offers` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-011-10.R01** A user's export contains offers they made and offers on their listings.
- **PS-011-10.R02** Import verifies statement signatures and that the importing principal is buyerId or sellerId, with no relay lookup; records that fail are quarantined and other principals' offers are never imported as editable.
- **PS-011-10.R03** Schema changes to Offer follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** Section bazaar.offers in classrup-export/v1; one line per Offer (schema classrup.bazaar.offer_record/v1) followed by its signed statements (offer, decision, withdrawal and acceptance consent).
- **import:** Signatures are re-verified locally and the importing principal must be buyerId or sellerId; no relay is consulted. Terminal offers import as read-only history; open offers import as expired with reason superseded to avoid stale commitments; hidden below-minimum offers stay hidden.
- **backup:** Vault export is the primary backup (IOX-6); relays hold only encrypted mailbox envelopes under their retention policy (IOX-7).
- **migration rollback:** Additive fields only in v1; records written under the earlier record name classrup.bazaar.offer/v1 are read as classrup.bazaar.offer_record/v1 for 180 days; rollback to the previous release is safe because new optional fields are ignored by older readers.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-011-09.T16 | integration | PS-011-10.R01, PS-011-10.R02, PS-011-10.R03 | export from S, import into a fresh vault of the same principal, import by a principal that is neither buyer nor seller, import with a bad signature | offers and statements round-trip identical with no relay lookup; open offers import as expired superseded; foreign principal rejected; bad signature quarantined |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F01.S02.M01, F01.S03.M01, F09.S01.M01, F09.S03.M01, F09.S03.M03, F07.S02.M02, F08.S02.M02, F11.S01.M01, F11.S01.M02, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
