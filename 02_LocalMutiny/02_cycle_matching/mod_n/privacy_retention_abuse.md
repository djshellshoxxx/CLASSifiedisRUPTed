# PS-018-07 — Privacy, retention and abuse: N-party cycle engine

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M03 N-party cycle engine](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/n` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-018-07.R01** Matching consumes only public projections and the local principal's private data; it never reads another party's P2 or P3 records.
- **PS-018-07.R02** Suggestions are P2, stay in the vault, and are purged 30 days after creation unless they led to a proposal, in which case the proposal evidence is retained under RET-EVIDENCE by F02.S03.M01.
- **PS-018-07.R03** A relay run learns nothing beyond the public projections it already indexes and delivers suggestions only as end-to-end encrypted envelopes to participant mailboxes.
- **PS-018-07.R04** Gaming by flash wants, fake inventory or self-dealing rings is limited by want age, per-participant caps and local verification.

## Specification

**Data classification**
- CycleSuggestion: P2, device only; contains pseudonym DIDs and public item references, no address, no exact location (distance bucket only).
- CompatibilityGraph: P2, derived, never exported, never logged.
- Excluded counterparties and local blocks are P3 inputs; they filter edges locally and appear in no event, log or relay request.

**Retention**
- CycleSuggestion: RET-SHORT, purged 30 days after createdAt (dismissal suppression ends at 30 days).
- CompatibilityGraph: RET-EPHEMERAL, purged after 24 h.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | A malicious relay fabricates a cycle to steer a user into a bad trade | the vault re-derives every leg from retained signed projections; unverifiable suggestions are labelled unverified and cannot be proposed |
| T02 | Sybil identities create fake wants and haves to form rings that extract real items | wants must be at least 15 minutes old, one active suggestion per participant, proposals still need explicit signed consent and local reservation by each giver, and F12 local signals can hide identities |
| T03 | Relay learns who is likely to trade with whom from suggestions | only public projections are used and suggestions are delivered as encrypted envelopes; users can choose a relay with matching disabled or run vault-only |
| T04 | Resource exhaustion by a huge graph | caps of 2000 nodes, 20000 edges, 100000 expansions and 250 ms, partitioning by L1 cell |
| T05 | Inference that a counterparty excluded or blocked someone | exclusions are applied locally only; the relay cannot apply them, so the recipient vault silently drops such suggestions and sends no signal |

**Abuse controls**
- Per-vault rate limit of 6 generate runs per hour; relay rate limit 1 compute_public run per partition per 5 minutes.
- Wants younger than 15 minutes and valuations flagged implausible are excluded from the graph.
- Signals about repeated dismissals by the same participant are local only; no global reputation write.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-018-09.T13 | abuse | PS-018-07.R01, PS-018-07.R04 | want younger than 15 minutes, implausible valuation, 7th run in an hour | excluded from graph and RATE_LIMITED respectively |
| TEST-PS-018-09.T14 | integration | PS-018-07.R02, PS-018-07.R03 | suggestion older than 30 days; relay delivery | purged by retention sweep; relay envelope is ciphertext only |

## Dependencies

Module depends on: F02.S02.M04, F02.S02.M05, F02.S04.M03, F01.S01.M01, F01.S02.M02, F01.S03.M01, F06.S02.M01, F07.S02.M02, F09.S03.M02, F09.S03.M03, F11.S01.M02, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-OBS-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
