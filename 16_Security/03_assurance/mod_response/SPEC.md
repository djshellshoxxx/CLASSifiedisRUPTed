# F16.S03.M03 — Incident response

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F16.S03](../SPEC.md). **Process IDs:** PS-132-01…PS-132-10. **Code:** `docs/security/response`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Incident response runbooks kept under docs/security/response, written for a relay operator and for users who hold their own keys, and the two relay-local containment switches. Runbooks cover key compromise (a user's device key through the F07 identity flow; a relay's identity key revoked by the compromised key itself naming its successor while the key file is readable, otherwise through its pre-signed revocation certificate, and a new identity), relay breach with a user notice whose data inventory is generated from the module specs, personal data leak notification, the relay-wide read-only switch, the federation kill switch that stops only relay-to-relay traffic, compromise of the static distributor or release signing key, and the blameless postmortem template. Each runbook has trigger, roles, numbered steps with time targets, verification and communication text. The switches are set with security.containment.set by a relay_operator or admin of that relay (or from the host when the database is down), take effect only on that relay, and never reach other relays or users' vaults. Procedures are practiced in drills and checked by a documentation linter. No claim of external audit or certification is made.

## Responsibilities

- Maintain seven runbooks (RB-01 key compromise, RB-02 relay breach, RB-03 data leak notification, RB-04 read-only switch, RB-05 federation kill switch, RB-06 distributor or release key compromise, RB-07 postmortem) and the incident communication templates.
- Keep each runbook structured as trigger, severity mapping to F16.S03.M02, roles, steps with time targets, verification checks, rollback and communication.
- Define and own the containment switch contracts that other modules honor (read-only sentinel, federation kill sentinel), the command security.containment.set, their exemptions by exact command ID and their propagation targets.
- Generate the relay data inventory used by the RB-02 notice from the module specs and run documentation lint in CI (structure, links, referenced capabilities, error codes, modules and inventory exist and match), and require a tabletop drill at least every 6 months and before the first public launch.

## Not responsible for

- Incident records and detection hooks (F16.S03.M02) and the threat register (F16.S03.M01).
- Implementing the read-only check (F15.S02.M02 command bus) and the federation gating (F11.S01.M02 inbox and F11.S02.M01 delivery); this module specifies the contract they follow.
- Relay identity revocation and new identities (F15.S02.M01), device key revocation and rotation (F07.S01.M01, F16.S02.M01) and role bootstrap (F16.S01.M01), which runbooks call.
- Legal advice and regulator filings; runbooks provide checklists and templates for the operator.
- Future: automated runbook execution from the incident record; status page integration; user-side one-tap key revocation broadcast.

## User stories

- As a relay operator who suspects the relay identity key leaked, I follow RB-01 and revoke it with the key itself while its key file is still readable, so the revocation names the successor relayId, or with the pre-signed certificate when it is not, start a new identity within the time targets, and users see the signed notice from the new relay marked unverified until they confirm its fingerprint through a second channel.
- As a member of a relay whose key file was lost with the key, I see the new relay's restore announcement name the old relay although the certificate revocation names no successor, and I still confirm the new fingerprint out of band before my vault uses it.
- As a relay operator under attack, I switch the relay to read-only in under 5 minutes and everything users already hold on their devices stays usable.
- As an operator after a data leak, I follow RB-03 to decide and record notification within the due times and send a plain notice to affected users that lists exactly the data classes the relay held.

## Edge cases

- The only admin's identity is suspected compromised; RB-01 uses the break-glass step relay roles bootstrap --break-glass (security.roleassignment.bootstrap, F16.S01.M01) from the host, then revokes the compromised admin, and the SEV1 incident cannot be closed until two admins exist.
- The relay database is unavailable so roles cannot be checked; classrup-relay containment read-only on --local writes the sentinel with host filesystem access, records the OS user and reason, and the audit entry is appended at the next start.
- Federation kill switch applied while outbound deliveries are in flight; in-flight batches finish or abort within 60 seconds and queued deliveries stay in the outbox up to 7 days, while mailboxes, consent and publishing on the relay keep working.
- Users are offline for days; RB-03 and RB-01 notices wait in mailboxes with the relay-signed issue time, and the runbook states that offline users learn later and revocation lag exists.
- The compromised relay key file is deleted or unreadable (fails checkSecretFile); RB-01 falls back to platform.relay_identity.revoke with useCertificate true, whose revocation carries no successorRelayId, and the operator announces the new fingerprint out of band before users reroute, because only the new identity's relay_restore announcement links the two identities.
- Static distributor compromise is suspected but unconfirmed; RB-06 prescribes a safe default of pausing update activation by publishing a signed hold statement and advising users not to update, without declaring a breach prematurely.
- A runbook references a capability, command or error code that was renamed; the documentation linter fails the CI job with the runbook ID and the missing reference.
- The relay restarts while read-only is active; the sentinel file survives the restart and the relay comes up read-only; an environment value RELAY_CONTAINMENT_READ_ONLY=1 left set re-applies the switch at start and startup warns about it.
- A new module stores push subscriptions on relays but the RB-02 template inventory does not list them; the linter fails with SECURITY_RUNBOOK_INVENTORY_MISMATCH.

## UX and accessibility

- Relay admin containment screen: read-only mode toggle with reason field, federation kill switch toggle with reason field, current status with since-time and who changed it (or the OS user for host changes), propagation check result.
- User notice display: relay name, signed statement, what happened, data classes involved, what the user should do, issue time from the relay clock, and 'unverified until confirmed out of band' for a successor relay.

**States:** normal; read-only; federation-killed; both; propagating

**Accessibility:** Toggles have text labels stating the effect and a confirmation dialog with focus trap and buttons of at least 44 by 44 px.; Status banners are announced in an aria-live assertive region once on change.; Runbooks are plain markdown with headings, numbered steps and tables with headers.

Documentation and tooling module plus one relay command. Outputs are markdown runbooks RB-01 to RB-07, templates (internal timeline, user notice, postmortem), the generated relay data inventory, and a CI lint report. Operator-visible surfaces in the product are the relay admin 'Containment' screen (two switches with status and last change) and the signed notice displayed to users.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: `security.containment.set`
- Queries: `security.containment.get_status`
- Emits: none
- Consumes: none

## Dependencies

F16.S03.M02, F16.S03.M01, F16.S02.M02, F16.S01.M01, F11.S03.M01, F15.S02.M01, CTR-CAP-001, CTR-FLG-001, CTR-ERR-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-132-01 | [Domain schema](domain_schema.md) | 4 |
| PS-132-02 | [Validation rules](validation_rules.md) | 4 |
| PS-132-03 | [Workflow state machine](workflow_state_machine.md) | 7 |
| PS-132-04 | [Commands, queries and events](commands_queries_events.md) | 4 |
| PS-132-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-132-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-132-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-132-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-132-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-132-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `docs/security/response/index.ts`.

## Acceptance criteria

- All automated tests pass in CI and a drill record dated within 6 months exists for the release.
- Read-only mode takes effect within 5 seconds and federation kill within 60 seconds in the staging test, and the kill switch leaves mailboxes and consent working.
- Runbooks contain no dangling references, no claim of audit or certification, and an RB-02 inventory that matches the module specs.
