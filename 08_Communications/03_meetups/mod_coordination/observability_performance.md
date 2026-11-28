# PS-064-08 — Observability and performance: Meetup coordination

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M03 Meetup coordination](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/coordination` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-064-08.R01** The PWA keeps local diagnostics only (OBS-7) with counters for proposals, agreements, reschedules, conflicts and cancellations.
- **PS-064-08.R02** Vault commands meet p95 ≤ 50 ms on a mid-range phone and a thread with 20 meetups renders in p95 ≤ 100 ms.
- **PS-064-08.R03** The expiry sweep processes 1 000 meetups in ≤ 1 s.

## Specification

**Metrics**
- classrup_comms_meetups_total{outcome=proposed|agreed|cancelled|expired|elapsed|conflicted} (local diagnostics)
- classrup_comms_meetup_reschedules (histogram, local diagnostics)

**Logs**
- local info meetup.agreed {meetupId, proposalRevision} — no place or window.

**Budgets**
- propose (including the proposer consent)/agree/reschedule/cancel p95 ≤ 50 ms; list_for_thread p95 ≤ 100 ms with 20 meetups.
- Expiry sweep for 1 000 meetups ≤ 1 s.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-064-09.T11 | load | PS-064-08.R01, PS-064-08.R02, PS-064-08.R03 | 1 000 meetups sweep and 20-meetup thread render | budgets met |

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, F08.S02.M02, F08.S03.M01, F06.S02.M01, F07.S02.M02, F16.S02.M02, F11.S01.M01, F11.S02.M01, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
