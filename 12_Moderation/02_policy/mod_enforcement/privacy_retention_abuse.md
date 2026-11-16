# PS-096-07 — Privacy, retention and abuse: Enforcement actions

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M01 Enforcement actions](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/enforcement` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-096-07.R01** Cases and actions are P2 relay-side data, accessible to relay moderators and the subject, and never leave the relay except as the subject's statement, a public advisory and a tombstone.
- **PS-096-07.R02** Retention is RET-EVIDENCE, with legal hold override, and subject deletion leaves a pseudonymized record for the case duration.
- **PS-096-07.R03** Moderator abuse is limited by assignment, rule requirement, audit logging and operator reversal.

## Specification

**Data classification**
- ModerationCase: P2 (relay moderators); reporter identities are not stored on the case.
- EnforcementAction: P2 (relay moderators; subject sees own action without decider).
- Advisory statement: P0 content limited to target content id, rule ID and advice; no facts summary.

**Retention**
- Cases and actions: RET-EVIDENCE (2 years after last related activity).
- Internal notes: deleted 180 days after case closure unless an appeal or legal hold exists.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Moderator abuses power against a rival | actions need rule IDs and facts summary, are audit-logged (F16.S01.M01) and reversible by operators; subject can appeal to a different moderator |
| T02 | Silent suppression | no hidden action kinds exist; the subject always gets a signed statement; shadow restriction is rejected by schema |
| T03 | Forged statement of reasons used to scare a user | vault verifies relay signature and shows relay identity; unsigned statements are ignored |
| T04 | Over-broad effect misread as global ban | statements and UI state the relay-only scope and that other relays and local data are unaffected |
| T05 | Report-count brigading triggers removal | removal needs a human decider or deterministic rule recorded in ruleRefs; count alone is never a rule |

**Abuse controls**
- Moderators can apply at most 50 actions per day each (F12.S03.M03); operators receive a weekly action summary.
- Automated actions are limited to velocity throttles with expiry ≤ 1 hour and are labelled automated.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-096-09.T09 | abuse | PS-096-05.R02, PS-096-07.R03 | statement signed by wrong key; unsigned statement; schema with shadow kind | vault ignores first two; shadow kind rejected by validation |
| TEST-PS-096-09.T12 | integration | PS-096-01.R03, PS-096-07.R01, PS-096-07.R02 | subject deletes own account after action | pseudonymized case kept; legal hold prevents purge |
| TEST-PS-096-09.T13 | abuse | PS-096-07.R03 | moderator applies 51 actions in a day | 51st returns RATE_LIMITED; operator report lists all |

## Dependencies

Module depends on: F12.S02.M03, F12.S01.M02, F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
