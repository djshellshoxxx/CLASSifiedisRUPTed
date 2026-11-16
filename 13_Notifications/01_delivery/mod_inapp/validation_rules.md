# PS-103-02 — Validation rules: In-app notifications

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M03 In-app notifications](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/inapp` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-103-02.R01** Routing validates event shape, recipient rule and registry membership before a notification is created.
- **PS-103-02.R02** Read operations validate ownership and revision.
- **PS-103-02.R03** Every violation maps to one stable error code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | event type has a routing table row and the payload contains the fields the row needs | VALIDATION_FAILED |
| V02 | the recipient rule selects the local principal and the actor of the event is not the local principal | NOT_FOUND |
| V03 | templateKey and ref.type are in the registries | VALIDATION_FAILED |
| V04 | urgency urgent only for category security | VALIDATION_FAILED |
| V05 | the sender or actor is not blocked in the local block list | BLOCKED_PARTY |
| V06 | source event ID not yet seen in the consumer inbox | CONFLICT_STATE |
| V07 | mark_read expectedRevision matches and notification belongs to the local principal | CONFLICT_REVISION |
| V08 | event time is not older than 30 days at creation | EXPIRED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-103-09.T01 | unit | PS-103-01.R01, PS-103-01.R02, PS-103-01.R03, PS-103-02.R01 | route bazaar.offer.made to seller U | Notification stored with category offers, template notify.tpl.offers.made, ref offer, no text fields |
| TEST-PS-103-09.T02 | unit | PS-103-02.R02, PS-103-02.R03 | each rule V01 to V08 violated in turn | documented error code returned and nothing stored |
| TEST-PS-103-09.T09 | integration | PS-103-06.R03, PS-103-02.R03 | muted thread message; category with in-app off; security category with in-app preference attempt to disable | muted flag set, no row for off category except counters, security row always created |

## Dependencies

Module depends on: F13.S02.M04, F08.S01.M01, F08.S01.M02, F08.S03.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
