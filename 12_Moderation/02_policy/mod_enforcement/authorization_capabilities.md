# PS-096-05 — Authorization and capabilities: Enforcement actions

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M01 Enforcement actions](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/enforcement` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-096-05.R01** Relay policy: relay moderators work cases and apply actions up to their limits, operators apply permanent suspensions and revert any action, and admins assign roles through F16.S01.M01.
- **PS-096-05.R02** Vault policy: a user's vault accepts a statement of reasons only when signed by the issuing relay key, shows it with the relay name, and never changes local records because of it.
- **PS-096-05.R03** A moderator cannot decide a case in which their own key is the subject.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| moderation.case.assign | moderator, operator | relay role; case in tenant |
| moderation.case.close | moderator, operator | relay role; case assigned to actor or actor is operator |
| moderation.action.apply | moderator, operator | relay role; assigned to the case; permanent suspension only operator; subject key is not actor |
| moderation.action.revert | moderator, operator | operator any action; moderator only own actions within 7 days; appeal reversal is system |
| moderation.case.read_queue | moderator, operator | relay role |
| moderation.action.read_own | member | action.subjectKey = actor (relay access token or signed request) |
| moderation.action.read_restrictions | operator | internal relay policy lookup used by authorize(); not exposed to members |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-096-09.T08 | abuse | PS-096-05.R01, PS-096-05.R03 | moderator suspends permanently; moderator decides case about self; non-moderator applies | MODERATION_ACTION_LIMIT, FORBIDDEN, FORBIDDEN |
| TEST-PS-096-09.T09 | abuse | PS-096-05.R02, PS-096-07.R03 | statement signed by wrong key; unsigned statement; schema with shadow kind | vault ignores first two; shadow kind rejected by validation |

## Dependencies

Module depends on: F12.S02.M03, F12.S01.M02, F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
