# PS-092-05 — Authorization and capabilities: Appeals

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M03 Appeals](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/appeals` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-092-05.R01** Vault policy: only the local principal can file, withdraw and read its appeals, and incoming decisions are accepted only when signed by the key of the relay that issued the action.
- **PS-092-05.R02** Relay policy: only the action's subject key can appeal, only a moderator other than the decider can decide, and operators can read the queue and reassign.
- **PS-092-05.R03** Reviewer identity is hidden from the appellant by default and shown as 'a moderator who did not make the original decision'.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| moderation.appeal.file | local principal | vault unlocked; appellant key is the action subject; statement signed |
| moderation.appeal.receive | relay access (signed request) | key equals action subject on this relay; window and duplicate checks |
| moderation.appeal.decide | moderator | relay role moderator; assigned reviewer; reviewer key differs from action decider key |
| moderation.appeal.withdraw | local principal | appeal.appellantKey = local principal |
| moderation.appeal.read_own | local principal | appeal.appellantKey = local principal |
| moderation.appeal.read_queue | moderator, operator | relay role moderator or operator; appeals about own decisions are hidden from the decider |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-092-09.T07 | abuse | PS-092-05.R01, PS-092-05.R02, PS-092-05.R03 | stranger files; decider decides; appellant queries reviewer identity | FORBIDDEN, MODERATION_APPEAL_REVIEWER_CONFLICT, reviewer key absent |

## Dependencies

Module depends on: F12.S02.M01, F12.S01.M02, F12.S02.M03, F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
