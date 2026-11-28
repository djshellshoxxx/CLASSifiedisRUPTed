# PS-018-07 — Privacy, retention and abuse: N-party cycle engine

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M03 N-party cycle engine](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/n` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-018-07.R01** Matching consumes only public projections and the local principal's private data; it never reads another party's P2 or P3 records.
- **PS-018-07.R02** Suggestions are P2, stay in the vault, and are purged 30 days after creation unless they led to a proposal, in which case the proposal evidence is retained under RET-EVIDENCE by F02.S03.M01.
- **PS-018-07.R03** A relay that computes suggestions knows each ring composition it computed, a derived P2 composition, and learns from mailbox metadata which participants fetched it; it keeps computed rings RET-EPHEMERAL, never logs them, delivers them only as end-to-end encrypted envelopes, and receives no proposal or accept feedback, and this limit is shown in the F02.S02.M04 opt-in disclosure.
- **PS-018-07.R04** Gaming by flash wants, fake inventory or self-dealing rings is limited by want age, per-participant caps, local rechecking, the trust panel, exclusion of identities with no history by default and the key-linked ring flag.
- **PS-018-07.R05** The module registers ExportSectionPort (section mutiny.suggestions), DeletionPort and RetentionPurgePort with F10 (N6), annotates CycleSuggestion and CompatibilityGraph fields with their F10.S02.M02 class, and purges graph caches through RetentionPurgePort 24 h after startedAt.

## Specification

**Data classification**
- CycleSuggestion: P2, device only; contains pseudonym DIDs and public item references, no address, no exact location (distance bucket only).
- CompatibilityGraph: P2, derived, never exported, never logged.
- Excluded counterparties and local blocks are P3 inputs; they filter edges locally (F07.S02.M02 filterBlocked) and appear in no event, log or relay request.
- Relay-computed rings: P2 derived compositions held RET-EPHEMERAL by the relay only for delivery, never logged; mailbox fetch metadata (mailbox id, size, time) is visible to the relay.

**Retention**
- CycleSuggestion: RET-SHORT, purged 30 days after createdAt (dismissal suppression ends at 30 days).
- CompatibilityGraph: RET-EPHEMERAL, purged after 24 h.
- Relay ring compositions: RET-EPHEMERAL, deleted once the envelopes are delivered or after 24 h, whichever is first.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | A malicious relay fabricates a cycle to steer a user into a bad trade | the vault re-derives every leg from retained signed projections; unverifiable suggestions are labelled unverified and cannot be proposed |
| T02 | Sybil identities (free did:key) create fake wants and haves to form rings that extract real items | trust panel per participant (first-seen age, completed trades from F07.S03.M01, key linkage per N11), identities with no history excluded by default, key-linked rings flagged and not proposable without confirmation, simultaneous handover recommended next to new identities, wants at least 15 minutes old, and every giver still signs consent and a reservation |
| T03 | Relay learns who is likely to trade with whom from suggestions | stated honestly: the relay knows each ring it computed and who fetched it; rings are RET-EPHEMERAL and never logged, no proposal or accept feedback reaches the relay, and users can choose a relay with matching disabled or run vault-only |
| T04 | Resource exhaustion by a huge graph | caps of 2000 nodes, 20000 edges, 100000 expansions and 250 ms, partitioning by L1 cell |
| T05 | Inference that a counterparty excluded or blocked someone | exclusions are applied locally only; the relay cannot apply them, so the recipient vault silently drops such suggestions and sends no signal |

**Abuse controls**
- Per-vault rate limit of 6 generate runs per hour; relay rate limit 1 compute_public run per partition per 5 minutes.
- Wants younger than 15 minutes and valuations flagged implausible are excluded from the graph.
- Signals about repeated dismissals by the same participant are local only; no global reputation write.
- Identities with no history are excluded by default; at most 1 key-linked ring is shown per run and it carries a warning.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-018-09.T13 | abuse | PS-018-07.R01, PS-018-07.R04 | want younger than 15 minutes, implausible valuation, 7th run in an hour | excluded from graph and RATE_LIMITED respectively |
| TEST-PS-018-09.T14 | integration | PS-018-07.R02, PS-018-07.R03 | suggestion older than 30 days; relay compute_public delivery | purged by retention sweep; relay envelope is ciphertext only; relay ring store empty after delivery and absent from relay logs; no proposal or accept message is sent to the relay |
| TEST-PS-018-09.T22 | abuse | PS-018-07.R04, PS-018-02.R02 | 2-Sybil ring: two fresh did:key identities sharing a device key form a 3-ring with a real member | with default settings the ring is not suggested; with includeUnknownIdentities on it is flagged keyLinked, trust panel shows first seen 0 days and 0 completed trades, MUTINY_RING_KEY_LINKED without confirmation, simultaneous handover recommended |
| TEST-PS-018-09.T25 | integration | PS-018-07.R05 | F10 export, deletion and retention sweep | section mutiny.suggestions exported; erased principal's suggestions and graphs deleted; graph caches purged at 24 h |

## Dependencies

Module depends on: F02.S02.M04, F02.S02.M05, F02.S04.M03, F01.S01.M01, F01.S02.M02, F01.S03.M01, F06.S02.M01, F07.S02.M02, F07.S02.M01, F07.S03.M01, F07.S03.M02, F09.S03.M02, F09.S03.M03, F11.S01.M01, F11.S01.M02, F16.S02.M03, F15.S01.M01, F15.S04.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-OBS-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
