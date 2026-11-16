# PS-073-07 — Privacy, retention and abuse: Currency registry

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S03.M01 Currency registry](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/valuation/currency` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-073-07.R01** Currency data is public reference data and contains no personal information.
- **PS-073-07.R02** Local changes are recorded in the vault's local audit log (RET-AUDIT, 1 year).
- **PS-073-07.R03** Crypto contract addresses are validated and shown with a checksum so users can verify the asset they are paying with.

## Specification

**Data classification**
- CurrencyDef: P0 reference data.

**Retention**
- RET-STANDARD for definitions; local change audit RET-AUDIT (1 year).

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | A scam link or imported statement prompts the user to register a look-alike token | contract address displayed with checksum and chain name; registration is an explicit local action with a warning; only BTC, ETH and USDC exist by default |
| T02 | Decimals change corrupts stored amounts | decimals immutable, enforced in domain and by a SQL trigger |

**Abuse controls**
- Register is limited to 20 calls per hour per vault and requires a confirmation dialog; a relay may refuse to index listings priced in assets outside its accepted list.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-073-09.T10 | integration | PS-073-07.R01, PS-073-07.R02, PS-073-07.R03 | register USDC and read via query | contract shown with EIP-55 checksum; audit retained |

## Dependencies

Module depends on: F09.S03.M03, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
