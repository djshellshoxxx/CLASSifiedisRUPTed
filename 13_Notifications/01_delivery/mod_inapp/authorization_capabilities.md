# PS-103-05 — Authorization and capabilities: In-app notifications

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M03 In-app notifications](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/inapp` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-103-05.R01** Vault policy lets only the local principal read and mark its own notifications; routing consumers act as the vault itself.
- **PS-103-05.R02** Notifications are created only from events of statements already verified by their owning modules (signed by an authorized key for the role), never from raw relay data.
- **PS-103-05.R03** No relay or other user can read or create inbox rows.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| notify.notification.create | local principal | vault internal; invoked by routing consumers; event derived from locally verified data; recipient rule selects the local principal |
| notify.notification.mark_read | local principal | notification.userDid is the local principal |
| notify.notification.read_own | local principal | notification.userDid is the local principal |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-103-09.T07 | abuse | PS-103-05.R01, PS-103-05.R02, PS-103-05.R03 | event from blocked X; event with unverified statement; foreign actor tries to create or read rows | no row; no external access |

## Dependencies

Module depends on: F13.S02.M04, F08.S01.M01, F08.S01.M02, F08.S03.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
