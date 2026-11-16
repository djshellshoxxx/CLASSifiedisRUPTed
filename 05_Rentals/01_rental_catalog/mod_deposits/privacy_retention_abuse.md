# PS-040-07 — Privacy, retention and abuse: Rental deposits (noncustodial)

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S01.M02 Rental deposits (noncustodial)](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_catalog/deposits` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-040-07.R01** Deposit terms, evidence and amounts are P2 and travel only as end-to-end encrypted envelopes to the two parties; they never appear in logs, notifications or public projections.
- **PS-040-07.R02** Evidence references are ids and hashes; photos remain encrypted attachments shared only with the counterparty and the dispute handler by explicit action.
- **PS-040-07.R03** Deposit theft, bogus forfeits and fake release claims are limited by explicit proof levels, mandatory evidence and the dispute path; no one is auto-penalized.

## Specification

**Data classification**
- DepositTerms: P2 in both vaults.
- Forfeit evidence: references to P2 attachments, hashes recorded in the signed claim.

**Retention**
- Terminal deposit terms and statements: RET-EVIDENCE (2 years after last related activity).
- Quarantined statements: RET-SHORT (30 days) with the failure code.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Owner keeps the deposit and disappears | non-custody is stated before agreement, funded proof requires the owner's own acknowledgement, the signed acknowledgement is dispute evidence and can inform reputation locally; no guarantee of recovery is claimed |
| T02 | Bogus forfeit claim | claim needs 1..10 evidence references and an amount not above the funded deposit; renter can dispute; 14 days of silence escalates to dispute and never to acceptance |
| T03 | Renter claims payment that never happened | proof stays claimed (unverified) until the owner acknowledges or the chain is final; handoff UI warns when not funded |
| T04 | Replay of an old agreement onto new terms | agreement signs the exact terms cid; mismatch returns RENTALS_DEPOSIT_TERMS_STALE |
| T05 | Relay tampering or reordering | signatures cover JCS bytes; each statement names its predecessor cid; reordered statements wait in quarantine up to 24 h |

**Abuse controls**
- Local quarantine and a per-sender quota of 50 inbound deposit statements per day per counterparty.
- Dispute opening is available at every funded state; reports go through F12 on the vault's chosen relay.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-040-09.T11 | abuse | PS-040-07.R01, PS-040-07.R02, PS-040-07.R03 | inspect logs, notifications and relay payloads; 51 inbound statements in a day | no amounts or evidence outside encrypted envelopes; 51st dropped and counted |

## Dependencies

Module depends on: F05.S01.M01, F09.S01.M01, F09.S02.M02, F09.S03.M01, F08.S01.M01, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
