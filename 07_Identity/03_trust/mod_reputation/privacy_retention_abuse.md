# PS-058-07 — Privacy, retention and abuse: Reputation

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S03.M01 Reputation](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/trust/reputation` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-058-07.R01** Reviews are statements by individuals about transactions and are P1; subject-only reviews travel end-to-end encrypted, and comments never contain exact addresses or contact data by rule and by warning.
- **PS-058-07.R02** Reputation is shown with its provenance - the number of reviews and sources seen by this device - because no party holds the complete set.
- **PS-058-07.R03** The product states that dampening reduces but does not remove the effect of fake identities and colluding parties.
- **PS-058-07.R04** The module meets the N6 privacy duties - it registers ExportSectionPort (sections identity.reviews and identity.review_windows), DeletionPort (pseudonymize reviews and windows kept as RET-EVIDENCE, delete the rest, tombstone own public reviews if the user chooses) and RetentionPurgePort, classifies fields with F10.S02.M02, calls privacy.consent.check(federation_publish, relayId) before queuing any public review to a relay, and treats privacy.deletion.completed only as final cleanup.
- **PS-058-07.R05** Summary inputs are chosen by weight and author diversity, not by recency - every review with weight at least 0.5 is kept, the rest are taken by descending weight with at most 3 per author, up to 500 per subject - so a subject cannot bury genuine reviews with self-made ones.

## Specification

**Data classification**
- Review: P1 when public (only pairRef, no context ids), P2 when subject-only; comments are free text and may be reported to a relay; ReviewWindow and tickets P2; ReputationSummary P1 derived; no-show claims P2 inputs.

**Retention**
- Reviews and windows RET-EVIDENCE (2 years after last related activity), pseudonymized on account deletion; withdrawn reviews keep only a tombstone for 180 days; quarantined reviews 30 days.
- On vault erase everything local is deleted or pseudonymized as above; copies in other vaults and relays remain and are removed only by signed tombstones of their authors.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Fake positive reviews from sybil identities (Douceur 2002) | weights by observed author age, author's own completion count, repetition, reciprocity and island detection; raw counts and sources always shown; honest limit - free identity creation cannot be fully defended without a central authority |
| T02 | Fabricated contexts between two colluding identities | the ticket needs the subject's signature, so collusion requires two keys the attacker controls; the cost is low, so such pairs are dampened by repetition and island rules and the UI notes the limit |
| T03 | Retaliatory negative reviews | reviews need a ticket from a real opening, one review per pair, 30 day window, outcome label, withdraw option; double-blind commit-reveal is Future |
| T04 | Subject suppresses bad reviews | tickets are exchanged at opening, so withholding a completion signature or never completing does not block a review (outcome cancelled or disputed); input selection keeps reviews with weight at least 0.5 against burial; honest limit - a modified client can withhold its opening ticket, which limits the counterparty to a subject_only review until producers require tickets at opening, and a viewer who sees only the subject's relay may miss reviews |
| T05 | Review bombing by many real counterparties | each review needs a distinct pair ticket; ranking does not use reputation in MVP; viewers see raw distribution |
| T06 | Comment used for harassment or doxxing | plain text, 500 code points, local hide, report to the relay hosting policy, withdraw by author |
| T07 | Transaction graph reconstruction from public reviews (CTR-PRV-001 P2 cycle data) | per-pair blinded pairRef and per-pair tickets only; contextId, completionCid and dispute case cids only in subject_only reviews |
| T08 | Relay withdraws or hides a user's review in other vaults | only a tombstone authored by the review author withdraws it; relay tombstones and hosting actions affect only that relay's copy and provenance |
| T09 | A modified local producer emits a completion event without real completion statements to unlock 'confirmed' reviews | the window opens only after the completion statements behind completionCid verify in the vault record store (V13); otherwise it stays quarantined |
| T10 | A false no-show claim harms the accused | the claim has weight 0, is labelled a claim with its reporter, and a contradicting check-in is shown next to it |

**Abuse controls**
- Author limit 30 reviews per 24 hours; vault intake 200 reviews and 200 tickets per hour per transport source; per subject at most 500 reviews are selected by weight and author diversity (every review with weight at least 0.5 kept, at most 3 per author); limits run through the bus RateLimitPort (F12.S03.M03, N18).
- Sybil dampening weights - w_age = clamp(authorAgeDays/30, 0.1, 1) from the earliest local sighting of the author's DID; w_exp = min(1, 0.25 + 0.25 times author's completed contexts known, at least 0.5); w_repeat = 1/n for the n-th review by one author about one subject in 180 days; w_recip = 0.5 when author and subject reviewed each other 2 or more times in 180 days; w_island = 0.25 for a review graph component of at most 6 DIDs with at least 6 edges and no edge to a DID outside the component, otherwise 1; w_outcome = 1.0 completed, 0.75 disputed, 0.5 cancelled; reviewers the viewer has a completed context with get a floor of 0.8; no-show claims weight 0.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-058-09.T06 | abuse | PS-058-07.R02, PS-058-09.R03 | ring of 5 new DIDs posting 30 five-star reviews about one subject | effective weight is under 15 percent of raw, dampeningNotice is island or many_new_authors, raw count and source count still displayed |
| TEST-PS-058-09.T11 | abuse | PS-058-02.R03, PS-058-05.R02, PS-058-07.R01 | 31 reviews in 24 hours by one author; 201 received per hour from one source; a subject_only review read without the subject key; a comment containing a phone number | RATE_LIMITED for the 31st and excess quarantined; the subject_only review is unreadable; the composer warns about the contact data before signing |
| TEST-PS-058-09.T20 | abuse | PS-058-07.R05, PS-058-09.R04 | 40 genuine reviews, then 500 sybil reviews about the same subject from new DIDs | every genuine review with weight at least 0.5 stays selected; at most 3 per sybil author; the average moves by less than 0.3 |
| TEST-PS-058-09.T25 | integration | PS-058-07.R04 | F10 export, deletion and retention sweep with stub registries; public review to a relay without federation_publish consent | sections exported; reviews and windows pseudonymized, not deleted; the relay is skipped and shown |
| TEST-PS-058-09.T27 | e2e | PS-058-07.R03, PS-058-09.R05 | UI copy check of the reputation card and review sheet in every locale bundle | dampening honesty text, 'based on N reviews from M sources seen by this device', outcome labels and the public-review privacy note are present |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S01.M01, F11.S01.M02, F09.S01.M01, F09.S02.M02, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-COM-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
