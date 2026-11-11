# PS-038-05 — Authorization and capabilities: Anti-sniping soft close

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M02 Anti-sniping soft close](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/sniping` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-038-05.R01** Relay policy - apply is system-only inside the bid transaction on the host that owns the auction; no principal and no relay access token can call it.
- **PS-038-05.R02** Reading extensions and previews needs no capability beyond a public read; they contain no personal data.
- **PS-038-05.R03** Vaults never create extensions; a vault that receives an extension verifies the host signature against the host key in the auction terms and the rules version against the terms, and quarantines mismatches.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| auctions.extension.apply | system | called inside a bid transaction holding the auction lease with fencing token |
| auctions.extension.receive | principal | any envelope; acceptance depends on the host key and softCloseRulesVersion in the terms held by the vault |
| auctions.extension.read_public | anonymous, principal | any auction |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-038-09.T09 | abuse | PS-038-05.R01, PS-038-05.R02, PS-038-05.R03 | vault or principal calls apply; forged extension statement | FORBIDDEN or quarantine; end time unchanged |

## Dependencies

Module depends on: F04.S01.M01, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F13.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
