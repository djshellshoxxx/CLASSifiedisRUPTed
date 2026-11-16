# PS-098-07 — Privacy, retention and abuse: Account limits

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M04 Account limits](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/limits` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-098-07.R01** Limits are P2 relay-side data visible to the member and the relay's moderators and never federated.
- **PS-098-07.R02** Retention is RET-STANDARD with membership, and deletion removes the rows.
- **PS-098-07.R03** Abuse (limit evasion by many keys, moderator favoritism) is limited by per-prefix rate scopes, bounded overrides and audit logs.

## Specification

**Data classification**
- AccountLimit: P2 (member, relay moderators).
- Override reasons: P2 free text, shown to the member.

**Retention**
- Rows: RET-STANDARD, deleted 30 days after membership deletion.
- Override history: kept in the audit log for RET-AUDIT (1 year).

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Sybil keys evade limits | new tier is deliberately low (5 listings per day, 10 open offers), prefix-scoped rate limits in F12.S03.M03 and tenant caps apply |
| T02 | Moderator favoritism via unlimited overrides | override value bounded to 10 000, expiry max 90 days, reason required, weekly override report to operators, audit entries |
| T03 | Hidden penalty via risk multiplier | multiplier visible on the member's limits screen with its reason; friction-only semantics, minimum limit 1 |
| T04 | Limit probing to learn thresholds of rivals | check capability not routable over HTTP; members read only their own limits |

**Abuse controls**
- Override command limited to 30 per day per moderator via F12.S03.M03.
- Tier promotion requires both age and completed dealings, so farming one is insufficient.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-098-09.T10 | abuse | PS-098-07.R01, PS-098-07.R03 | 31 overrides by one moderator in a day | 31st RATE_LIMITED; weekly report lists all |
| TEST-PS-098-09.T11 | integration | PS-098-07.R02 | membership deletion | rows deleted after 30 days; audit history kept 1 year |

## Dependencies

Module depends on: F12.S03.M01, F12.S03.M03, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
