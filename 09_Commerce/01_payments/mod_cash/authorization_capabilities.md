# PS-067-05 — Authorization and capabilities: Cash payments

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M02 Cash payments](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/cash` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-067-05.R01** Under vault policy (CAP-8) only the unlocked principal changes its vault; set requires the payee role and accept requires the payer role as recorded in the Deal.
- **PS-067-05.R02** Incoming terms statements are accepted only when signed by the obligation payee or payer respectively; otherwise they are quarantined.
- **PS-067-05.R03** No relay role has any capability over cash terms.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| commerce.cash_terms.set | local-principal | principal is the payee of the obligation; Deal open |
| commerce.cash_terms.accept | local-principal | principal is the payer of the obligation; terms proposed and not expired |
| commerce.cash_terms.read | local-principal | principal is a party of the Deal |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-067-09.T07 | abuse | PS-067-05.R01, PS-067-05.R02, PS-067-05.R03 | payer proposes terms; third-party signer; relay inspects traffic | FORBIDDEN or quarantine; relay sees only ciphertext |

## Dependencies

Module depends on: F09.S01.M01, F09.S03.M03, F18.S01.M01, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
