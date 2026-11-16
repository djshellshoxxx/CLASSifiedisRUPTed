# PS-066-04 — Commands, queries and events: Safe meetup guidance

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M01 Safe meetup guidance](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/safe` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-066-04.R01** Curators publish and retire spots through relay commands that accept signed statements; anyone lists spots of an L2 cell through a public relay query.
- **PS-066-04.R02** Members get suggestions through a vault command that reads only the local cache and emits comms.safe_spot.suggested locally.
- **PS-066-04.R03** The module consumes relay role events so that curator authority follows the relay operator's role assignments.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `comms.safe_spot.publish` | comms.safe_spot.publish | [relay command; accepts signed statement classrup.comms.safe_spot/v1] { statement } | { spotId, version, status: active } | VALIDATION_FAILED, COMMS_SAFE_SPOT_CURATOR_UNTRUSTED, NOT_FOUND, RATE_LIMITED, CONFLICT_REVISION |  | yes (Idempotency-Key) |
| `comms.safe_spot.retire` | comms.safe_spot.retire | [relay command; accepts signed retirement statement] { spotId, reason, expectedRevision } | { spotId, revision, status: retired } | NOT_FOUND, FORBIDDEN, VALIDATION_FAILED, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `comms.safe_spot.suggest` | comms.safe_spot.suggest | [vault command, local only] { l2Cell, windowStart, windowEnd, kinds? } | { items: SafeSpot[] (≤ 5), cacheAgeMs, checklistVersion } | VALIDATION_FAILED, NOT_FOUND | comms.safe_spot.suggested | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `comms.safe_spot.list_for_cell` | comms.safe_spot.read_public | [relay query, public] { l2Cell, sinceVersion?, cursor?, limit ≤ 100 } | { items: SafeSpot[] (signed statements), tombstones[], nextCursor? } | NOT_FOUND |
| `comms.safe_spot.checklist` | comms.safe_spot.suggest | [vault query] { locale } | { version, items: [{ key, defaultText }] (10 items) } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `comms.safe_spot.suggested` | P1 | { l2Cell, spotIds[] (≤ 5), windowStart, windowEnd } |

### Events consumed

| Type | Effect |
|---|---|
| `security.role.assigned` | relay only: when the role is operator or curator on this relay, add the assignee key to the curator list |
| `security.role.revoked` | relay only: remove the assignee key from the curator list; their active spots stay but are marked unmaintained |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| COMMS_SAFE_SPOT_CURATOR_UNTRUSTED | 403 | no | statement signer is not in the curator list of this relay or the bundled list |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command comms.safe_spot.suggest
{ "l2Cell": "l2:DE-BE-001", "windowStart": "2026-11-07T14:00:00Z", "windowEnd": "2026-11-07T15:00:00Z" }
-> { "items": [ { "id": "0192f3a4-7777-7000-8000-000000000001", "name": "Polizeiabschnitt 53 lobby", "kind": "police_station" } ], "cacheAgeMs": 86400000, "checklistVersion": 3 }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-066-09.T04 | contract | PS-066-04.R01, PS-066-04.R02, PS-066-04.R03, PS-066-09.R02 | publish, retire, suggest, list, checklist | outputs and event payloads validate against registry schemas |
| TEST-PS-066-09.T05 | unit | PS-066-04.R02, PS-066-02.R02 | suggest for window 14:00 to 15:00 | at most 5 spots, in-hours first, outside-hours labelled, no network call made |
| TEST-PS-066-09.T13 | a11y | PS-066-04.R01 | suggest sheet and checklist with screen reader | list semantics, checklist progress announced, zero serious axe issues |

## Dependencies

Module depends on: F06.S02.M01, F16.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
