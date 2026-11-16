# PS-131-06 — Failure recovery and idempotency: Incident records

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M02 Incident records](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/incident` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-131-06.R01** All commands are idempotent per CTR-IDM-001 and mutating commands require expectedRevision.
- **PS-131-06.R02** Detection hooks are idempotent through the inbox table and the open-incident unique index, so duplicate events never create a second incident.
- **PS-131-06.R03** A timeline append and its revision bump are one transaction and the timeline never loses entries.

## Specification

- **idempotency:** Idempotency-Key required on commands; hook-opened incidents dedupe on (category, scope) for open incidents; notify replays return the stored notice CID.
- **concurrency:** expectedRevision on every mutation; partial unique index on open incidents; timeline append uses BEGIN IMMEDIATE so two operators' entries both persist with increasing order.
- **retries:** Event consumers retry per EVT-6; notice delivery uses the mailbox outbox with CTR-IDM-001 backoff for 7 days.
- **offline:** Operators need the relay online; users receive notices when they next sync, and the notice carries the relay-signed issue time.
- **partial failure:** If notice delivery partially fails, the incident records delivered count and pending count, the notify command can be repeated for the remaining audience, and the incident cannot be closed with pending delivery above 0 unless a reason is recorded.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-131-09.T06 | integration | PS-131-04.R03, PS-131-06.R02 | event streams: 99 vs 100 rejections in 10 minutes; 49 vs 50 rate.exceeded from 19 vs 20 prefixes; duplicates | no incident below thresholds; one incident at thresholds; duplicates dedupe |
| TEST-PS-131-09.T09 | integration | PS-131-06.R01, PS-131-06.R03 | same Idempotency-Key replayed; concurrent annotate; partial notice delivery | one effect; both entries stored; delivered/pending counts recorded |

## Dependencies

Module depends on: F16.S01.M01, F16.S02.M02, F16.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
