# PS-012-07 — Privacy, retention and abuse: Barter counteroffers

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S01.M04 Barter counteroffers](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/trade_proposals/counteroffer` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-012-07.R01** Revisions are P2, end-to-end encrypted in transit and never published, federated or sent to push in plaintext.
- **PS-012-07.R02** Evidence retention is RET-EVIDENCE (2 years after last related activity) and revisions are pseudonymized, not deleted, if a party deletes their identity locally, because the counterparties' signed copies stay valid.
- **PS-012-07.R03** Spam by revision flooding is bounded by the 20-revision cap and local rate limits.
- **PS-012-07.R04** The module registers ExportSectionPort (section mutiny.revisions), DeletionPort and RetentionPurgePort with F10 (N6), annotates every ProposalRevision field with its F10.S02.M02 class, and on privacy.deletion.completed pseudonymizes local metadata while signed snapshots remain verifiable evidence.

## Specification

**Data classification**
- ProposalRevision: P2; snapshot contains pseudonym DIDs, item references, declared values and deadlines; no address or exact location.
- sig and contentHash are public-derivable but only accompany the encrypted envelope.

**Retention**
- RET-EVIDENCE 2 years after the last related activity of the subject.
- Quarantined statements: RET-SHORT 30 days, then purged.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | A party presents terms different from those the other party signs | consent signs contentHash; each vault recomputes the hash from the snapshot it displays and refuses mismatches |
| T02 | Revision replayed from an older state to trick a party | revision numbers and prev chain; an older number is a duplicate or a fork and never becomes head |
| T03 | Forged revision attributed to a party | Ed25519 signature must verify against a registered device key of that DID; otherwise quarantine |
| T04 | Swapping a cycle participant through a revision | cycle revisions may not change parties or items; a new cycle requires fresh consent from everyone |
| T05 | Backdated createdAtClaim to defeat deadlines | claims are never used for ordering or deadlines; each vault uses its own clock and treats disagreement as expired |

**Abuse controls**
- At most 20 revisions per subject and at most 10 revision creations per subject per hour per vault.
- Peers whose statements are quarantined more than 5 times in 24 h are muted locally for that subject.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-012-09.T09 | integration | PS-012-06.R03, PS-012-01.R04, PS-012-07.R01 | offline create then reconnect | syncState prepared then transport_acknowledged; relay fixture sees only ciphertext with mailbox id, size and time |
| TEST-PS-012-09.T20 | abuse | PS-012-07.R03 | 11 revision creates on one subject within an hour, then a 21st revision | RATE_LIMITED for the 11th; MUTINY_REVISION_LIMIT for the 21st |
| TEST-PS-012-09.T21 | integration | PS-012-07.R02, PS-012-07.R04 | F10 export, deletion of a party and retention sweep | section mutiny.revisions exported with sig; erased DID pseudonymized in local metadata; signatures still verify; quarantined statements purged after 30 days |

## Dependencies

Module depends on: F02.S01.M02, F02.S01.M03, F02.S02.M05, F02.S04.M01, F02.S04.M02, F07.S01.M01, F07.S02.M02, F16.S02.M03, F15.S01.M01, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
