# PS-051-07 — Privacy, retention and abuse: Relevance ranking

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S03.M01 Relevance ranking](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/ranking/relevance` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-051-07.R01** Ranking uses only public document fields, query text and the coarse distance bucket; it uses no user identity, history or click data.
- **PS-051-07.R02** Promotion is shown honestly with a 'Promoted' label and a capped multiplier, and is relay-local policy, never claimed as global.
- **PS-051-07.R03** Config publication is auditable and rate limited to prevent silent manipulation.

## Specification

**Data classification**
- RankingConfig: P0 public; signed statement published by the relay.
- Scores: computed on demand, not stored; explain components contain no personal data.

**Retention**
- RankingConfig versions kept 12 months for transparency (RET-STANDARD) on the relay; vault keeps the bundled version only.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Operator quietly boosts own or paying listings | promotion cap 1.25, mandatory label, signed publication statement with version history of 20 visible to clients, per-page promoted share limit in F06.S03.M02 |
| T02 | Backdated or future claimedPublishedAt manipulates recency | recency anchored on min(claim, firstSeenAt), never on claims alone |
| T03 | Keyword stuffing to raise BM25 | bm25 saturation k, body length normalisation in FTS5 bm25, title weight bounded to 10, index caps body at 2000 code points |
| T04 | Config tampering in transit | Ed25519 signature over JCS bytes with the relay key and client verification before display |

**Abuse controls**
- 10 publications per 24 h per relay; every change logged with version and operator role only.
- Weights and caps validated by hard ranges so no setting can make promotion dominate (promotion boost at most 0.25).

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-051-09.T09 | abuse | PS-051-07.R01, PS-051-07.R02, PS-051-01.R03 | document with future claimedPublishedAt and expired promotion flag | recency uses firstSeenAt; no multiplier and no label |
| TEST-PS-051-09.T10 | abuse | PS-051-07.R03, PS-051-02.R03 | 11th publication in 24 h and tampered signed config | RATE_LIMITED; client rejects the tampered statement |

## Dependencies

Module depends on: F06.S02.M01, F06.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
