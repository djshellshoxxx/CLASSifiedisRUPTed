# PS-075-10 — Import, export, backup and rollback: FX rates and quotes

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S03.M02 FX rates and quotes](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/valuation/rates` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-075-10.R01** The vault export includes quotes pinned by the user's proposals through the pinning module's section as references with the quote data embedded.
- **PS-075-10.R02** Imported quotes keep their original expiresAt; those already past it are stored as expired.
- **PS-075-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** ExportSectionPort section commerce.fx_quotes in the vault export classrup-export/v1: only quotes referenced by the user's proposals, deals or cycles; one line per FxQuote (schema classrup.commerce.fx_quote/v1) with purpose, sourceSigned and verificationLabel.
- **import:** Quotes import as read-only evidence; status recomputed from expiresAt on the local clock so a stale quote can never become valid again; signatures are re-verified and sourceSigned recomputed.
- **backup:** The vault export is the primary backup (IOX-6). Relays that serve quotes keep no user data worth backing up.
- **migration rollback:** Additive fields only (purpose defaults to general, sourceSigned recomputed). Rollback is safe because new optional fields are ignored by older readers.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-075-09.T13 | integration | PS-075-10.R01, PS-075-10.R02, PS-075-10.R03 | export, re-import and downgrade | quotes round-trip identical; expired quotes import as expired |

## Dependencies

Module depends on: F09.S03.M01, F09.S03.M03, F11.S01.M01, F11.S01.M03, F07.S02.M01, F07.S02.M02, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001, CTR-FED-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
