# PS-067-10 — Import, export, backup and rollback: Cash payments

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M02 Cash payments](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/cash` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-067-10.R01** The vault export contains the principal's cash terms with their signed statements in the section commerce.cash_terms.
- **PS-067-10.R02** Import verifies signatures and parties against the imported Deals and quarantines terms whose signer is not a party.
- **PS-067-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** ExportSectionPort section commerce.cash_terms in classrup-export/v1; one line per CashTerms (schema classrup.commerce.cash_terms/v1) with statement envelopes (cash_terms, cash_terms_accept, cash_terms_decline).
- **import:** Accepted, declined and superseded terms import as read-only history; proposed terms past expiry import as expired; the latest accepted terms import as in force.
- **backup:** The vault export is the primary backup (IOX-6); relays hold no cash terms.
- **migration rollback:** Additive fields only in v1; rollback is safe because older readers ignore new optional fields and the new decline statement type.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-067-09.T13 | integration | PS-067-10.R01, PS-067-10.R02, PS-067-10.R03 | export, import to fresh vault, roll back one release | terms round-trip identical; expired proposals import as expired |

## Dependencies

Module depends on: F09.S01.M01, F09.S02.M01, F09.S03.M03, F18.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
