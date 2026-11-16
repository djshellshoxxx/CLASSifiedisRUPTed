# PS-131-09 — Contract and acceptance tests: Incident records

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M02 Incident records](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/incident` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-131-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-131-09.R02** Detection hook thresholds are covered by deterministic event-stream tests with an injected clock.
- **PS-131-09.R03** Notification and closure gates are covered by integration tests.

## Specification

See the module test table below (all processes).

**Fixtures:** Relay X, operator O, admin A, peer P, injected event streams, fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-131-09.T01 | unit | PS-131-01.R01, PS-131-01.R02, PS-131-01.R03, PS-131-02.R01 | open SEV2 key_compromise with valid input | Incident stored detected, severity history has one entry, notificationDueAt = detectedAt + 72 h when data classes above P1 |
| TEST-PS-131-09.T02 | unit | PS-131-02.R02, PS-131-02.R03 | each rule V01–V07 violated | documented error code and nothing stored; secret-like text rejected |
| TEST-PS-131-09.T03 | property | PS-131-03.R01, PS-131-03.R02 | random command sequences on one incident | only declared transitions succeed; closed never changes; timeline length never decreases |
| TEST-PS-131-09.T04 | integration | PS-131-03.R03, PS-131-08.R03 | injected clock past SEV1 15-minute acknowledgement and 60-minute containment targets | SLA breach timeline entries and metrics; status unchanged |
| TEST-PS-131-09.T05 | contract | PS-131-04.R01, PS-131-04.R02, PS-131-09.R02 | each command, query and event | validate against registry schemas; notice statement verifies with relay key |
| TEST-PS-131-09.T06 | integration | PS-131-04.R03, PS-131-06.R02 | event streams: 99 vs 100 rejections in 10 minutes; 49 vs 50 rate.exceeded from 19 vs 20 prefixes; duplicates | no incident below thresholds; one incident at thresholds; duplicates dedupe |
| TEST-PS-131-09.T07 | abuse | PS-131-05.R01, PS-131-05.R02, PS-131-05.R03 | moderator and member read incidents; vault accepts notice signed by another key | FORBIDDEN or NOT_FOUND; notice quarantined |
| TEST-PS-131-09.T08 | integration | PS-131-03.R01, PS-131-07.R01 | close SEV1 without postmortem or notification decision; with both | SECURITY_INCIDENT_CLOSE_BLOCKED then success |
| TEST-PS-131-09.T09 | integration | PS-131-06.R01, PS-131-06.R03 | same Idempotency-Key replayed; concurrent annotate; partial notice delivery | one effect; both entries stored; delivered/pending counts recorded |
| TEST-PS-131-09.T10 | abuse | PS-131-07.R02, PS-131-07.R03 | 201 operator commands in an hour; 21 hook incidents; edit of a timeline entry | RATE_LIMITED; capped; append-only trigger aborts edit |
| TEST-PS-131-09.T11 | integration | PS-131-07.R01 | secret pasted into annotate | SECURITY_INCIDENT_SECRET_IN_TEXT; redaction command replaces existing text with hash and audit entry |
| TEST-PS-131-09.T12 | load | PS-131-08.R01, PS-131-08.R02 | 50 req/s mixed open and annotate for 5 minutes; SLA sweep 10 000 incidents | p95 ≤ 300 ms; sweep ≤ 2 s |
| TEST-PS-131-09.T13 | unit | PS-131-09.R01, PS-131-09.R03 | traceability tool run | every PS-131 requirement maps to a passing test |
| TEST-PS-131-09.T14 | integration | PS-131-10.R01, PS-131-10.R02, PS-131-10.R03 | export incidents, import to fresh relay, restore backup | records round-trip; imported open incidents become triaged history with a note |

## Acceptance criteria

- All tests T01–T14 pass in CI.
- No SEV1 or SEV2 incident can be closed without a postmortem reference and a notification decision.
- Detection hooks open at most one incident per category and scope and respect their thresholds.

## Dependencies

Module depends on: F16.S01.M01, F16.S02.M02, F16.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
