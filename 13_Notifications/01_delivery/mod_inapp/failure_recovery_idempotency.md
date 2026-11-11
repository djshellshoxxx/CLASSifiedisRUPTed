# PS-103-06 — Failure recovery and idempotency: In-app notifications

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M03 In-app notifications](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/inapp` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-103-06.R01** Routing consumers are idempotent on event ID through the consumer inbox (CTR-EVT-001 EVT-3), so redelivery never creates duplicates and a duplicate is acknowledged as a skip.
- **PS-103-06.R02** Collapse and creation happen in one IndexedDB transaction so counts are exact under concurrent events.
- **PS-103-06.R03** If rendering a template fails the row is still created with a generic fallback text, so no alert is lost.
- **PS-103-06.R04** Only malformed input fails and is retried up to 8 times before the local dead letter; skips never retry, never dead-letter and appear only as diagnostics counters.

## Specification

- **idempotency:** Create is idempotent on sourceEventId through the inbox table and returns created false with skipped duplicate on a repeat; a repeat with a different payload hash fails IDEMPOTENCY_KEY_REUSED; mark_read is idempotent on notificationId and returns the stored read state; the dispatch port is called once per committed decision.
- **concurrency:** expectedRevision on mark_read; creation and collapse in one IndexedDB transaction with a compare on the open row; tabs and the service worker share the same IndexedDB, so a Web Lock serializes the consumer per vault.
- **retries:** Event consumers retry only errors (malformed input or storage failure) up to 8 times with backoff, then dead-letter locally (EVT-6 adapted); skips are acknowledged at once; the user can retry dead letters from diagnostics.
- **offline:** Everything works offline because the inbox is local; notifications are created as soon as events are derived, including during sync catch-up after being offline.
- **partial failure:** If one routing row fails others continue; a failed event stays in the dead letter list with a diagnostics entry and does not block the inbox; a failing dispatch port call never rolls back the row.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-103-09.T06 | integration | PS-103-02.R02, PS-103-06.R01, PS-103-06.R04 | deliver each event type twice, shuffled; deliver an own-action event, an expired event and a filtered event | exactly one row per rule; duplicates and other skips return created false with the reason, are acknowledged once and never retried or dead-lettered |
| TEST-PS-103-09.T08 | integration | PS-103-06.R02, PS-103-06.R03 | 100 concurrent offer events for one listing; template render failure | one collapsed row count 100; fallback text on render failure |

## Dependencies

Module depends on: F13.S02.M04, F07.S02.M02, F08.S01.M02, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
