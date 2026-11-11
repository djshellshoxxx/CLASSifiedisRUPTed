# PS-005-10 — Import, export, backup and rollback: Giveaway listing type

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S02.M03 Giveaway listing type](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listing_types/giveaway` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-005-10.R01** The user export contains terms and requests (as giver and as requester) in sections bazaar.giveaway_terms and bazaar.giveaway_requests together with their statements.
- **PS-005-10.R02** Import verifies statement signatures and the party roles; expired selections import as expired and never revive a reservation.
- **PS-005-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** Sections bazaar.giveaway_terms and bazaar.giveaway_requests in classrup-export/v1, one line per record (schemas classrup.bazaar.giveaway_terms/v1 and classrup.bazaar.giveaway_request/v1) plus the signed statements.
- **import:** Records with invalid signatures are quarantined; requests where neither party is the importing principal are rejected; imported pending requests become expired to avoid stale commitments.
- **backup:** Vault export is the primary backup (IOX-6); relays keep only encrypted mailbox envelopes for a limited retention period per their policy.
- **migration rollback:** Additive optional fields only in v1; rollback is by reinstalling the previous release; statements already sent remain valid because their schemas are unchanged.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-005-09.T16 | integration | PS-005-10.R01, PS-005-10.R02, PS-005-10.R03 | export, import to fresh vault, import request with invalid signature | round-trip identical; invalid signature quarantined; selected imports as expired if past selectedUntil |

## Dependencies

Module depends on: F01.S01.M01, F01.S03.M01, F07.S02.M02, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
