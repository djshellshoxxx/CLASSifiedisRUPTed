# PS-122-05 — Authorization and capabilities: Disaster recovery

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S03.M03 Disaster recovery](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/recovery` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-122-05.R01** Relay policy applies, so only the relay operator or admin role of this relay may replay dead letters or read the plan, and restore requires filesystem access to the backup directory and the backup key.
- **PS-122-05.R02** Dead-letter listing returns metadata only; payloads are never shown through the API because they may contain P1 data.
- **PS-122-05.R03** The restore tool never needs vault keys or user credentials, and the relay identity key is read only from the operator-supplied key file.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| platform.deadletter.replay | operator, admin | signed operator request; consumer module enabled; max 500 per call and 3 replays per event |
| platform.deadletter.read | operator, admin | signed operator request |
| platform.recovery.read_plan | operator, admin | signed operator request or local CLI |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-122-09.T07 | abuse | PS-122-05.R01, PS-122-05.R02, PS-122-05.R03 | non-operator replays and lists; operator reads payloads through the API | FORBIDDEN; no payload field exists in any response |

## Dependencies

Module depends on: F15.S03.M02, F15.S02.M01, F15.S02.M03, F15.S03.M01, CTR-IOX-001, CTR-EVT-001, CTR-IDM-001, CTR-OBS-001, CTR-CAP-001, CTR-ERR-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
