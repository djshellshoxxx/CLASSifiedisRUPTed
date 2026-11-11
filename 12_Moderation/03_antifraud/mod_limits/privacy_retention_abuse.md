# PS-098-07 — Privacy, retention and abuse: Account limits

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M04 Account limits](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/limits` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-098-07.R01** Limits are P2 relay-side data visible to the member and the relay's moderators and never federated.
- **PS-098-07.R02** Retention is RET-STANDARD with membership, and deletion removes the rows.
- **PS-098-07.R03** Abuse (limit evasion by many keys, moderator favoritism) is limited by per-prefix rate scopes, bounded overrides and audit logs.
- **PS-098-07.R04** Relay limits never depend on counts supplied by the subject's vault, and the relay learns of dealings only from completion statements the parties chose to submit, without amounts.
- **PS-098-07.R05** The module meets N6 by registering ExportSectionPort, DeletionPort and RetentionPurgePort with F10, classifying every AccountLimit field per F10.S02.M02, and consuming privacy.deletion.completed.

## Specification

**Data classification**
- AccountLimit: P2 (member, relay moderators).
- Counted completions: P2 (completion cid and the two keys; no amounts or obligations).
- Override reasons: P2 free text, shown to the member.

**Retention**
- Rows: RET-STANDARD, deleted 30 days after membership deletion.
- Override history: kept in the audit log for RET-AUDIT (1 year).

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Sybil keys evade limits | new tier is deliberately low (5 index writes, 20 new recipients and 20 bids per day), prefix-scoped rate limits in F12.S03.M03 and tenant caps apply |
| T02 | Moderator favoritism via unlimited overrides | override value bounded to 10 000, expiry max 90 days, reason required, weekly override report to operators, audit entries |
| T03 | Hidden penalty via risk multiplier | multiplier visible on the member's limits screen with its reason; friction-only semantics, minimum limit 1 |
| T04 | Limit probing to learn thresholds of rivals | check capability not routable over HTTP; members read only their own limits |
| T05 | Forged currentCount from the limited party's vault | checks take no counts; usage is the relay's own bucket state |
| T06 | Tier farming with self-signed completions between own keys | principal linkage check, 7-day counterparty age and one counted completion per pair per 30 days |
| T07 | Overturned restriction keeps a limit at 0 | revert and expiry clear actionRestriction; until lapses even without the event |
| T08 | Sybil keys flood the comment period of a policy proposal | keys first seen less than 7 days ago get 1 comment per proposal and 25 per proposal in total, on top of the per-key and per-prefix comment classes of F12.S03.M03 |

**Abuse controls**
- Override command limited to 30 per 24 h per moderator via F12.S03.M03.
- Completion submissions limited to 20 per 24 h per key via F12.S03.M03.
- Tier promotion requires both age and counted completions, so farming one is insufficient.
- Governance comments from keys first seen less than 7 days ago: 1 per key per proposal and 25 per proposal (new_key_comments_per_proposal).

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-098-09.T10 | abuse | PS-098-07.R03 | 31 overrides by one moderator in 24 h | 31st RATE_LIMITED; weekly report lists all |
| TEST-PS-098-09.T11 | integration | PS-098-07.R02 | relay applies a member's signed deletion request; injected clock +30 days | rows and counted completions deleted after 30 days; audit history kept 1 year |
| TEST-PS-098-09.T17 | abuse | PS-098-04.R05, PS-098-07.R04 | submit_completion: valid B–C statement; same completionCid again; one signature invalid; submitter not a party; A with counterparty first seen 2 days ago; second B–C completion within 30 days; A–D completion | counted once; duplicate returns the stored result; FORBIDDEN twice; PRECONDITION_FAILED with counterparty_too_new, pair_counted_recently and same_principal; no amount ever stored |
| TEST-PS-098-09.T18 | integration | PS-098-07.R05 | ExportSectionPort run in a vault holding cached limit snapshots, then privacy.deletion.completed; relay DeletionPort plan | section moderation.limits exported; cached snapshots deleted; relay plan lists rows for deletion after 30 days |
| TEST-PS-098-09.T20 | abuse | PS-098-07.R01, PS-098-07.R04 | F12 privacy suite: inspect federation payloads, public projections, relay logs, events and member exports after limit changes and counted completions | no AccountLimit field appears in federation payloads, public projections or logs; no amounts, obligations or deal context appear; limit.changed carries no counterparty key |

## Dependencies

Module depends on: F12.S03.M03, F07.S02.M01, F16.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
