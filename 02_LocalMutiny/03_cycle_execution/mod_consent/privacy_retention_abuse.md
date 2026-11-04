# PS-021-07 — Privacy, retention and abuse: Cycle consent

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M01 Cycle consent](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/consent` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-021-07.R01** Cycle composition, values and consents are P2, travel only in end-to-end encrypted envelopes to the participants and are never published, federated or sent to push in plaintext.
- **PS-021-07.R02** Evidence is retained for RET-EVIDENCE and pseudonymized, not deleted, if a participant erases their identity locally.
- **PS-021-07.R03** Coercion and spam through unwanted cycle proposals are limited by recipient-side muting, per-sender quarantine, and the proposer's cap of 5 open cycles and proposals.
- **PS-021-07.R04** The UI states that pseudonymity is not anonymity and that counterparties can see the public items, pseudonyms and the distance bucket.

## Specification

**Data classification**
- Cycle and CycleConsent: P2, device only.
- Embedded ConsentStatement envelopes: P2; the signature evidences the signer's assertion on the exact hash, not delivery of any item.

**Retention**
- Terminal cycles: RET-EVIDENCE (2 years after last related activity).
- Quarantined statements: RET-SHORT 30 days.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Participant is led to sign terms other than the ones displayed | consent signs the revision hash; the UI recomputes the hash of the displayed snapshot and disables Sign on mismatch |
| T02 | Coordinator swaps a participant after consent | cycle revisions cannot change participants; any change is a new cycle needing new consent |
| T03 | Replay of an old consent on a new revision | consent binds the exact hash; other hashes are void evidence |
| T04 | One vault commits while others do not and the cycle proceeds one-sidedly | execution requires each giver's own action; every handover is attested by the giver and the receiver, and dropout handling cancels before any handover |
| T05 | Deadline games using forged claimed times | claims never decide; the local clock and any relay-signed receipt time do; disagreement counts as expired |
| T06 | Sybil participants in a ring to extract real items | each real participant must sign consent and reserve their own item; no one can be bound without their key; local filters and reputation signals apply |
| T07 | Forked coordinator sends different revisions to different participants | participants compare cids on any exchange and a mismatch freezes the cycle at that vault |

**Abuse controls**
- Proposer cap of 5 open cycles and proposals and 10 propose commands per day per vault.
- Recipients quarantine DIDs that send more than 10 cycle proposals in 24 h and silently ignore blocked or muted DIDs.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-021-09.T06 | integration | PS-021-01.R04, PS-021-03.R04, PS-021-07.R04 | 4-party with Dan's consent arriving after deadline on Alice's clock | no commit at Alice's vault, cycle expires, reservations released, disagreement counted expired |
| TEST-PS-021-09.T14 | abuse | PS-021-07.R03, PS-021-07.R01 | 11 proposals from one DID in 24 h; 6th open cycle at one proposer | quarantine and MUTINY_CYCLE_LIMIT |
| TEST-PS-021-09.T15 | abuse | PS-021-07.R02 | participant erases identity; others export evidence | records retained and pseudonymized; signatures still verify |
| TEST-PS-021-09.T16 | e2e | PS-021-07.R04, PS-021-01.R04 | mobile 3-party consent flow | disclosure that pseudonymity is not anonymity shown; consent statement text before Sign; axe zero serious issues |

## Dependencies

Module depends on: F02.S03.M02, F02.S02.M03, F02.S02.M05, F02.S01.M02, F02.S01.M03, F02.S01.M04, F02.S04.M02, F08.S02.M02, F07.S01.M01, F12.S03.M04, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
