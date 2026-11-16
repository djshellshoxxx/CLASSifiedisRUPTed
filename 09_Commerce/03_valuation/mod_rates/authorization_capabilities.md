# PS-075-05 — Authorization and capabilities: FX rates and quotes

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S03.M02 FX rates and quotes](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/valuation/rates` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-075-05.R01** Under vault policy (CAP-8) only the unlocked local principal requests, issues manual quotes for, checks or revokes quotes in its vault.
- **PS-075-05.R02** Under relay policy a relay serves relay_issue to requests signed by a registered device key and only relay operators configure which sources it offers.
- **PS-075-05.R03** Manual quote issuance is logged in the vault's local audit log with reason; relay issuance is audited by the relay under RET-AUDIT.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| commerce.fx_quote.request | local-principal | vault unlocked; local limit 30 provider fetches per hour |
| commerce.fx_quote.issue_manual | local-principal | vault unlocked; reason present |
| commerce.fx_quote.revoke | local-principal | quote sourceKind is manual and issuerRef is the local principal |
| commerce.fx_quote.relay_issue | relay-device-key, operator | relay policy row quote_service enabled; relay rate limit 30 per hour per device key |
| commerce.fx_quote.read | local-principal | vault unlocked |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-075-09.T05 | integration | PS-075-03.R03, PS-075-05.R03 | issuer revokes a manual quote already sent to a peer | local check shows revoked, revocation statement reaches prepared then peer_accepted, peer pin check reports invalid |
| TEST-PS-075-09.T08 | abuse | PS-075-05.R01, PS-075-05.R02, PS-075-07.R02 | relay_issue by an unregistered device key; 31 relay requests in one hour; tampered relay quote | relay denies, 31st returns RATE_LIMITED, vault rejects tampered quote with COMMERCE_RATE_SIGNATURE_INVALID |

## Dependencies

Module depends on: F09.S03.M01, F09.S03.M03, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
