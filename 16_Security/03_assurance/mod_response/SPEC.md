# F16.S03.M03 — Incident response

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F16.S03](../SPEC.md). **Process IDs:** PS-132-01…PS-132-10. **Code:** `docs/security/response`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Incident response runbooks kept under docs/security/response, written for a relay operator and for users who hold their own keys. Runbooks cover key compromise (a user's device key, a relay's keys), relay breach, personal data leak notification, the per-relay global read-only switch, the per-relay federation kill switch, compromise of the static distributor or release signing key, and the blameless postmortem template. Each runbook has trigger, roles, numbered steps with time targets, verification and communication text. The switches affect only the relay that applies them; no switch reaches other relays or users' vaults. Procedures are practiced in drills and checked by a documentation linter. No claim of external audit or certification is made.

## Responsibilities

- Maintain seven runbooks (RB-01 key compromise, RB-02 relay breach, RB-03 data leak notification, RB-04 read-only switch, RB-05 federation kill switch, RB-06 distributor or release key compromise, RB-07 postmortem) and the incident communication templates.
- Keep each runbook structured as trigger, severity mapping to F16.S03.M02, roles, steps with time targets, verification checks, rollback and communication.
- Define the containment switch contracts that other modules honor (read-only sentinel and federation flag) and their exemptions and propagation targets.
- Run documentation lint in CI (structure, links, referenced capabilities, flags and error codes exist) and require a tabletop drill at least every 6 months and before the first public launch.

## Not responsible for

- Incident records and detection hooks (F16.S03.M02) and the threat register (F16.S03.M01).
- Implementing the read-only check and federation gating (F15.S02.M02 command bus, F15.S04.M02 flags, F11 modules); this module specifies the contract they follow.
- Legal advice and regulator filings; runbooks provide checklists and templates for the operator.
- Future: automated runbook execution from the incident record; status page integration; user-side one-tap key revocation broadcast.

## User stories

- As a relay operator who suspects the relay signing key leaked, I follow RB-01 and rotate within the time targets, and users receive a signed notice from the new key confirmed through a second channel.
- As a relay operator under attack, I switch the relay to read-only in under 5 minutes and everything users already hold on their devices stays usable.
- As an operator after a data leak, I follow RB-03 to decide and record notification within the due times and send a plain notice to affected users.

## Edge cases

- The only admin's credentials are suspected leaked; RB-01 includes a break-glass step using the offline recovery of the relay admin key kept by a second person, and the incident cannot be closed until two admins exist.
- The relay database is unavailable so flags cannot be read; the read-only sentinel is a file or environment value read without the database, so RB-04 still works.
- Federation kill switch applied while outbound deliveries are in flight; in-flight batches finish or abort within 60 seconds and queued deliveries stay in the outbox up to 7 days.
- Users are offline for days; RB-03 and RB-01 notices wait in mailboxes with the relay-signed issue time, and the runbook states that offline users learn later and revocation lag exists.
- Static distributor compromise is suspected but unconfirmed; RB-06 prescribes a safe default of pausing update activation by publishing a signed hold statement and advising users not to update, without declaring a breach prematurely.
- A runbook references a flag or capability that was renamed; the documentation linter fails the CI job with the runbook ID and the missing reference.

## UX and accessibility

- Relay admin containment screen: read-only mode toggle with reason field, federation kill switch toggle with reason field, current status with since-time and who changed it, propagation check result.
- User notice display: relay name, signed statement, what happened, data classes involved, what the user should do, issue time from the relay clock.

**States:** normal; read-only; federation-killed; both; propagating

**Accessibility:** Toggles have text labels stating the effect and a confirmation dialog with focus trap and buttons of at least 44 by 44 px.; Status banners are announced in an aria-live assertive region once on change.; Runbooks are plain markdown with headings, numbered steps and tables with headers.

Documentation and tooling module. Outputs are markdown runbooks RB-01 to RB-07, templates (internal timeline, user notice, postmortem), and a CI lint report. Operator-visible surfaces in the product are the relay admin 'Containment' screen (two switches with status and last change) and the signed notice displayed to users.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

F16.S03.M02, F16.S03.M01, F16.S02.M02, F15.S04.M02, CTR-CAP-001, CTR-FLG-001, CTR-ERR-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-132-01 | [Domain schema](domain_schema.md) | 3 |
| PS-132-02 | [Validation rules](validation_rules.md) | 3 |
| PS-132-03 | [Workflow state machine](workflow_state_machine.md) | 7 |
| PS-132-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-132-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-132-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-132-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-132-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-132-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-132-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `docs/security/response/index.ts`.

## Acceptance criteria

- All automated tests pass in CI and a drill record dated within 6 months exists for the release.
- Read-only mode takes effect within 5 seconds and federation kill within 60 seconds in the staging test.
- Runbooks contain no dangling references and no claim of audit or certification.
