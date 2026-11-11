# PS-073-07 — Privacy, retention and abuse: Currency registry

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S03.M01 Currency registry](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/valuation/currency` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-073-07.R01** Currency data is public reference data and contains no personal information.
- **PS-073-07.R02** Local changes are recorded in the vault's local audit log (RET-AUDIT, 1 year).
- **PS-073-07.R03** Crypto contract addresses are validated and shown with a checksum so users can verify the asset they are paying with.
- **PS-073-07.R04** A look-alike or rescaled asset in a peer statement never reaches a Money value, because the descriptor check quarantines it and registration from a statement requires an explicit checksum review.

## Specification

**Data classification**
- CurrencyDef: P0 reference data. AssetDescriptor: P0, embedded in other modules' P2 statements.

**Retention**
- RET-STANDARD for definitions; local change audit RET-AUDIT (1 year).

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | A scam link or imported statement prompts the user to register a look-alike token | contract address displayed with checksum and chain name; registration is an explicit local action with a warning; only BTC, ETH and USDC exist by default |
| T02 | Decimals change corrupts stored amounts | decimals immutable, enforced in domain and by a SQL trigger |
| T03 | A counterparty embeds a descriptor with 18 decimals for a 6-decimal token to scale an amount by 10^12, or a look-alike contract under a known code | descriptor equality check before acceptance; mismatch quarantined with COMMERCE_CURRENCY_MISMATCH by the ingesting module |

**Abuse controls**
- Register is limited to 20 calls per hour per vault and requires a confirmation dialog; a relay may refuse to index listings priced in assets outside its accepted list.
- Registration from a peer statement is never automatic; it needs the checksum review confirmation.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-073-09.T10 | integration | PS-073-07.R01, PS-073-07.R02, PS-073-07.R03 | register USDC and read via query | contract shown with EIP-55 checksum; audit retained |
| TEST-PS-073-09.T14 | unit | PS-073-01.R04, PS-073-02.R04, PS-073-07.R04 | check_descriptor with the matching USDC descriptor, with 18 decimals, with a look-alike contract and with a wrong digest | first matches; the others return COMMERCE_CURRENCY_MISMATCH naming the differing field; nothing is registered |
| TEST-PS-073-09.T15 | integration | PS-073-04.R04, PS-073-07.R04 | vault A sends a USDC obligation whose descriptor says 18 decimals to vault B (6 decimals); then an unknown token statement is registered from its descriptor with and without checksumConfirmed | B quarantines the statement with COMMERCE_CURRENCY_MISMATCH and shows the difference; registration without confirmation fails with VALIDATION_FAILED, with confirmation stores exactly the descriptor fields and origin peer_statement |

## Dependencies

Module depends on: F09.S03.M03, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
