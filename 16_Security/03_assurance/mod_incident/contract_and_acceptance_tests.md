# PS-131-09 — Contract and acceptance tests: Incident records

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M02 Incident records](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/incident` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-131-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-131-09.R02** Detection hook thresholds are covered by deterministic event-stream tests with an injected clock.
- **PS-131-09.R03** Notification and closure gates are covered by integration tests.

## Specification

See the module test table below (all processes).

**Fixtures:** Relay X, relay_operator O, admin A, tenant operator T, moderator M, peer P, F18.S01.M01 governance.jurisdiction_profile.resolve stub returning effective.breachNotificationHours 48 for the hosting ProfileRef {publisherId KP, code eu_de} version 3 and a second stub with no hosting profile returning 72 with fallback true, F08.S01.M01 mailbox stub, injected event streams, fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-131-09.T01 | unit | PS-131-01.R01, PS-131-01.R02, PS-131-01.R03, PS-131-02.R01 | open SEV2 key_compromise with valid input under the 48 h resolve stub | Incident stored detected, severity history has one entry, notificationDueAt = detectedAt + 48 h when data classes are above P1 |
| TEST-PS-131-09.T02 | unit | PS-131-02.R02, PS-131-02.R03 | each rule V01–V08 violated | documented error code and nothing stored; secret-like text rejected |
| TEST-PS-131-09.T03 | property | PS-131-03.R01, PS-131-03.R02 | random command sequences on one incident | only declared transitions succeed; closed never changes; timeline length never decreases |
| TEST-PS-131-09.T04 | integration | PS-131-03.R03, PS-131-08.R03 | injected clock past SEV1 15-minute acknowledgement and 60-minute containment targets | SLA breach timeline entries and metrics; status unchanged |
| TEST-PS-131-09.T05 | contract | PS-131-04.R01, PS-131-04.R02, PS-131-04.R06 | each command, query and event; the notice statement | validate against registry schemas; the notice is a CTR-FED-001 envelope by the relay key registered in F11.S01.M01 and sealed through the F08.S01.M01 stub |
| TEST-PS-131-09.T06 | integration | PS-131-04.R03, PS-131-06.R02, PS-131-09.R02 | event streams - 99 vs 100 rejections in 10 minutes; 49 vs 50 rate.exceeded from 19 vs 20 prefixes; 99 vs 100 session revocations in 10 minutes; duplicates | no incident below thresholds; one incident at thresholds; duplicates dedupe |
| TEST-PS-131-09.T07 | abuse | PS-131-05.R01, PS-131-05.R03 | moderator M, tenant operator T and a member read incidents; the system hook actor tries triage | FORBIDDEN or NOT_FOUND; FORBIDDEN |
| TEST-PS-131-09.T08 | integration | PS-131-09.R03, PS-131-03.R01 | close SEV1 without postmortem or notification decision; with both | SECURITY_INCIDENT_CLOSE_BLOCKED then success |
| TEST-PS-131-09.T09 | integration | PS-131-06.R01, PS-131-06.R03 | same Idempotency-Key replayed; concurrent annotate; notice delivered to 40 of 50 mailboxes then close with and without closeOverrideReason | one effect; both entries stored with increasing seq; noticeDelivered 40 and noticePending 10; close blocked then allowed with the reason |
| TEST-PS-131-09.T10 | abuse | PS-131-07.R03, PS-131-01.R04 | 201 operator commands in an hour; UPDATE of a timeline row's text; second redaction of a redacted row; DELETE of a row while the incident exists | RATE_LIMITED; trigger aborts each change |
| TEST-PS-131-09.T11 | integration | PS-131-07.R01, PS-131-04.R04 | secret pasted into annotate; admin redacts an existing entry; relay_operator tries to redact | SECURITY_INCIDENT_SECRET_IN_TEXT; text NULL, redacted_hash set and an F16.S01.M01 audit entry written; FORBIDDEN |
| TEST-PS-131-09.T12 | load | PS-131-08.R01, PS-131-08.R02 | 50 req/s mixed open and annotate for 5 minutes; SLA sweep 10 000 incidents | p95 ≤ 300 ms; sweep ≤ 2 s |
| TEST-PS-131-09.T13 | unit | PS-131-09.R01 | traceability tool run | every PS-131 requirement maps to a passing test |
| TEST-PS-131-09.T14 | integration | PS-131-10.R01, PS-131-10.R02, PS-131-10.R03 | export incidents, import to fresh relay, restore backup | records round-trip without redacted text; imported open incidents become triaged history with a note |
| TEST-PS-131-09.T15 | integration | PS-131-03.R04 | 25 SEV3 detections in one hour; 30 SEV2 peer key compromise detections and one SEV1 in the same hour | first 20 handled normally and the other 5 appended to one detection_overflow SEV2 incident; all SEV2 and the SEV1 handled without cap |
| TEST-PS-131-09.T16 | integration | PS-131-04.R03 | platform.relay_identity.rotated revoked compromised; one relay_hosted user key compromised; five within one hour; a VAPID key compromised; security.role.assigned with breakGlass; security.role.revoked with lastAdmin; three admin changes in 24 hours; two admin changes | SEV1 key_compromise relay_identity; no incident; one SEV3 key_compromise user_keys; SEV2 key_compromise; SEV1 privilege_change; SEV1 privilege_change; SEV3 privilege_change; no incident |
| TEST-PS-131-09.T17 | abuse | PS-131-05.R02 | vault receives a notice signed by an unknown key; by a successor relayId named in its relay's key revocation; by a successor relayId known only through a restore announcement naming the old relayId after a certificate-only revocation; by the key of the relay it uses | first quarantined by F11.S01.M02; second and third shown as unverified until confirmed out of band and not acted on; fourth shown with the relay name and no local data change |
| TEST-PS-131-09.T18 | integration | PS-131-07.R02 | retention sweep 2 years after closure; an incident under legal hold at that time | incident and timeline rows purged; held incident kept until privacy.legal_hold.released |
| TEST-PS-131-09.T19 | contract | PS-131-04.R05, PS-131-07.R01 | event payload classification and subscription scan across modules | both events P3 with no user content; no federation or notification module consumes security.incident.* |
| TEST-PS-131-09.T20 | contract | PS-131-04.R07, PS-131-01.R01 | open with affectedDataClasses [P2] against the 48 h resolve stub; the same against the no-hosting-profile stub; open with affectedDataClasses [P0]; hosting profile version 4 with 24 h activated while the first incident is open | resolve called on the relay without a profileId and its result read from effective.breachNotificationHours; notificationDueAt = detectedAt + 48 h with breachNoticeBasis sources [{profileRef {KP, eu_de}, version 3}] and fallback false; detectedAt + 72 h with fallback true; no notificationDueAt and no resolve call for P0 only; the stored due time unchanged after version 4 |

## Acceptance criteria

- All tests T01–T20 pass in CI.
- No SEV1 or SEV2 incident can be closed without a postmortem reference and a notification decision, and no detection of SEV1 or SEV2 is ever capped.
- Detection hooks open at most one incident per category and scope and respect their thresholds, and timeline rows change only through one audited redaction.

## Dependencies

Module depends on: F16.S01.M01, F16.S01.M02, F16.S02.M02, F16.S02.M03, F16.S03.M01, F18.S01.M01, F08.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
