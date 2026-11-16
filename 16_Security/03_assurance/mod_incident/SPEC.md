# F16.S03.M02 — Incident records

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F16.S03](../SPEC.md). **Process IDs:** PS-131-01…PS-131-10. **Code:** `apps/relay/src/ops/incident`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Incident records for a relay operator. Detection hooks watch security-relevant events on that relay (key compromise revocations, authentication anomalies, signature-failure spikes from a peer, mass session revocation) and open an Incident with a severity from a fixed matrix; operators can also open one by hand. The record keeps a timeline, containment and resolution times, whether personal-data breach notification may be required, and the postmortem link. Incident records are relay-local operational data and contain no user secrets or content. Vaults get only a signed incident notice when the operator decides users must be told. Incident handling on one relay never claims authority over other relays or users' vaults.

## Responsibilities

- Own the Incident record and its lifecycle from detected to closed with an append-only timeline of at most 500 entries.
- Run detection hooks as event consumers with fixed thresholds and open incidents at the matrix severity, de-duplicating repeated triggers into one open incident per category and scope.
- Apply the severity matrix (SEV1 to SEV4) with acknowledgement and containment targets, and track SLA breaches.
- Compute the breach-notification due time from the jurisdiction profile (F18.S01.M01) with a default target of 72 hours after awareness, and record notification decisions.
- Publish a signed incident notice statement (classrup.security.incidentnotice/v1) to affected users' mailboxes when the operator decides to notify.

## Not responsible for

- Runbook procedures and containment switches (F16.S03.M03).
- Key revocation mechanics (F16.S02.M02) and moderation cases (F12.S02.M01).
- Legal advice or regulator filings; the module records the decision and dates, operators file with authorities.
- Future: integration with external paging services; shared incident feeds between cooperating relays; automatic user-side key rotation advice.

## User stories

- As a relay operator, I see an incident opened automatically when 100 invalid peer signatures arrive in 10 minutes, with severity, timeline and next steps.
- As an incident commander, I record containment and resolution and see how long each took against targets.
- As a user of an affected relay, I receive a clear signed notice saying what happened, what data classes were involved, and what I should do, without alarmist wording or false assurances.

## Edge cases

- The same trigger fires every minute; detection de-duplicates into one open incident per (category, scope) and appends timeline entries with counts.
- A key compromise report arrives for a user key; severity is SEV3 unless relay-held data is involved, and the incident links the revocation record without copying key material.
- The relay's own signing key is suspected compromised; severity SEV1, and the runbook in F16.S03.M03 requires key rotation and a signed notice using the new key plus out-of-band confirmation.
- Incident opened as false positive; it moves to closed with reason false_positive and keeps its timeline.
- Timeline entry accidentally contains a secret; entries are append-only, so the correction is a new entry and the original is redacted by an operator command that replaces content with a hash and writes an audit entry.
- Breach notification due time passes with no decision recorded; the SLA sweep raises an alert and the incident cannot be closed until a decision (notify, not required with reason) exists.
- Postmortem not completed by the due date; the incident closes only after the postmortem link is present for SEV1 and SEV2.

## UX and accessibility

- Incident list for operators: severity, category, status, age, SLA badges, filters.
- Incident detail: summary, timeline (append-only), severity changes with reasons, containment and resolution times, notification decision with due time, postmortem link, related keys and events by ID.
- Notice composer: template with data classes involved, actions for users, preview of the signed statement.

**States:** loading; empty; detected; triaged; contained; resolved; closed; sla-breached

**Accessibility:** Severity and SLA status are text labels with icons, not color alone.; Timeline is an ordered list with timestamps in text and each entry reachable by keyboard.; Forms have labels and errors linked by aria-describedby; destructive actions need confirmation dialogs with focus trap.

## Owned data

- `Incident` (classrup.security.incident/v1, P3, RET-EVIDENCE)

## Interfaces

- Commands: `security.incident.open`, `security.incident.triage`, `security.incident.annotate`, `security.incident.contain`, `security.incident.resolve`, `security.incident.notify`, `security.incident.close`
- Queries: `security.incident.list`, `security.incident.get`
- Emits: `security.incident.opened`, `security.incident.closed`
- Consumes: `security.key.revoked`, `moderation.rate.exceeded`, `federation.record.rejected`, `federation.peer.suspended`, `identity.session.revoked`, `security.role.assigned`

## Dependencies

F16.S01.M01, F16.S02.M02, F16.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-131-01 | [Domain schema](domain_schema.md) | 3 |
| PS-131-02 | [Validation rules](validation_rules.md) | 3 |
| PS-131-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-131-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-131-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-131-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-131-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-131-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-131-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-131-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `apps/relay/src/ops/incident/index.ts`.

## Acceptance criteria

- All tests T01–T14 pass in CI.
- No SEV1 or SEV2 incident can be closed without a postmortem reference and a notification decision.
- Detection hooks open at most one incident per category and scope and respect their thresholds.
