# PS-021-07 — Privacy, retention and abuse: Cycle consent

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M01 Cycle consent](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/consent` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-021-07.R01** Cycle composition, values and consents are P2, travel only in end-to-end encrypted envelopes to the participants and are never published, federated or sent to push in plaintext; relays see recipient mailbox id, size and time only (PRV-5).
- **PS-021-07.R02** Evidence is retained for RET-EVIDENCE and pseudonymized, not deleted, if a participant erases their identity locally.
- **PS-021-07.R03** Coercion and spam through unwanted cycle proposals are limited by recipient-side muting, per-sender quarantine, the per-vault cap on open cycles from identities with no history, and the proposer's cap of 5 open cycles and proposals.
- **PS-021-07.R04** The UI states that pseudonymity is not anonymity and that counterparties can see the public items, pseudonyms and the distance bucket.
- **PS-021-07.R05** The module registers ExportSectionPort (section mutiny.cycles), DeletionPort and RetentionPurgePort with F10 (N6), annotates every Cycle and CycleConsent field with its F10.S02.M02 class, reports every committed or executing cycle of the principal as a DeletionPort.plan() blocker {kind: cycle, ref: cycleId, counterparties: the other participantIds}, and on privacy.deletion.completed pseudonymizes the erased participant in retained cycles.
- **PS-021-07.R06** Sybil rings are made visible rather than claimed impossible: each participant has a trust panel, key-linked rings need explicit confirmation, and the review screen recommends a simultaneous handover for legs adjacent to new identities.

## Specification

**Data classification**
- Cycle and CycleConsent: P2, device only; field classes annotated per F10.S02.M02 (DIDs P2, trust panel P2 derived, syncStates P2).
- Embedded ConsentStatement copies: P2; the signature evidences the signer's assertion on the exact digest, not delivery of any item.

**Retention**
- Terminal cycles: RET-EVIDENCE (2 years after last related activity).
- Quarantined incoming cycles from identities with no history: RET-SHORT 30 days.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Participant is led to sign terms other than the ones displayed | consent signs the revision digest; the UI recomputes the hash of the displayed snapshot and disables Sign on mismatch |
| T02 | Coordinator swaps a participant after consent | cycle revisions cannot change participants; any change is a new cycle needing new consent |
| T03 | Replay of an old consent on a new revision | consent binds the exact head number and digest, which also binds revisionNo and prev; other digests are void evidence |
| T04 | One vault commits while others do not and the cycle proceeds one-sidedly | execution requires each giver's own action; every handover is attested by the giver and the receiver, and dropout handling cancels before any handover |
| T05 | Deadline games using forged claimed times | claims never extend; the local clock decides and a relay-signed receipt time can only shorten the window; disagreement counts as expired |
| T06 | Sybil participants (free did:key) in a ring to extract real items | trust panel per participant (first-seen age, completed trades from F07.S03.M01, key linkage per N11), key-linked rings need confirmation, at most 3 open incoming cycles from identities with no history per vault across all senders, simultaneous handover recommended next to new identities; every real participant still signs consent and reserves their own item |
| T07 | Coordinator equivocation: different revision N sent to different participants | V14: a correctly signed consent on the head revision number with a different digest stores both hashes, calls mutiny.revision.report_fork, freezes the cycle and may request the conflicting revision from the signer |
| T08 | A revoked consent keeps binding its signer | comms.consent.revoked voids the consent (consent_revoked) and comms.consent.verify is re-checked inside the committing transaction; after commit the revocation is a dropout |

**Abuse controls**
- Proposer cap of 5 open cycles and proposals and 10 propose commands per day per vault.
- Recipients quarantine DIDs that send more than 10 cycle proposals in 24 h and silently ignore blocked or muted DIDs.
- At most 3 non-terminal incoming cycles per vault whose coordinator has no history, across all senders; the user can review and release quarantined ones.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-021-09.T08 | integration | PS-021-03.R03, PS-021-06.R03, PS-021-07.R06 | equivocation: coordinator sends revision 2 with digest H2a to Bob and H2b to Carol; Carol's correctly signed consent on revision 2 with H2b reaches Bob's vault whose head is H2a | V14: both hashes stored, mutiny.revision.report_fork called, mutiny.revision.forked emitted, cycle frozen, no consent counted |
| TEST-PS-021-09.T14 | abuse | PS-021-07.R03 | 11 proposals from one DID in 24 h; 6th open cycle at one proposer; 4 incoming cycles from coordinators with no history from different senders | quarantine, MUTINY_CYCLE_LIMIT, fourth quarantined silently |
| TEST-PS-021-09.T15 | integration | PS-021-07.R02, PS-021-07.R05 | participant erases identity; others export evidence; F10 export and retention sweep | section mutiny.cycles exported; records retained and pseudonymized; signatures still verify; quarantined incoming cycles purged after 30 days |
| TEST-PS-021-09.T16 | e2e | PS-021-07.R04, PS-021-01.R04 | mobile 3-party consent flow | disclosure that pseudonymity is not anonymity shown; consent statement text before Sign; trust panel shown; axe zero serious issues |
| TEST-PS-021-09.T22 | integration | PS-021-07.R01, PS-021-01.R03 | relay fixture records every mailbox put during propose, consent and decline | mailbox contents are ciphertext only and metadata is limited to recipient mailbox id, size and time |
| TEST-PS-021-09.T26 | abuse | PS-021-07.R06, PS-021-02.R04 | 2-Sybil ring: two fresh did:key identities sharing a device key invite a real member into a 3-party cycle | trust panel shows first seen 0 days and 0 completed trades, key-linked warning, consent requires confirmation, simultaneous handover recommended; quarantined when the unknown-coordinator cap is reached |
| TEST-PS-021-09.T30 | integration | PS-021-07.R05, PS-021-06.R02 | F10 deletion plan while C3 is executing, C4 proposed and C2 completed | plan() lists exactly one blocker {kind: cycle, ref: C3, counterparties: the two other participants}; C4 and C2 are not blockers; after C3 completes the plan has no blocker |

## Dependencies

Module depends on: F02.S03.M02, F02.S02.M03, F02.S02.M05, F02.S01.M02, F02.S01.M03, F02.S01.M04, F02.S04.M02, F08.S02.M02, F07.S01.M01, F07.S02.M02, F07.S03.M01, F12.S03.M04, F16.S02.M03, F15.S01.M01, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
