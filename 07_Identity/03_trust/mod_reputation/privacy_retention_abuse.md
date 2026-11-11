# PS-058-07 — Privacy, retention and abuse: Reputation

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S03.M01 Reputation](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/trust/reputation` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-058-07.R01** Reviews are statements by individuals about transactions and are P1; subject-only reviews travel end-to-end encrypted, and comments never contain exact addresses or contact data by rule and by warning.
- **PS-058-07.R02** Reputation is shown with its provenance - the number of reviews and sources seen by this device - because no party holds the complete set.
- **PS-058-07.R03** The product states that dampening reduces but does not remove the effect of fake identities and colluding parties.

## Specification

**Data classification**
- Review: P1 when public, P2 when subject-only; comments are free text and may be reported to a relay; ReviewWindow P2; ReputationSummary P1 derived.

**Retention**
- Reviews and windows RET-EVIDENCE (2 years after last related activity); withdrawn reviews keep only a tombstone for 180 days; quarantined reviews 30 days.
- On vault erase everything local is deleted; copies in other vaults and relays remain and are removed only by signed tombstones.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Fake positive reviews from sybil identities (Douceur 2002) | weights by observed author age, author's own completion count, repetition, reciprocity and island detection; raw counts and sources always shown; honest limit - free identity creation cannot be fully defended without a central authority |
| T02 | Fabricated completions between two colluding identities | the proof needs both parties' signatures, so collusion requires two keys the attacker controls; the cost is low, so such pairs are dampened by repetition and island rules and the UI notes the limit |
| T03 | Retaliatory negative reviews | reviews need a real completion proof, one review per pair and context, 30 day window, withdraw option; double-blind commit-reveal is Future |
| T04 | Subject suppresses bad reviews | reviews are authored and distributed by the reviewer to relays they choose, and the summary shows source count; honest limit - a viewer who sees only the subject's relay may miss reviews |
| T05 | Review bombing by many real counterparties | each review needs a distinct completion context; ranking does not use reputation in MVP; viewers see raw distribution |
| T06 | Comment used for harassment or doxxing | plain text, 500 code points, local hide, report to the relay hosting policy, withdraw by author |

**Abuse controls**
- Author limit 30 reviews per 24 hours; vault intake 200 reviews per hour per transport source; per subject the vault uses at most the newest 500 reviews.
- Sybil dampening weights - w_age = clamp(authorAgeDays/30, 0.1, 1) from the earliest local sighting of the author's DID; w_exp = min(1, 0.25 + 0.25 times author's completed contexts known, at least 0.5); w_repeat = 1/n for the n-th review by one author about one subject in 180 days; w_recip = 0.5 when author and subject reviewed each other 2 or more times in 180 days; w_island = 0.25 for a review graph component of at most 6 DIDs with at least 6 edges and no edge to a DID outside the component, otherwise 1; reviewers the viewer has a completed context with get a floor of 0.8.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-058-09.T06 | abuse | PS-058-07.R01, PS-058-07.R02 | ring of 5 new DIDs posting 30 five-star reviews about one subject | effective weight is under 15 percent of raw, dampeningNotice is island or many_new_authors, raw count still displayed |
| TEST-PS-058-09.T07 | abuse | PS-058-07.R03, PS-058-02.R03 | collusion pair posts 6 reviews on fabricated completions | repeat and reciprocity weights reduce them; all but the first per context refused as duplicates |
| TEST-PS-058-09.T11 | abuse | PS-058-07.R01, PS-058-07.R02, PS-058-07.R03 | 31 reviews in 24 hours by one author; 201 received per hour from one source | RATE_LIMITED for the 31st and excess quarantined; no subject-only review readable without the key |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-COM-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
