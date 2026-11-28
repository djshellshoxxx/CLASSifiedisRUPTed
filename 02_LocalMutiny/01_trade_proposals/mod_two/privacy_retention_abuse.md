# PS-015-07 — Privacy, retention and abuse: Two-party barter

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S01.M01 Two-party barter](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/trade_proposals/two` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-015-07.R01** Proposal content is P2 and travels only as end-to-end encrypted envelopes to the other party; relays see recipient mailbox id, size and time only (PRV-5).
- **PS-015-07.R02** Evidence is retained for RET-EVIDENCE and pseudonymized, not deleted, if a party erases their local identity, because the counterparty's signed copies remain valid.
- **PS-015-07.R03** Harassment by unwanted proposals is limited by recipient-side muting, per-sender quarantine and proposer-side limits, since no central moderation exists (ADR-0016).
- **PS-015-07.R04** The module registers ExportSectionPort (section mutiny.proposals), DeletionPort and RetentionPurgePort with F10 (N6), annotates every TradeProposal field with its F10.S02.M02 class, and on privacy.deletion.completed pseudonymizes the erased party in retained proposals.

## Specification

**Data classification**
- TradeProposal: P2, device only; consent and reservation envelopes referenced by id; field classes annotated per F10.S02.M02 (DIDs P2, note P2, syncStates P2).
- note: P2 free text up to 500 code points, never indexed by a relay.

**Retention**
- Terminal proposals: RET-EVIDENCE (2 years after last related activity).
- Quarantined statements: RET-SHORT 30 days.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Proposer shows terms A and has the recipient sign terms B | consent signs the revision hash; each vault recomputes the hash of the displayed snapshot before enabling Accept |
| T02 | Replay of an old accept statement to bind a party to a changed proposal | consent is bound to the exact head hash; old hashes count as void evidence |
| T03 | Recipient accepts but proposer's item was already sold | commit needs the proposer's signed reservation; a reservation statement cannot be forged and vault-local reservation prevents double use within the proposer's vault, but cross-vault double promises are only detected, not prevented |
| T04 | Fork: proposer sends different revisions to different recipients as the same id | recipients compare cids with the other party when a statement arrives; two valid revisions with the same number freeze the proposal |
| T05 | Spam proposals to harass | recipient vault auto-quarantines senders above 10 proposals per 24 h and honors local blocks silently; proposer limit of 5 open |
| T06 | Clock manipulation to extend a deadline | deadlines are claims; each vault uses its own clock and a relay receipt time can only shorten the window (V10) |
| T07 | A revoked consent keeps binding the signer | F08 revocations void the consent (consent_revoked) and comms.consent.verify is re-checked inside the accepting transaction |
| T08 | Probing the counterparty's private block list | V01 checks only the principal's own list; the recipient drops blocked senders silently and returns nothing |

**Abuse controls**
- Proposer limit of 5 non-terminal proposals and cycles combined, and 20 create commands per day per vault.
- Recipient-side quarantine and mute; reports to a relay moderator are optional and local to that relay's hosting policy.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-015-09.T11 | abuse | PS-015-07.R03 | 11 proposals from one DID in 24 h; blocked sender; 6th open proposal at proposer | quarantine, silent hide, MUTINY_PROPOSAL_LIMIT |
| TEST-PS-015-09.T12 | abuse | PS-015-07.R02 | proposer erases identity, counterparty exports evidence | evidence retained and pseudonymized; signatures still verify |
| TEST-PS-015-09.T18 | integration | PS-015-07.R01, PS-015-01.R02 | relay fixture records every mailbox put during create, accept, counter and withdraw | mailbox contents are ciphertext only and metadata is limited to recipient mailbox id, size and time |
| TEST-PS-015-09.T23 | integration | PS-015-07.R04, PS-015-07.R02 | F10 export, deletion and retention sweep with a pseudonymized erased counterparty | section mutiny.proposals exported; erased DID replaced by the deletion pseudonym; signatures still verify; quarantined statements purged after 30 days |

## Dependencies

Module depends on: F02.S01.M02, F02.S01.M03, F02.S01.M04, F02.S02.M05, F02.S03.M02, F01.S03.M01, F07.S01.M01, F07.S02.M02, F08.S02.M02, F12.S03.M04, F16.S02.M03, F15.S01.M01, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
