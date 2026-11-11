# PS-092-05 — Authorization and capabilities: Appeals

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M03 Appeals](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/appeals` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-092-05.R01** Vault policy: only the local principal can file, withdraw and read its appeals, and incoming receipts, statuses, decisions and moot notices are accepted only when signed by the key of the relay that issued the action.
- **PS-092-05.R02** Relay policy: only the action's subject can appeal, also while its key is suspended or restricted on this relay; only an assigned moderator whose principal differs from the decider, the subject and every reporter can decide; operators read the queue and reassign through moderation.appeal.reassign.
- **PS-092-05.R03** Reviewer identity is hidden from the appellant: decision, status and moot statements are signed by the relay key only, the reviewer key stays in the relay copy and the relay audit log, and the appellant sees 'a moderator who did not make the original decision'.
- **PS-092-05.R04** Conflict-of-interest checks compare principals, not single keys, using the F07.S02.M01 key set, same-owner attestations, the relay moderator registry and the F12.S01.M01 report ledger, in assignment, reassignment and decide.
- **PS-092-05.R05** Keys suspended or restricted on this relay keep moderation.appeal.receive and moderation.appeal.read_status_own, which F12.S02.M01 refuses to list in restrictedCapabilities.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| moderation.appeal.file | local principal | vault unlocked; appellant key is the action subject; statement signed |
| moderation.appeal.receive | relay access (signed request) | key equals the action subject on this relay; allowed while the key is suspended or restricted on this relay; window, duplicate and relay-binding checks |
| moderation.appeal.decide | moderator | relay role moderator; assigned reviewer; principal differs from decider, subject and reporters |
| moderation.appeal.reassign | operator | relay role operator, or system for the escalation sweep and role revocation; new reviewer passes the principal checks |
| moderation.appeal.withdraw | local principal | appeal.appellantKey = local principal |
| moderation.appeal.receive_relay_statement | local principal | vault unlocked; statement signed by the relay the appeal was addressed to |
| moderation.appeal.read_own | local principal | appeal.appellantKey = local principal |
| moderation.appeal.read_status_own | member | signed request by the appellantKey of the appeal on this relay; allowed while the key is suspended or restricted |
| moderation.appeal.read_queue | moderator, operator | relay role moderator or operator; appeals about decisions of the reader's own principal are hidden |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-092-09.T07 | abuse | PS-092-05.R01, PS-092-05.R02, PS-092-05.R03 | stranger files; decider decides; appellant queries its appeal and inspects every statement | FORBIDDEN, MODERATION_APPEAL_REVIEWER_CONFLICT, reviewer key absent from responses and statements |
| TEST-PS-092-09.T17 | abuse | PS-092-05.R03 | decide an appeal and inspect the decision envelope, status statements, events and the vault copy; read the relay audit log as operator | only the relay key signed the statements; reviewer key absent everywhere except the relay copy and audit log |
| TEST-PS-092-09.T18 | abuse | PS-092-05.R04, PS-092-02.R03 | assign M1 via second key K1b; assign M3 who filed report R; assign a moderator whose key set lists the subject's key | MODERATION_APPEAL_REVIEWER_CONFLICT in each case; M2 assigned |
| TEST-PS-092-09.T19 | integration | PS-092-05.R05 | key of A suspended on relay X files an appeal and reads its status | appeal accepted and status returned |

## Dependencies

Module depends on: F12.S02.M01, F12.S01.M01, F12.S01.M02, F12.S02.M03, F07.S02.M01, F08.S01.M01, F16.S01.M01, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
