# PS-051-07 — Privacy, retention and abuse: Relevance ranking

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S03.M01 Relevance ranking](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/ranking/relevance` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-051-07.R01** Ranking uses only public document fields, query text and the coarse distance bucket; it uses no user identity, history or click data.
- **PS-051-07.R02** Promotion is shown honestly with a 'Promoted' label and a capped multiplier, and is relay-local policy, never claimed as global.
- **PS-051-07.R03** Config publication is auditable and rate limited to prevent silent manipulation.
- **PS-051-07.R04** Relay ranking is presented as that relay's claim; vaults re-apply the F06.S03.M02 page checks to every relay page and label a relay that breaks them, and no history can be flushed from view because get_active pages through the full 12 months.

## Specification

**Data classification**
- RankingConfig: P0 public; signed statement published by the relay; a vault keeps fetched relay configs only in the 24 h display cache.
- Scores: computed on demand, not stored; explain components contain no personal data.

**Retention**
- RankingConfig versions kept 12 months for transparency (RET-AUDIT, 1 year) on the relay; the vault keeps the bundled version and a 24 h display cache of fetched relay configs.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Operator quietly boosts own or paying listings, or runs a self-hosted relay that skips the fairness code | relay ranking is that relay's claim; promotion cap 1.25, mandatory label, signed publication statements with the full 12-month history readable page by page, and every relay page re-checked in the vault with F06.S03.M02 auditPage (at most 3 per author, promoted at most floor(20 percent) of the page, every promoted item labelled), a failing relay labelled 'ranking policy not followed' |
| T02 | Backdated or future claimedPublishedAt manipulates recency | recency anchor is the claim clamped by firstSeenAt (min(claim, firstSeenAt)), so post-dating gains nothing |
| T03 | Keyword stuffing to raise BM25 | bm25 saturation k, body length normalisation in FTS5 bm25, title weight bounded to 10, index caps body at 2000 code points |
| T04 | Config tampering in transit | Ed25519 signature over JCS bytes with the relay key and client verification before display |

**Abuse controls**
- 10 publications per 24 h per relay; every change logged with version and operator role only.
- Weights and caps validated by hard ranges so no setting can make promotion dominate (promotion boost at most 0.25).

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-051-09.T09 | abuse | PS-051-07.R02, PS-051-01.R03 | document with future claimedPublishedAt and expired promotion flag | recency uses firstSeenAt; no multiplier and no label |
| TEST-PS-051-09.T10 | abuse | PS-051-07.R03 | 11th publication in 24 h and tampered signed config | RATE_LIMITED from RateLimitPort; client rejects the tampered statement with RANKING_CONFIG_INVALID |
| TEST-PS-051-09.T15 | unit | PS-051-07.R01 | score() on the same candidates with and without identity, history, click and reputation fields | identical scores and order; extra fields never read |
| TEST-PS-051-09.T19 | integration | PS-051-07.R04, PS-051-04.R02 | relay with 60 versions over 6 months; get_active paged with limit 20 | all 60 versions reachable through nextCursor, none older than 12 months |
| TEST-PS-051-09.T20 | integration | PS-051-07.R04 | vault receives a relay page with 4 items of one author and an unlabelled promoted item, checked through F06.S03.M02 auditPage by F06.S01.M02 | relay labelled 'ranking policy not followed'; local ranking unchanged |

## Dependencies

Module depends on: F06.S02.M01, F06.S01.M01, F11.S01.M01, F11.S01.M03, F12.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
