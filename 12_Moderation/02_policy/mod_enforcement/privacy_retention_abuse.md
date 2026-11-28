# PS-096-07 — Privacy, retention and abuse: Enforcement actions

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M01 Enforcement actions](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/enforcement` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-096-07.R01** Cases and actions are P2 relay-side data, accessible to relay moderators and the subject, and never leave the relay except as the subject's statement of reasons or reversal and the opt-in public advisory with its retraction.
- **PS-096-07.R02** Retention is RET-EVIDENCE, with legal hold override, and subject deletion leaves a pseudonymized record for the case duration.
- **PS-096-07.R03** Moderator abuse is limited by assignment, rule requirement, principal-level conflict checks, audit logging and operator reversal.
- **PS-096-07.R04** Moderation never issues classrup.federation.tombstone/v1: remove_from_index changes only this relay's index, and other relays and vaults act only on the opt-in advisory under their own policy or subscription (F12.S01.M01).
- **PS-096-07.R05** The module meets N6 by registering ExportSectionPort, DeletionPort and RetentionPurgePort with F10, classifying case and action fields per F10.S02.M02, and consuming privacy.deletion.completed.

## Specification

**Data classification**
- ModerationCase: P2 (relay moderators); reporter identities are not stored on the case.
- EnforcementAction: P2 (relay moderators; subject sees own action without decider).
- Advisory and retraction statements: P0 content limited to target content id, rule ID, advice, sequence and expiresAt; no facts summary, no subject key.

**Retention**
- Cases and actions: RET-EVIDENCE (2 years after last related activity).
- Internal notes: deleted 180 days after case closure unless an appeal or legal hold exists.
- Advisories: served until expiresAt or retraction; retractions served 180 days.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Moderator abuses power against a rival | actions need in-force rule IDs and facts summary, are audit-logged (F16.S01.M01) and reversible by operators; subject can appeal to a different moderator |
| T02 | Silent suppression | no hidden action kinds exist; the subject always gets a signed statement; shadow restriction is rejected by schema |
| T03 | Forged statement of reasons used to scare a user | vault verifies relay signature and shows relay identity; unsigned statements are ignored |
| T04 | Over-broad effect misread as global ban | statements and UI state the relay-only scope and that other relays and local data are unaffected |
| T05 | Report-count brigading triggers removal | removal needs a human decider or deterministic rule recorded in ruleRefs; count alone is never a rule |
| T06 | One relay's moderators delete content on other relays and in other vaults | moderation never emits tombstones; advisories are opt-in, expiring and retractable (test T20) |
| T07 | Moderator with a second device key or a filed report decides the case | conflict checks by principal through key linkage and the report ledger (test T22) |
| T08 | Restriction used to block the appeal route | protected capabilities cannot be restricted (V08) |

**Abuse controls**
- Moderators can apply at most 50 actions per 24 h each (F12.S03.M03 class moderation.action.apply); operators receive a weekly action summary.
- Automated actions are limited to velocity throttles with expiry ≤ 1 hour and are labelled automated.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-096-09.T09 | abuse | PS-096-05.R02, PS-096-07.R03, PS-096-09.R03 | statement signed by wrong key; unsigned statement; schema with shadow kind | vault ignores first two; shadow kind rejected by validation |
| TEST-PS-096-09.T12 | integration | PS-096-01.R03, PS-096-07.R01, PS-096-07.R02 | subject's signed deletion request applied on the relay after an action; legal hold present; outbound traffic captured | pseudonymized case kept; hold prevents purge; only reasons, reversal, advisory and retraction statements ever left the relay |
| TEST-PS-096-09.T13 | abuse | PS-096-07.R03 | moderator applies 51 actions in 24 h | 51st returns RATE_LIMITED; operator report lists all |
| TEST-PS-096-09.T20 | abuse | PS-096-07.R04 | apply remove_from_index with publishAdvisory on listing L that relay Y mirrors; capture every outbound statement | no classrup.federation.tombstone/v1 produced; relay Y keeps its copy; only reasons and advisory statements sent |
| TEST-PS-096-09.T24 | integration | PS-096-07.R05 | ExportSectionPort run and privacy.deletion.completed in the subject vault with keepEvidence true and false | section moderation.actions exported; statements deleted or pseudonymized |
| TEST-PS-096-09.T26 | integration | PS-096-07.R02, PS-096-07.R01 | injected clock: case closed 181 days ago without appeal or hold; case and actions past RET-EVIDENCE with and without a legal hold | internal notes deleted at 180 days; RetentionPurgePort purges the unheld case and actions and keeps the held ones; nothing was ever sent off the relay except the documented statements |

## Dependencies

Module depends on: F12.S02.M03, F12.S01.M01, F12.S01.M02, F12.S03.M03, F06.S01.M01, F08.S01.M01, F07.S02.M01, F11.S01.M01, F16.S01.M01, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
