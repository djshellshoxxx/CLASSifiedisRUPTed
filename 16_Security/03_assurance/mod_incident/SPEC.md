# F16.S03.M02 — Incident records

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F16.S03](../SPEC.md). **Process IDs:** PS-131-01…PS-131-10. **Code:** `apps/relay/src/ops/incident`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Incident records for a relay operator. Detection hooks watch security-relevant events on that relay (compromise of the relay's own identity key, compromise revocations of relay-owned, peer and hosted user keys, authentication anomalies, signature-failure spikes from a peer, mass session revocation, break-glass and last-admin events) and open an Incident with a severity from a fixed matrix; operators can also open one by hand. SEV1 and SEV2 detections are never capped, and floods of lower-severity detections collapse into one overflow incident so an attacker cannot hide a critical one. The record keeps an append-only timeline in its own table, containment and resolution times, whether personal-data breach notification may be required (due time from effective.breachNotificationHours of the F18.S01.M01 governance.jurisdiction_profile.resolve query for the relay's hosting ProfileRef, 72 hours by default), notice delivery counts and the postmortem link. Incident records and events are relay-local operational data, never federated and never used to send notifications, and contain no user secrets or content. Vaults get only a relay-signed incident notice when the operator decides users must be told. Incident handling on one relay never claims authority over other relays or users' vaults.

## Responsibilities

- Own the Incident record and its lifecycle from detected to closed, with an append-only timeline of at most 500 entries stored in security_incident_timeline and changed only by one audited redaction per entry.
- Run detection hooks as event consumers with fixed thresholds and open incidents at the matrix severity, de-duplicating repeated triggers into one open incident per category and scope, never capping SEV1 or SEV2, and sending SEV3 and SEV4 overflow to one detection_overflow incident.
- Apply the severity matrix (SEV1 to SEV4) with acknowledgement and containment targets, and track SLA breaches.
- Compute the breach-notification due time from effective.breachNotificationHours (24..720, default 72) returned by governance.jurisdiction_profile.resolve of F18.S01.M01 for the relay's hosting profile named by ProfileRef {publisherId, code}, record the ProfileRef, version and fallback flag it came from, and record notification decisions.
- Publish a relay-signed incident notice statement (classrup.security.incident_notice/v1) sealed to affected users' mailboxes through F08.S01.M01 when the operator decides to notify, and track delivered and pending counts.

## Not responsible for

- Runbook procedures and containment switches (F16.S03.M03).
- Key revocation mechanics (F16.S02.M02, F07) and moderation cases (F12.S02.M01).
- Legal advice or regulator filings; the module records the decision and dates, operators file with authorities.
- Future: integration with external paging services; shared incident feeds between cooperating relays; automatic user-side key rotation advice.

## User stories

- As a relay operator, I see an incident opened automatically when 100 invalid peer signatures arrive in 10 minutes, with severity, timeline and next steps.
- As an incident commander, I record containment and resolution and see how long each took against targets.
- As a user of an affected relay, I receive a clear signed notice saying what happened, what data classes were involved, and what I should do, without alarmist wording or false assurances.

## Edge cases

- The same trigger fires every minute; detection de-duplicates into one open incident per (category, scope) and appends timeline entries with counts.
- A single compromise revocation of a user key hosted on this relay opens no incident, because the key holder handles it through F07; five or more within 1 hour open one SEV3 key_compromise incident with scope user_keys, as they may indicate a malicious build or a relay breach.
- The relay's own identity key is revoked as compromised (platform.relay_identity.rotated with change revoked); severity SEV1, and the RB-01 relay branch of F16.S03.M03 revokes with the compromised key itself naming successorRelayId while its key file is readable, otherwise with the pre-signed certificate, starts a new identity and asks users to confirm the new fingerprint out of band.
- Incident opened as false positive; it moves to closed with reason false_positive and keeps its timeline.
- Timeline entry accidentally contains a secret; entries are append-only, so the correction is a new entry and an admin runs security.incident.redact_entry, which sets that row's text to NULL, stores its hash once and writes an audit entry.
- Breach notification due time passes with no decision recorded; the SLA sweep raises an alert and the incident cannot be closed until a decision (notify, not required with reason) exists.
- Postmortem not completed by the due date; the incident closes only after the postmortem link is present for SEV1 and SEV2.
- 25 SEV3 detections arrive within an hour; the first 20 open or update incidents normally and the other 5 are appended to a single open detection_overflow SEV2 incident; a SEV1 detection in the same hour is handled at once.
- A notice reached 40 of 50 mailboxes; noticeDelivered 40 and noticePending 10 are recorded and closing needs a closeOverrideReason while any delivery is pending.
- The relay's hosting profile has no breachNotificationHours or no hosting profile is set; resolve returns 72 hours (fallback true for the generic profile) and the incident records that basis, so the due time is never left unset for data classes above P1.
- A vault receives a notice signed by a new relayId that the revocation of its relay's old key names as successor, or, after a certificate-only revocation, whose restore announcement names the old relayId; it is shown as 'unverified until confirmed out of band' with the old relay's name and the new fingerprint, never acted on and never silently discarded.

## UX and accessibility

- Incident list for relay operators: severity, category, status, age, SLA badges, filters.
- Incident detail: summary, timeline (append-only, redacted entries shown as 'redacted' with the date and actor), severity changes with reasons, containment and resolution times, notification decision with due time, the ProfileRef, version and hours it came from, and delivered and pending notice counts, postmortem link, related keys and events by ID.
- Notice composer: template with data classes involved (from the relay inventory of F16.S03.M03), actions for users, preview of the signed statement.

**States:** loading; empty; detected; triaged; contained; resolved; closed; sla-breached; notice-pending

**Accessibility:** Severity and SLA status are text labels with icons, not color alone.; Timeline is an ordered list with timestamps in text and each entry reachable by keyboard.; Forms have labels and errors linked by aria-describedby; destructive actions need confirmation dialogs with focus trap.

## Owned data

- `Incident` (classrup.security.incident/v1, P3, RET-EVIDENCE)

## Interfaces

- Commands: `security.incident.open`, `security.incident.triage`, `security.incident.annotate`, `security.incident.contain`, `security.incident.resolve`, `security.incident.notify`, `security.incident.redact_entry`, `security.incident.close`
- Queries: `security.incident.list`, `security.incident.get`
- Emits: `security.incident.opened`, `security.incident.closed`
- Consumes: `platform.relay_identity.rotated`, `security.key.revoked`, `moderation.rate.exceeded`, `federation.record.rejected`, `federation.peer.suspended`, `identity.session.revoked`, `security.role.assigned`, `security.role.revoked`

## Dependencies

F16.S01.M01, F16.S01.M02, F16.S02.M02, F16.S02.M03, F16.S03.M01, F18.S01.M01, F08.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001, CTR-FED-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-131-01 | [Domain schema](domain_schema.md) | 4 |
| PS-131-02 | [Validation rules](validation_rules.md) | 3 |
| PS-131-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-131-04 | [Commands, queries and events](commands_queries_events.md) | 7 |
| PS-131-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-131-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-131-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-131-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-131-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-131-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `apps/relay/src/ops/incident/index.ts`.

## Acceptance criteria

- All tests T01–T20 pass in CI.
- No SEV1 or SEV2 incident can be closed without a postmortem reference and a notification decision, and no detection of SEV1 or SEV2 is ever capped.
- Detection hooks open at most one incident per category and scope and respect their thresholds, and timeline rows change only through one audited redaction.
