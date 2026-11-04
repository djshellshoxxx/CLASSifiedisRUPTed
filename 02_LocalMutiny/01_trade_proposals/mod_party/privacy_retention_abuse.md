# PS-014-07 — Privacy, retention and abuse: Proposal party roster

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S01.M02 Proposal party roster](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/trade_proposals/party` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-014-07.R01** No roster field, event or error reveals that a block exists or who holds it; the principal's own block list never leaves the vault.
- **PS-014-07.R02** The roster holds pseudonym DIDs and relay ids only and is retained as evidence for 2 years with its subject.
- **PS-014-07.R03** Subject spam against a person is limited by the principal-side limit of 5 open subjects and by recipients' local filtering.

## Specification

**Data classification**
- ProposalParty: P2; DIDs and relay routing hints only.

**Retention**
- RET-EVIDENCE with the subject (2 years after last related activity).

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Probing who blocked whom by trying rosters | generic BLOCKED_PARTY and unavailable codes only, checked on the principal's own list |
| T02 | Fake roster entries forcing a person into a cycle | a party becomes bound only by its own signed consent and reservation; roster rows alone bind nobody |
| T03 | Reroute by silent substitution | positions are fixed by the signed revision and left parties are never replaced |
| T04 | Harassment by repeated proposals naming the same person | recipient vault can mute the proposer; per-proposer limit of 5 open subjects at the proposer |

**Abuse controls**
- Recipients' vaults auto-hide proposals from DIDs the recipient blocked or muted, silently.
- A DID that sends more than 10 proposals to one recipient in 24 h is quarantined at the recipient.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-014-09.T03 | contract | PS-014-02.R02, PS-014-07.R01 | roster containing a locally blocked DID | BLOCKED_PARTY with params that do not include any DID |
| TEST-PS-014-09.T10 | abuse | PS-014-07.R02, PS-014-07.R03 | 11 proposals from one DID in 24 h; 6th open subject by one proposer | quarantine and MUTINY_PARTY_LIMIT |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, F12.S03.M04, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
