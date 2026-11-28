# PS-144-06 — Failure recovery and idempotency: Goods taxonomy

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M03 Goods taxonomy](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/goods` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-144-06.R01** Authoring commands and apply_pack are idempotent per CTR-IDM-001; packs are deduplicated by packCid.
- **PS-144-06.R02** apply_pack writes all category changes, held changes, the pack record and the outbox events in one IndexedDB transaction.
- **PS-144-06.R03** Offline vaults keep working on the last applied pack; release_pack shows prepared until a relay receipt exists.

## Specification

- **idempotency:** Idempotency-Key required on authoring and release; keys and request hashes kept 24 h; apply_pack and relay_upload are naturally idempotent by packCid.
- **concurrency:** expectedRevision on update, move and set_status; expectedPackVersion on release; two operators staging in the same publisher vault is not supported and the second tab gets CONFLICT_REVISION; competing packs from different publishers coexist as separate namespaces with ids unique across publishers (V11), and the publisher pinned for scope taxonomy in F18.S02.M01 is the one used for new listings.
- **retries:** Relay upload retries follow IDM-4 (base 500 ms, cap 30 s, 6 attempts); apply failures are not retried automatically because they are validation outcomes; a held change is retried when its decision arrives.
- **offline:** Apply, read and authoring work offline; decisions embedded in the pack verify offline; release queues in the sync outbox with states prepared, transport_acknowledged and peer_accepted.
- **partial failure:** A structural validation failure anywhere in a pack rejects the whole pack and leaves the previous version active; a missing or invalid decision holds only the affected records at their previous state; a failing relay upload leaves the local release in place and retries.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-144-09.T05 | integration | PS-144-03.R03, PS-144-06.R02 | pack with one invalid category; pack with one change lacking its decision | first rejected whole and previous version active; second applied atomically with that record held |
| TEST-PS-144-09.T09 | integration | PS-144-06.R01 | replay release and apply same pack | one packCid, no duplicate events |
| TEST-PS-144-09.T10 | integration | PS-144-06.R03 | vault offline then reconnect; relay down for release | last pack in use; release prepared then transport_acknowledged only with receipt |

## Dependencies

Module depends on: F18.S02.M01, F16.S02.M03, F11.S01.M01, F15.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
