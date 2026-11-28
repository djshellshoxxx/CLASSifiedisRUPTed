# PS-065-08 — Observability and performance: Meetup handoff check-in

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M02 Meetup handoff check-in](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/handoff` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-065-08.R01** Relay share commands are measured per CTR-OBS-001; the PWA keeps local diagnostics only (OBS-7).
- **PS-065-08.R02** Check-in and report commands meet p95 ≤ 50 ms in the vault; share view meets p95 ≤ 100 ms on the relay.
- **PS-065-08.R03** The relay expiry sweep keeps lag under 5 minutes.

## Specification

**Metrics**
- classrup_comms_meetup_shares_total{outcome=created|updated|revoked|expired|viewed} (relay)
- classrup_comms_meetup_share_sweep_lag_ms (gauge, relay)
- classrup_comms_checkins_total{status=checked_in|no_show|void|contradicted} (local diagnostics)

**Logs**
- relay info meetup_share.put {shareIdHash, size, correlationId} — no content, no key, no IP retained beyond rate-limit counters.
- local info checkin.recorded {meetupId} — local diagnostics only.

**Budgets**
- check_in and report_no_show p95 ≤ 50 ms; relay put and delete p95 ≤ 300 ms; relay view p95 ≤ 100 ms at 50 req/s.
- Share sweep deletes 10 000 expired shares in ≤ 10 s.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-065-09.T11 | load | PS-065-08.R01, PS-065-08.R02, PS-065-08.R03 | 50 share views per second for 2 minutes and sweep of 10 000 expired shares | budgets met |

## Dependencies

Module depends on: F08.S03.M03, F08.S01.M01, F07.S02.M02, F16.S02.M02, F16.S02.M03, F11.S01.M01, F11.S01.M03, F11.S02.M01, F15.S01.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
