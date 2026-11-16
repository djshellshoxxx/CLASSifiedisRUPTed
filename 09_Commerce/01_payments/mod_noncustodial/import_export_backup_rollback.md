# PS-069-10 — Import, export, backup and rollback: Noncustodial payment claims

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M01 Noncustodial payment claims](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/noncustodial` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-069-10.R01** The vault export contains the principal's Deals and claims with their signed statements and provenance, in the section commerce.deals.
- **PS-069-10.R02** Import verifies signatures, schema versions and ID collisions; foreign statements are verified again and quarantined when the signer is not a party.
- **PS-069-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** Section commerce.deals in classrup-export/v1; one line per Deal and per PaymentClaim with the signed statement envelopes (schemas classrup.commerce.deal/v1, classrup.commerce.payment_claim/v1).
- **import:** Terminal records import as read-only evidence; open Deals import as open but sync state is reset to local_committed and statements are re-sent only if the user chooses; claims past 14 days of no progress import as expired.
- **backup:** The vault export is the primary backup (IOX-6); no relay holds plaintext Deals.
- **migration rollback:** Additive fields only in v1; rollback to the previous release is safe because new optional fields are ignored by older readers. Signed statement bytes are never rewritten by a migration.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-069-09.T18 | integration | PS-069-10.R01, PS-069-10.R02, PS-069-10.R03 | export vault A, import into fresh vault, roll back one release | Deals and claims round-trip identical; open Deals import as open with sync state local_committed; conflicting IDs rejected |

## Dependencies

Module depends on: F09.S03.M01, F09.S03.M03, F07.S01.M01, F07.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
