# PS-010-10 — Import, export, backup and rollback: Price negotiation

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S04.M02 Price negotiation](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/pricing/negotiation` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-010-10.R01** The user export contains all Negotiations and NegotiationRounds the user is a party to, with the signed statements.
- **PS-010-10.R02** Import re-verifies every signature and the hash chain; open chains import as expired and accepted chains import read-only with their evidence.
- **PS-010-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** Sections bazaar.negotiations and bazaar.negotiation_rounds in classrup-export/v1, one line per record (schemas classrup.bazaar.negotiation/v1 and classrup.bazaar.negotiation_round_record/v1) plus the signed statements and acceptance consents.
- **import:** Chains where the importing principal is not a party are rejected; broken hash chains or bad signatures are quarantined; open chains become expired so stale promises are never revived.
- **backup:** Vault export is the primary backup (IOX-6); relays keep only encrypted mailbox envelopes under their retention policy.
- **migration rollback:** Additive optional fields only in v1; round records written under the earlier record name classrup.bazaar.negotiation_round/v1 are read as classrup.bazaar.negotiation_round_record/v1 for 180 days; rollback is by reinstalling the previous release; sent statements remain valid because their schemas are unchanged.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-010-09.T18 | integration | PS-010-10.R01, PS-010-10.R02, PS-010-10.R03 | export, import to fresh vault, import chain with invalid signature | chains round-trip; open chains import as expired; invalid signature quarantined |

## Dependencies

Module depends on: F01.S04.M01, F01.S03.M01, F01.S01.M01, F01.S02.M01, F09.S01.M01, F09.S03.M01, F09.S03.M03, F07.S02.M02, F08.S02.M02, F11.S01.M01, F11.S01.M02, F11.S02.M03, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001, CTR-COM-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
