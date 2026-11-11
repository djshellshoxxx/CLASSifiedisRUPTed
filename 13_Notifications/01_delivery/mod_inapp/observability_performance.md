# PS-103-08 — Observability and performance: In-app notifications

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M03 In-app notifications](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/inapp` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-103-08.R01** The PWA keeps local diagnostics only (OBS-7) with counters for created, collapsed, dropped and read notifications.
- **PS-103-08.R02** Routing one event and creating a row meets p95 ≤ 30 ms and inbox list of 50 items p95 ≤ 100 ms on a mid-range phone.
- **PS-103-08.R03** Catch-up routing of 1 000 events after being offline completes within 5 s.

## Specification

**Metrics**
- classrup_notify_inbox_created_total{category} (local diagnostics)
- classrup_notify_inbox_collapsed_total (local diagnostics)
- classrup_notify_inbox_unread (gauge, local diagnostics)
- classrup_notify_routing_dead_letter_total (local diagnostics)

**Logs**
- local info notification.created {category, templateKey} — no ref IDs in exported diagnostics.

**Budgets**
- create p95 ≤ 30 ms; list_mine 50 items p95 ≤ 100 ms; unread_count p95 ≤ 20 ms.
- Routing 1 000 events ≤ 5 s on a mid-range phone.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-103-09.T11 | load | PS-103-08.R01, PS-103-08.R02, PS-103-08.R03 | 1 000 events catch-up and list of 50 items | budgets met |

## Dependencies

Module depends on: F13.S02.M04, F08.S01.M01, F08.S01.M02, F08.S03.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
