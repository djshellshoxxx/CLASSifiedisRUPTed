# PS-068-10 — Import, export, backup and rollback: Crypto payments

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M03 Crypto payments](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/crypto` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-068-10.R01** The vault export contains the principal's crypto requests and observations with signed request statements in the section commerce.crypto.
- **PS-068-10.R02** Import verifies signatures and re-validates addresses; open observations restart as watching and are re-verified rather than trusted.
- **PS-068-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** Section commerce.crypto in classrup-export/v1; one line per CryptoPaymentRequest and ChainObservation (schemas classrup.commerce.crypto_request/v1, classrup.commerce.chain_observation/v1). Verifier endpoint settings and API keys are excluded.
- **import:** Observations with final status import as read-only evidence marked imported-not-reverified; non-final observations import as watching; request statements are verified again and invalid ones are quarantined.
- **backup:** The vault export is the primary backup (IOX-6); relays hold no requests or observations.
- **migration rollback:** Additive fields only in v1; rollback is safe because older readers ignore new optional fields. A change to a finality policy requires a new policy identifier and never rewrites stored observations.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-068-09.T17 | integration | PS-068-10.R01, PS-068-10.R02, PS-068-10.R03 | export, import to fresh vault, roll back one release | requests and observations round-trip; imported open observations restart as watching |

## Dependencies

Module depends on: F09.S01.M01, F09.S03.M01, F09.S03.M03, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
