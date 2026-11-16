# PS-073-05 — Authorization and capabilities: Currency registry

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S03.M01 Currency registry](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/valuation/currency` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-073-05.R01** Under vault policy (CAP-8) only the unlocked local principal reads, registers or changes currencies in its vault.
- **PS-073-05.R02** A relay may expose its accepted-currency list read-only to anonymous clients as a relay policy row; relay operators change that row under relay policy, outside this module's records.
- **PS-073-05.R03** Every state-changing decision is written to the vault's local audit log with no payload content.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| commerce.currency.read | local-principal, anonymous | local principal reads all vault rows; anonymous reads only a relay's published accepted list |
| commerce.currency.register | local-principal | vault unlocked; feature flag commerce.crypto not disabled for crypto kind |
| commerce.currency.set_status | local-principal | vault unlocked |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-073-09.T08 | abuse | PS-073-05.R01, PS-073-05.R02, PS-073-05.R03 | peer statement with unknown currency; anonymous reads relay accepted list; attempt to call register without unlocking | statement quarantined with COMMERCE_CURRENCY_UNKNOWN; only the relay's published list visible; locked vault refuses; local audit entry written |

## Dependencies

Module depends on: F09.S03.M03, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
