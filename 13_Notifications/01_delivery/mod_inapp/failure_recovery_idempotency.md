# PS-103-06 — Failure recovery and idempotency: In-app notifications

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M03 In-app notifications](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/inapp` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-103-06.R01** Routing consumers are idempotent on event ID through the consumer inbox (CTR-EVT-001 EVT-3), so redelivery never creates duplicates.
- **PS-103-06.R02** Collapse and creation happen in one IndexedDB transaction so counts are exact under concurrent events.
- **PS-103-06.R03** If rendering a template fails the row is still created with a generic fallback text, so no alert is lost.

## Specification

- **idempotency:** Create is idempotent on sourceEventId through the inbox table; mark_read is idempotent on notificationId and returns the stored read state.
- **concurrency:** expectedRevision on mark_read; creation and collapse in one IndexedDB transaction with a compare on the open row; two tabs share the same IndexedDB so Web Locks serialize the consumer per vault.
- **retries:** Event consumers retry up to 8 times with backoff then dead-letter locally (EVT-6 adapted); the user can retry from diagnostics.
- **offline:** Everything works offline because the inbox is local; notifications are created as soon as events are derived, including during sync catch-up after being offline.
- **partial failure:** If one routing row fails others continue; a failed event stays in the dead letter list with a diagnostics entry and does not block the inbox.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-103-09.T06 | integration | PS-103-04.R03, PS-103-06.R01 | deliver each event type twice, shuffled | exactly one row per rule, duplicates skipped |
| TEST-PS-103-09.T08 | integration | PS-103-06.R02, PS-103-06.R03 | 100 concurrent offer events for one listing; template render failure | one collapsed row count 100; fallback text on render failure |
| TEST-PS-103-09.T09 | integration | PS-103-06.R03, PS-103-02.R03 | muted thread message; category with in-app off; security category with in-app preference attempt to disable | muted flag set, no row for off category except counters, security row always created |

## Dependencies

Module depends on: F13.S02.M04, F08.S01.M01, F08.S01.M02, F08.S03.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
