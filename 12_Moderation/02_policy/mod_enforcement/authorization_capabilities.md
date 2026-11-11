# PS-096-05 — Authorization and capabilities: Enforcement actions

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M01 Enforcement actions](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/enforcement` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-096-05.R01** Relay policy: relay moderators work cases and apply actions up to their limits, operators open cases, apply permanent suspensions and revert any action, and admins assign roles through F16.S01.M01.
- **PS-096-05.R02** Vault policy: a user's vault accepts a statement of reasons only when signed by the issuing relay key, shows it with the relay name, and never changes local records because of it.
- **PS-096-05.R03** A moderator cannot decide a case in which their own principal, by any linked key, is the subject or a reporter.
- **PS-096-05.R04** Conflict-of-interest checks compare principals, not single keys, using the F07.S02.M01 key set (device keys and seq chain), same-owner attestations and the relay moderator registry, in assignment, apply, close and revert.
- **PS-096-05.R05** Keys suspended or restricted on this relay keep moderation.appeal.receive, moderation.appeal.withdraw, moderation.appeal.read_status_own, moderation.action.read_own and moderation.evidence.read_as_subject, in addition to the CAP-5 read, export and deletion rights.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| moderation.case.open | operator | relay role operator; principal is not the subject |
| moderation.case.assign | moderator, operator | relay role; case in tenant; assignee principal is neither the subject nor a reporter of a linked report |
| moderation.case.close | moderator, operator | relay role; case assigned to actor or actor is operator |
| moderation.action.apply | moderator, operator | relay role; assigned to the case; permanent suspension only operator; actor principal is neither the subject nor a reporter of a linked report |
| moderation.action.revert | moderator, operator | operator any action; moderator only own actions within 7 days; appeal reversal and replacement are system |
| moderation.action.receive | local principal | vault unlocked; statement signed by the issuing relay key and addressed to the local principal |
| moderation.case.read_queue | moderator, operator | relay role |
| moderation.action.read_own | member | action.subjectKey = actor (relay access token or signed request); stays allowed while the key is suspended or restricted |
| moderation.action.read_restrictions | operator | internal relay policy lookup used by authorize(); not exposed to members |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-096-09.T08 | abuse | PS-096-05.R01, PS-096-05.R03 | moderator suspends permanently; moderator decides a case about self; non-moderator applies | MODERATION_ACTION_LIMIT, FORBIDDEN, FORBIDDEN |
| TEST-PS-096-09.T09 | abuse | PS-096-05.R02, PS-096-07.R03, PS-096-09.R03 | statement signed by wrong key; unsigned statement; schema with shadow kind | vault ignores first two; shadow kind rejected by validation |
| TEST-PS-096-09.T22 | abuse | PS-096-05.R04 | M2 applies on a case whose subject lists M2's second key; M2 applies on a case with M2's report linked; assignment of M2 to either case | FORBIDDEN in each case through key-set linkage and the report ledger |
| TEST-PS-096-09.T23 | abuse | PS-096-05.R05, PS-096-02.R04 | suspended key files an appeal, reads its appeal status, its own action and its evidence; apply with restrictedCapabilities containing moderation.appeal.receive or moderation.appeal.read_status_own | appeal accepted and reads allowed; MODERATION_CAPABILITY_PROTECTED for both |

## Dependencies

Module depends on: F12.S02.M03, F12.S01.M01, F12.S01.M02, F12.S03.M03, F06.S01.M01, F08.S01.M01, F07.S02.M01, F11.S01.M01, F16.S01.M01, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
