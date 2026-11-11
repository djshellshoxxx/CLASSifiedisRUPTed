# PS-040-07 — Privacy, retention and abuse: Rental deposits (noncustodial)

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S01.M02 Rental deposits (noncustodial)](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_catalog/deposits` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-040-07.R01** Deposit terms, evidence and amounts are P2 and travel only as end-to-end encrypted envelopes to the two parties; they never appear in logs, notifications or public projections.
- **PS-040-07.R02** Evidence references are attachment and MediaBlob ids; photos remain encrypted attachments shared with the counterparty and, only when a party explicitly attaches them while opening a case, the mediator.
- **PS-040-07.R03** Deposit theft, bogus forfeits and fake release claims are limited by explicit proof levels, mandatory evidence, a damage-claim reference for damage forfeits and the dispute path; no one is auto-penalized.
- **PS-040-07.R04** The module registers ExportSectionPort (section rentals.deposits), DeletionPort and RetentionPurgePort with F10 (N6), classifies every DepositTerms field through F10.S02.M02, and on privacy.deletion.completed pseudonymizes the deleted party in retained evidence while signed statements stay verifiable.
- **PS-040-07.R05** Blocks (N7) never strand a deposit - statements settling obligations of a reservation confirmed before the block (release, response, acknowledgement, claim, notice) are still verified and stored, only notifications are suppressed, and isBlockedEither is checked on new initiations for other reservations.

## Specification

**Data classification**
- DepositTerms: P2 in both vaults.
- Forfeit evidence: references to P2 attachments and MediaBlob ids recorded in the signed claim.

**Retention**
- Terminal deposit terms and statements: RET-EVIDENCE (2 years after last related activity), purged through RetentionPurgePort.
- Quarantined statements: RET-SHORT (30 days) with the failure code.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Owner keeps the deposit and disappears | non-custody is stated in the registered consent wording before agreement, funded proof requires the owner's own acknowledgement, the signed acknowledgement is dispute evidence and can inform reputation locally; no guarantee of recovery is claimed |
| T02 | Bogus forfeit claim | claim needs 1..10 evidence references, a damage-claim reference for damage, and an amount not above the funded deposit; renter can dispute; silence escalates to escalation_due and never to acceptance |
| T03 | Renter claims payment that never happened | proof stays claimed (unverified) until the owner acknowledges or the chain is final; handoff UI warns when not funded |
| T04 | Replay of an old agreement onto new terms | agreement consent signs the exact terms cid; mismatch returns RENTALS_DEPOSIT_TERMS_STALE |
| T05 | Relay tampering or reordering | signatures cover JCS bytes; each statement names its predecessor cid; reordered statements wait in quarantine up to 24 h |
| T06 | Owner waives damage at return and then forfeits for damage | V10 checks the verified return_waiver through WaiverStatusPort |
| T07 | Owner blocks the renter to suppress the forfeit response | lifecycle statements bypass the block drop; the response is stored as evidence |

**Abuse controls**
- Local quarantine and a per-sender quota of 50 inbound deposit statements per day per counterparty.
- Dispute opening is available to the designated opener at every funded state; reports go through F12 on the vault's chosen relay.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-040-09.T11 | abuse | PS-040-07.R01, PS-040-07.R02, PS-040-07.R03 | inspect logs, notifications and relay payloads; 51 inbound statements in a day; forfeit for damage without a damage claim | no amounts or evidence outside encrypted envelopes; 51st dropped and counted; forfeit refused with VALIDATION_FAILED |
| TEST-PS-040-09.T23 | integration | PS-040-07.R04 | privacy.deletion.completed for the renter; export; retention purge after RET-EVIDENCE | DIDs replaced by the pseudonym with signatures intact; section rentals.deposits exported; purge removes terminal records |
| TEST-PS-040-09.T24 | abuse | PS-040-07.R05 | owner blocks the renter after funding, then the renter's forfeit response and release acknowledgement arrive | both verified and stored, notifications suppressed; the deposit reaches released |

## Dependencies

Module depends on: F05.S01.M01, F09.S01.M01, F09.S01.M03, F09.S02.M02, F09.S03.M01, F09.S03.M03, F08.S01.M01, F08.S02.M02, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
