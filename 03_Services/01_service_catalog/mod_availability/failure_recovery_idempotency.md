# PS-028-06 — Failure recovery and idempotency: Service availability

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S01.M02 Service availability](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_catalog/availability` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-028-06.R01** Commands are idempotent through local command ids and hold creation is atomic with its overlap check.
- **PS-028-06.R02** Concurrent holds are serialized by a Web Locks lock per calendar; no distributed lock exists or is claimed.
- **PS-028-06.R03** A crash between a hold and its event leaves neither (single IndexedDB transaction).

## Specification

- **idempotency:** Local command id stored 24 h; replay of slot.hold with the same id returns the same holdId; summary statements are idempotent by cid.
- **concurrency:** Web Locks lock services-calendar-<id> around every hold, commit and rule change; expectedRevision on rule changes; two devices of one provider that diverge are detected by the signed seq/prev chain and frozen for explicit merge, never last-writer-wins for commitments.
- **retries:** Summary upload retries 1 s, 2 s, 4 s, 8 s up to 8 attempts; local commands are not retried automatically.
- **offline:** Everything except summary delivery works offline; delivery shows prepared, transport_acknowledged or peer_accepted and never more.
- **partial failure:** If rule expansion fails for one DST edge case the previous generated set stays in force and the UI reports the failing date; if relay upload fails the calendar change is still committed locally.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-028-09.T05 | integration | PS-028-03.R03, PS-028-06.R03 | crash injected between commit and booking confirmation | both or neither persisted |
| TEST-PS-028-09.T06 | integration | PS-028-02.R03, PS-028-06.R02 | two tabs hold overlapping slots simultaneously | exactly one succeeds, other SERVICES_SLOT_UNAVAILABLE |
| TEST-PS-028-09.T11 | integration | PS-028-06.R01, PS-028-07.R01, PS-028-07.R02 | replay hold command; inspect summary payload; advance clock 15 days | same holdId; summary has no client identity; expired summary dropped |

## Dependencies

Module depends on: F03.S01.M01, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
